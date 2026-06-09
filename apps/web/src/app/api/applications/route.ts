import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { applications, reports } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await requireDbUser()
  const rows = await db.select().from(applications).where(eq(applications.userId, user.id))
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const user = await requireDbUser()
  const { reportId, notes, status } = await req.json()

  let reportData: { company: string; role: string; score: string | null; jobUrl: string | null } | null = null
  if (reportId) {
    const [r] = await db.select().from(reports).where(and(eq(reports.id, reportId), eq(reports.userId, user.id)))
    if (r) reportData = { company: r.company ?? '', role: r.role ?? '', score: r.score, jobUrl: r.jobUrl }
  }

  const existing = await db.select({ count: applications.id }).from(applications).where(eq(applications.userId, user.id))
  const seqNum = (existing.length ?? 0) + 1

  const [app] = await db.insert(applications).values({
    userId: user.id,
    seqNum,
    company: reportData?.company ?? '',
    role: reportData?.role ?? '',
    score: reportData?.score,
    status: status ?? 'evaluated',
    jobUrl: reportData?.jobUrl,
    reportId: reportId ?? null,
    notes: notes ?? null,
    appliedDate: new Date().toISOString().slice(0, 10),
  }).returning()

  return NextResponse.json(app)
}
