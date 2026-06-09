import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { interviewPrep, applications, reports, profiles } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function GET(req: Request) {
  const user = await requireDbUser()
  const applicationId = new URL(req.url).searchParams.get('applicationId')

  if (!applicationId) {
    const rows = await db
      .select()
      .from(interviewPrep)
      .where(eq(interviewPrep.userId, user.id))
      .orderBy(desc(interviewPrep.createdAt))
    return NextResponse.json(rows)
  }

  const [app] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, applicationId!), eq(applications.userId, user.id)))
  if (!app) return new Response('Not found', { status: 404 })

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id))
  const cvText = profile?.cvText ?? ''
  const candidateName = profile?.fullName ?? 'Candidate'

  let reportMd = ''
  if (app.reportId) {
    const [rep] = await db.select({ reportMd: reports.reportMd }).from(reports).where(eq(reports.id, app.reportId))
    if (rep?.reportMd) reportMd = rep.reportMd
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return new Response('GEMINI_API_KEY not configured', { status: 500 })

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are a senior interview coach. Generate a comprehensive interview prep guide for ${candidateName} interviewing at ${app.company} for the ${app.role} role.

CV SUMMARY:
${cvText.slice(0, 4000)}

${reportMd ? `JOB EVALUATION CONTEXT:\n${reportMd.slice(0, 5000)}\n\n` : ''}

Create a detailed interview prep guide with these sections:

## Company & Role Intelligence
Summarize the company, culture signals, and what this role entails based on the JD.

## 6 Likely Interview Questions
For each question: the question, why they ask it, and a model answer using the candidate's CV.

## STAR Story Angles
Map 5 behavioral stories from the candidate's CV to likely STAR questions for this role.

## Compensation Negotiation Script
Based on the role level and market data, provide a script for negotiating compensation.

## Red Flags to Address
List any potential concerns the interviewer might have and how to address them proactively.`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (e: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`))

      try {
        enqueue({ type: 'log', text: `Preparing interview guide for ${app.company}...` })
        enqueue({ type: 'log', text: 'Analyzing job requirements and your CV...' })

        const streamResult = await model.generateContentStream(prompt)
        let fullText = ''

        enqueue({ type: 'log', text: 'Generating company intelligence...' })

        for await (const chunk of streamResult.stream) {
          const text = chunk.text()
          if (!text) continue
          fullText += text

          if (fullText.includes('## 6 Likely') && !fullText.includes('questions_done')) {
            enqueue({ type: 'log', text: 'Building question bank...' })
          }
          if (fullText.includes('## STAR') && !fullText.includes('star_done')) {
            enqueue({ type: 'log', text: 'Mapping STAR stories...' })
          }
          if (fullText.includes('## Compensation') && !fullText.includes('comp_done')) {
            enqueue({ type: 'log', text: 'Drafting negotiation script...' })
          }
        }

        enqueue({ type: 'log', text: 'Saving prep guide...' })

        const [saved] = await db
          .insert(interviewPrep)
          .values({
            userId: user.id,
            applicationId: app.id,
            company: app.company,
            role: app.role,
            prepMd: fullText,
          })
          .returning()

        enqueue({ type: 'done', prepId: saved.id })
      } catch (err) {
        enqueue({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}
