import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { followups, applications } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { FollowupClient } from '@/components/followup/followup-client'

export default async function FollowupPage() {
  const user = await requireDbUser()

  const [allFollowups, allApps] = await Promise.all([
    db.select().from(followups).where(eq(followups.userId, user.id)),
    db.select().from(applications).where(eq(applications.userId, user.id)),
  ])

  const appIds = allFollowups.map(f => f.applicationId).filter(Boolean) as string[]
  const appMap = new Map<string, { company: string; role: string; status: string; appliedDate: string | null }>()
  if (appIds.length > 0) {
    const rows = await db
      .select({ id: applications.id, company: applications.company, role: applications.role, status: applications.status, appliedDate: applications.appliedDate })
      .from(applications)
      .where(inArray(applications.id, appIds))
    for (const a of rows) appMap.set(a.id, a)
  }

  const initialFollowups = allFollowups.map(f => ({
    ...f,
    application: f.applicationId ? appMap.get(f.applicationId) ?? null : null,
  }))

  const activeApps = allApps.filter(a =>
    ['Applied', 'applied', 'Responded', 'responded', 'Interview', 'interview', 'Offer', 'offer'].includes(a.status)
  ).map(a => ({
    id: a.id,
    company: a.company,
    role: a.role,
    status: a.status,
    appliedDate: a.appliedDate,
    jobUrl: a.jobUrl,
  }))

  return <FollowupClient initialFollowups={initialFollowups} activeApplications={activeApps} />
}
