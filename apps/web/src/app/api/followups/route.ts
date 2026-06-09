import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { followups, applications } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await requireDbUser()

  const rows = await db
    .select()
    .from(followups)
    .where(eq(followups.userId, user.id))

  const appIds = rows.map(r => r.applicationId).filter(Boolean) as string[]
  const appMap = new Map<string, { company: string; role: string; status: string; appliedDate: string | null; jobUrl: string | null }>()

  if (appIds.length > 0) {
    const appRows = await db
      .select({ id: applications.id, company: applications.company, role: applications.role, status: applications.status, appliedDate: applications.appliedDate, jobUrl: applications.jobUrl })
      .from(applications)
      .where(inArray(applications.id, appIds))
    for (const a of appRows) appMap.set(a.id, a)
  }

  return NextResponse.json(rows.map(f => ({
    ...f,
    application: f.applicationId ? appMap.get(f.applicationId) ?? null : null,
  })))
}

export async function POST(req: Request) {
  const user = await requireDbUser()
  const { applicationId, sentDate, channel, contact, notes } = await req.json()

  const [created] = await db
    .insert(followups)
    .values({ userId: user.id, applicationId: applicationId ?? null, sentDate: sentDate ?? null, channel: channel ?? null, contact: contact ?? null, notes: notes ?? null })
    .returning()

  return NextResponse.json(created)
}
