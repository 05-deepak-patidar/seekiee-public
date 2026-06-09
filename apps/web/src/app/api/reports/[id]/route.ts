import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { reports } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireDbUser()
  const { id } = await params

  const [report] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, id), eq(reports.userId, user.id)))

  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    id: report.id,
    company: report.company,
    role: report.role,
    score: report.score,
    jobUrl: report.jobUrl,
    legitimacyTier: report.legitimacyTier,
    reportMd: report.reportMd,
    createdAt: report.createdAt,
  })
}
