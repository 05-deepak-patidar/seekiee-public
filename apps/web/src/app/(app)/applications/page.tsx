import { ApplicationsClient } from '@/components/applications/applications-client'
import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { applications, reports } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { Briefcase } from 'lucide-react'

export default async function ApplicationsPage() {
  const user = await requireDbUser()

  const rows = await db
    .select({
      id: applications.id,
      seqNum: applications.seqNum,
      company: applications.company,
      role: applications.role,
      score: applications.score,
      status: applications.status,
      pdfUrl: applications.pdfUrl,
      jobUrl: applications.jobUrl,
      notes: applications.notes,
      createdAt: applications.createdAt,
      updatedAt: applications.updatedAt,
      reportId: applications.reportId,
    })
    .from(applications)
    .where(eq(applications.userId, user.id))
    .orderBy(desc(applications.createdAt))

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <Briefcase size={20} style={{ color: 'var(--brand-orange)' }} />
        <h1 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.5rem' }}>
          Applications
        </h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        {rows.length} total · track and manage your job applications
      </p>

      <ApplicationsClient initialData={rows as any} />
    </div>
  )
}
