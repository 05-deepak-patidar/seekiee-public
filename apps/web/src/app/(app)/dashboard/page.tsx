import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { applications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { LayoutDashboard } from 'lucide-react'

export default async function DashboardPage() {
  const user = await requireDbUser()

  const apps = await db.select({
    id: applications.id,
    company: applications.company,
    role: applications.role,
    score: applications.score,
    status: applications.status,
    createdAt: applications.createdAt,
    updatedAt: applications.updatedAt,
  }).from(applications).where(eq(applications.userId, user.id))

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <LayoutDashboard size={20} style={{ color: 'var(--brand-orange)' }} />
        <h1 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.5rem' }}>
          Dashboard
        </h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
        Your job search at a glance.
      </p>

      <DashboardClient apps={apps as any} userName={user.name ?? 'there'} />
    </div>
  )
}
