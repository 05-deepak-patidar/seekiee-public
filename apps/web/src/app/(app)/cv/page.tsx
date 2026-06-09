import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { CvEditor } from '@/components/cv/cv-editor'
import { FileText } from 'lucide-react'

export default async function CvPage() {
  const user = await requireDbUser()
  const [profile] = await db.select({
    cvText: profiles.cvText,
    cvUpdatedAt: profiles.cvUpdatedAt,
    fullName: profiles.fullName,
  }).from(profiles).where(eq(profiles.userId, user.id))

  return (
    <div style={{ padding: '2rem', height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <FileText size={20} style={{ color: 'var(--brand-orange)' }} />
        <h1 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.5rem' }}>
          CV Editor
        </h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
        Edit your CV in markdown. Auto-saved. Generate PDF when ready.
      </p>

      <CvEditor
        initialCv={profile?.cvText ?? ''}
        lastSaved={profile?.cvUpdatedAt ?? null}
        fullName={profile?.fullName ?? ''}
      />
    </div>
  )
}
