import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { users, profiles, reports } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'
export const maxDuration = 120

async function fetchJobDescription(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Seekiee/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    const html = await res.text()
    return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12000)
  } catch {
    throw new Error('Could not fetch the job URL. Please paste the job description instead.')
  }
}

function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length
}

function buildPrompt(cvText: string, profileName: string, jd: string): string {
  return `You are Seekiee, an AI job search analyst. Evaluate the given job description against this candidate's CV and profile.

CANDIDATE: ${profileName}

CV:
${cvText.slice(0, 6000)}

JOB DESCRIPTION:
${jd.slice(0, 8000)}

Evaluate in 7 blocks (A through G). For each block, output clear markdown.

Block A: Role Summary — archetype, domain, function, seniority, remote policy, TL;DR table
Block B: CV Match — table mapping each JD requirement to exact CV evidence; then list gaps with severity (hard/soft) and mitigation
Block C: Level & Strategy — detected role level vs candidate level, "sell senior" positioning plan
Block D: Compensation — market salary ranges (cite sources), demand trend
Block E: Personalization Plan — top 5 CV edits to maximize match
Block F: Interview Prep — 6 STAR+R story angles mapped to JD requirements
Block G: Posting Legitimacy — assess if this is a real open role (High Confidence / Caution / Suspicious)

End with a ## Machine Summary section containing YAML:
\`\`\`yaml
company: <name>
role: <title>
score: <0.0-5.0>
legitimacy_tier: <high|caution|suspicious>
archetype: <archetype>
final_decision: <yes|maybe|no>
hard_stops: []
soft_gaps: []
top_strengths: []
\`\`\`

SCORING (0.0-5.0): 4.5+ = strong match, 4.0-4.4 = worth applying, 3.5-3.9 = borderline, below 3.5 = don't apply.
Weigh: CV match (25%), role fit (25%), comp (10%), culture signals (10%), red flags (30% penalty).
Be direct and honest. Discourage weak matches.`
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const url = new URL(req.url).searchParams.get('url')
  const jdText = new URL(req.url).searchParams.get('jd')

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (e: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`))

      // Heartbeat every 15s — prevents Vercel's idle TCP timeout from killing the SSE stream mid-evaluation
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(': heartbeat\n\n')) } catch { clearInterval(heartbeat) }
      }, 15000)

      try {
        // Get user + profile
        const [user] = await db.select().from(users).where(eq(users.clerkUserId, userId))
        if (!user) { enqueue({ type: 'error', message: 'User not found' }); controller.close(); return }

        const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id))
        const cvText = profile?.cvText ?? ''
        const profileName = profile?.fullName ?? 'Candidate'

        if (!cvText) {
          enqueue({ type: 'error', message: 'No CV found. Please add your CV in the CV editor first.' })
          controller.close()
          return
        }

        // Fetch JD
        let jd = jdText ?? ''
        if (url && !jd) {
          enqueue({ type: 'log', text: `Fetching job description from ${new URL(url).hostname}...` })
          jd = await fetchJobDescription(url)
          enqueue({ type: 'log', text: `Job description extracted (${wordCount(jd)} words)` })
        } else {
          enqueue({ type: 'log', text: `Job description received (${wordCount(jd)} words)` })
        }

        enqueue({ type: 'log', text: `Reading CV: ${profileName}` })
        enqueue({ type: 'log', text: 'Building evaluation prompt...' })

        // Run Gemini evaluation (free tier: gemini-2.5-flash, 1M tokens/day)
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
          enqueue({ type: 'error', message: 'GEMINI_API_KEY is not configured. Get a free key at aistudio.google.com/apikey' })
          controller.close()
          return
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const blockNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
        let currentBlock = 0
        let fullResponse = ''

        enqueue({ type: 'block_start', block: 'A' })
        enqueue({ type: 'log', text: 'Analyzing role summary...' })

        const streamResult = await model.generateContentStream(buildPrompt(cvText, profileName, jd))

        for await (const chunk of streamResult.stream) {
          const text = chunk.text()
          if (!text) continue
          fullResponse += text
          enqueue({ type: 'chunk', text })

          // Detect block transitions
          const blockMatch = text.match(/^##?\s+Block\s+([B-G])\b/m)
          if (blockMatch) {
            const newBlock = blockNames.indexOf(blockMatch[1])
            if (newBlock > currentBlock) {
              enqueue({ type: 'block_done', block: blockNames[currentBlock] })
              currentBlock = newBlock
              enqueue({ type: 'block_start', block: blockNames[currentBlock] })
              const logMap: Record<string, string> = {
                B: 'Analyzing CV match...', C: 'Evaluating level & strategy...',
                D: 'Researching compensation data...', E: 'Building personalization plan...',
                F: 'Preparing interview prep...', G: 'Assessing posting legitimacy...',
              }
              enqueue({ type: 'log', text: logMap[blockNames[currentBlock]] ?? `Processing block ${blockNames[currentBlock]}...` })
            }
          }
        }

        enqueue({ type: 'block_done', block: blockNames[currentBlock] })

        // Extract score from Machine Summary YAML
        const scoreMatch = fullResponse.match(/score:\s*([\d.]+)/)
        const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0
        const companyMatch = fullResponse.match(/company:\s*(.+)/)
        const roleMatch = fullResponse.match(/role:\s*(.+)/)
        const tierMatch = fullResponse.match(/legitimacy_tier:\s*(.+)/)
        const archetypeMatch = fullResponse.match(/archetype:\s*(.+)/)

        enqueue({ type: 'log', text: `Score: ${score}/5 — ${score >= 4.5 ? 'Strong match' : score >= 4.0 ? 'Worth applying' : score >= 3.5 ? 'Borderline' : 'Weak match — reconsider'}` })

        // Save report to DB
        const seqResult = await db.select({ count: reports.id }).from(reports).where(eq(reports.userId, user.id))
        const seqNum = (seqResult.length ?? 0) + 1

        const [saved] = await db.insert(reports).values({
          userId: user.id,
          seqNum,
          company:        companyMatch?.[1]?.trim() ?? '',
          role:           roleMatch?.[1]?.trim() ?? '',
          jobUrl:         url ?? '',
          score:          score.toString(),
          archetype:      archetypeMatch?.[1]?.trim() ?? '',
          legitimacyTier: tierMatch?.[1]?.trim() ?? '',
          reportMd:       fullResponse,
        }).returning()

        enqueue({ type: 'done', reportId: saved.id, score })
      } catch (err) {
        enqueue({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
      } finally {
        clearInterval(heartbeat)
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
