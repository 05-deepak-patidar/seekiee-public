import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { scanResults, scanRuns, pipelineItems } from '@/lib/db/schema'
import { eq, inArray, desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await requireDbUser()

  const [results, runs] = await Promise.all([
    db
      .select()
      .from(scanResults)
      .where(eq(scanResults.userId, user.id))
      .orderBy(desc(scanResults.createdAt)),
    db
      .select()
      .from(scanRuns)
      .where(eq(scanRuns.userId, user.id))
      .orderBy(desc(scanRuns.startedAt)),
  ])

  return NextResponse.json({ results, runs: runs.slice(0, 10) })
}

export async function POST(req: Request) {
  const user = await requireDbUser()
  const { resultIds } = await req.json() as { resultIds: string[] }

  if (!Array.isArray(resultIds) || resultIds.length === 0) {
    return NextResponse.json({ error: 'resultIds array required' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(scanResults)
    .where(inArray(scanResults.id, resultIds))

  const validRows = rows.filter(r => r.userId === user.id && r.jobUrl)

  const existingUrls = new Set(
    (await db
      .select({ jobUrl: pipelineItems.jobUrl })
      .from(pipelineItems)
      .where(eq(pipelineItems.userId, user.id))
    ).map(r => r.jobUrl)
  )

  const newRows = validRows.filter(r => !existingUrls.has(r.jobUrl!))

  if (newRows.length > 0) {
    await db.insert(pipelineItems).values(
      newRows.map(r => ({
        userId: user.id,
        jobUrl: r.jobUrl!,
        companyHint: r.company,
        roleHint: r.jobTitle,
        status: 'pending',
      }))
    )

    await db
      .update(scanResults)
      .set({ addedToPipeline: true })
      .where(inArray(scanResults.id, newRows.map(r => r.id)))
  }

  return NextResponse.json({ added: newRows.length, skipped: validRows.length - newRows.length })
}
