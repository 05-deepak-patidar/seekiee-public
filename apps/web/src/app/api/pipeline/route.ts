import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { pipelineItems, reports } from '@/lib/db/schema'
import { eq, inArray, desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await requireDbUser()

  const items = await db
    .select()
    .from(pipelineItems)
    .where(eq(pipelineItems.userId, user.id))
    .orderBy(desc(pipelineItems.createdAt))

  const reportIds = items.map(i => i.reportId).filter(Boolean) as string[]
  const reportMap = new Map<string, { company: string | null; role: string | null; score: string | null }>()

  if (reportIds.length > 0) {
    const reportRows = await db
      .select({ id: reports.id, company: reports.company, role: reports.role, score: reports.score })
      .from(reports)
      .where(inArray(reports.id, reportIds))
    for (const r of reportRows) reportMap.set(r.id, r)
  }

  return NextResponse.json(items.map(item => ({
    ...item,
    report: item.reportId ? reportMap.get(item.reportId) ?? null : null,
  })))
}

export async function POST(req: Request) {
  const user = await requireDbUser()
  const { urls } = await req.json() as { urls: string[] }

  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'urls array required' }, { status: 400 })
  }

  const existingUrls = new Set(
    (await db
      .select({ jobUrl: pipelineItems.jobUrl })
      .from(pipelineItems)
      .where(eq(pipelineItems.userId, user.id))
    ).map(r => r.jobUrl)
  )

  const newUrls = urls.map(u => u.trim()).filter(u => u && !existingUrls.has(u))
  if (newUrls.length === 0) {
    return NextResponse.json({ inserted: 0, skipped: urls.length })
  }

  const inserted = await db
    .insert(pipelineItems)
    .values(newUrls.map(u => ({ userId: user.id, jobUrl: u, status: 'pending' })))
    .returning()

  return NextResponse.json({ inserted: inserted.length, skipped: urls.length - newUrls.length, items: inserted })
}
