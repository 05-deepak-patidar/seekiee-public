import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { pipelineItems, reports } from '@/lib/db/schema'
import { eq, inArray, desc } from 'drizzle-orm'
import { PipelineClient } from '@/components/pipeline/pipeline-client'

export default async function PipelinePage() {
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

  const initialItems = items.map(item => ({
    ...item,
    createdAt: item.createdAt?.toISOString() ?? null,
    report: item.reportId ? reportMap.get(item.reportId) ?? null : null,
  }))

  return <PipelineClient initialItems={initialItems} />
}
