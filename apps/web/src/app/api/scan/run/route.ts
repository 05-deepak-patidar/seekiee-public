import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { portalsConfig, scanRuns, scanResults } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'
export const maxDuration = 120

type GreenhouseJob = { id: number; title: string; location: { name: string }; absolute_url: string }
type LeverJob = { id: string; text: string; categories: { location?: string }; hostedUrl: string }
type AshbyJob = { id: string; title: string; location?: string; isListed: boolean; externalLink?: string; jobUrl?: string }

async function fetchGreenhouse(boardToken: string): Promise<{ title: string; url: string; location: string }[]> {
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs`, {
    headers: { 'User-Agent': 'Seekiee/1.0' },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return []
  const data = await res.json() as { jobs: GreenhouseJob[] }
  return (data.jobs ?? []).map(j => ({ title: j.title, url: j.absolute_url, location: j.location?.name ?? '' }))
}

async function fetchLever(companySlug: string): Promise<{ title: string; url: string; location: string }[]> {
  const res = await fetch(`https://api.lever.co/v0/postings/${companySlug}?mode=json`, {
    headers: { 'User-Agent': 'Seekiee/1.0' },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return []
  const data = await res.json() as LeverJob[]
  return (Array.isArray(data) ? data : []).map(j => ({
    title: j.text,
    url: j.hostedUrl,
    location: j.categories?.location ?? '',
  }))
}

async function fetchAshby(orgId: string): Promise<{ title: string; url: string; location: string }[]> {
  const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${orgId}`, {
    headers: { 'User-Agent': 'Seekiee/1.0' },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return []
  const data = await res.json() as { jobPostings: AshbyJob[] }
  return (data.jobPostings ?? [])
    .filter(j => j.isListed)
    .map(j => ({
      title: j.title,
      url: j.externalLink ?? j.jobUrl ?? '',
      location: j.location ?? '',
    }))
}

function matchesLocationFilter(location: string, filter: unknown): boolean {
  if (!filter || !location) return true
  const f = filter as { includes?: string[] }
  if (!f.includes || f.includes.length === 0) return true
  const loc = location.toLowerCase()
  return f.includes.some(term => loc.includes(term.toLowerCase()))
}

export async function GET(req: Request) {
  const user = await requireDbUser()
  const titleFilter = new URL(req.url).searchParams.get('titleFilter') ?? ''

  const portals = await db
    .select()
    .from(portalsConfig)
    .where(eq(portalsConfig.userId, user.id))

  const enabledPortals = portals.filter(p => p.enabled)
  if (enabledPortals.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No enabled portals. Add companies to scan first.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const existingUrls = new Set(
    (await db
      .select({ jobUrl: scanResults.jobUrl })
      .from(scanResults)
      .where(eq(scanResults.userId, user.id))
    ).map(r => r.jobUrl).filter(Boolean) as string[]
  )

  const [run] = await db
    .insert(scanRuns)
    .values({ userId: user.id, status: 'running' })
    .returning()

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (e: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`))

      let totalFound = 0
      let totalNew = 0

      try {
        for (const portal of enabledPortals) {
          if (!portal.apiUrl || !portal.provider) continue
          enqueue({ type: 'log', text: `Scanning ${portal.companyName} (${portal.provider})...` })

          let jobs: { title: string; url: string; location: string }[] = []

          try {
            if (portal.provider === 'greenhouse') jobs = await fetchGreenhouse(portal.apiUrl)
            else if (portal.provider === 'lever') jobs = await fetchLever(portal.apiUrl)
            else if (portal.provider === 'ashby') jobs = await fetchAshby(portal.apiUrl)
          } catch {
            enqueue({ type: 'log', text: `  ⚠ Failed to fetch ${portal.companyName}` })
            continue
          }

          const filtered = jobs.filter(j => {
            if (!j.url) return false
            if (titleFilter && !j.title.toLowerCase().includes(titleFilter.toLowerCase())) return false
            if (!matchesLocationFilter(j.location, portal.locationFilter)) return false
            return true
          })

          const newJobs = filtered.filter(j => !existingUrls.has(j.url))
          totalFound += filtered.length
          totalNew += newJobs.length

          if (newJobs.length > 0) {
            await db.insert(scanResults).values(
              newJobs.map(j => ({
                scanRunId: run.id,
                userId: user.id,
                company: portal.companyName,
                jobTitle: j.title,
                jobUrl: j.url,
                location: j.location,
                addedToPipeline: false,
              }))
            )
            for (const j of newJobs) existingUrls.add(j.url)
          }

          enqueue({ type: 'company_done', company: portal.companyName, found: filtered.length, new: newJobs.length })
        }

        await db
          .update(scanRuns)
          .set({
            completedAt: new Date(),
            status: 'done',
            companiesScanned: enabledPortals.length,
            jobsFound: totalFound,
            jobsNew: totalNew,
          })
          .where(eq(scanRuns.id, run.id))

        enqueue({ type: 'done', runId: run.id, jobsFound: totalFound, jobsNew: totalNew })
      } catch (err) {
        await db.update(scanRuns).set({ status: 'error' }).where(eq(scanRuns.id, run.id))
        enqueue({ type: 'error', message: err instanceof Error ? err.message : 'Scan failed' })
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
