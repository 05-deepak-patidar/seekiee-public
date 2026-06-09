import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { portalsConfig, scanResults, scanRuns } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { ScanClient } from '@/components/scan/scan-client'

export default async function ScanPage() {
  const user = await requireDbUser()

  const [portals, results, runs] = await Promise.all([
    db.select().from(portalsConfig).where(eq(portalsConfig.userId, user.id)).orderBy(desc(portalsConfig.createdAt)),
    db.select().from(scanResults).where(eq(scanResults.userId, user.id)).orderBy(desc(scanResults.createdAt)),
    db.select().from(scanRuns).where(eq(scanRuns.userId, user.id)).orderBy(desc(scanRuns.startedAt)),
  ])

  return (
    <ScanClient
      initialPortals={portals.map(p => ({ ...p, createdAt: undefined }))}
      initialResults={results.map(r => ({ ...r, createdAt: r.createdAt?.toISOString() ?? null }))}
      initialRuns={runs.slice(0, 10).map(r => ({
        ...r,
        startedAt: r.startedAt?.toISOString() ?? null,
        completedAt: r.completedAt?.toISOString() ?? null,
      }))}
    />
  )
}
