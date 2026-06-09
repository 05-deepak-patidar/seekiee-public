import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { applications, reports, profiles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET(req: Request) {
  const user = await requireDbUser()
  const applicationId = new URL(req.url).searchParams.get('applicationId')
  if (!applicationId) return NextResponse.json({ error: 'applicationId required' }, { status: 400 })

  const [app] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, user.id)))
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id))
  const candidateName = profile?.fullName ?? 'the candidate'

  let reportSummary = ''
  if (app.reportId) {
    const [rep] = await db.select({ reportMd: reports.reportMd }).from(reports).where(eq(reports.id, app.reportId))
    if (rep?.reportMd) reportSummary = rep.reportMd.slice(0, 3000)
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are a job search assistant. Draft a professional follow-up for ${candidateName} who applied to ${app.company} for the ${app.role} role.

${reportSummary ? `Context from the job evaluation:\n${reportSummary}\n\n` : ''}Write two follow-up messages:

1. EMAIL: A 3-paragraph professional follow-up email (subject line + body). Professional, warm, and specific to the role. Express continued interest, briefly mention one key strength match, and offer next steps.

2. LINKEDIN: A 2-sentence LinkedIn message. Concise, professional, referencing the application.

Format exactly as:
EMAIL SUBJECT: <subject line>
EMAIL BODY:
<email body>

LINKEDIN MESSAGE:
<linkedin message>`

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  const subjectMatch = text.match(/EMAIL SUBJECT:\s*(.+)/)
  const emailBodyMatch = text.match(/EMAIL BODY:\s*([\s\S]+?)(?=LINKEDIN MESSAGE:|$)/i)
  const linkedinMatch = text.match(/LINKEDIN MESSAGE:\s*([\s\S]+)/i)

  return NextResponse.json({
    subject: subjectMatch?.[1]?.trim() ?? `Following up: ${app.role} at ${app.company}`,
    email: emailBodyMatch?.[1]?.trim() ?? text,
    linkedin: linkedinMatch?.[1]?.trim() ?? '',
  })
}
