import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { storyBank, interviewPrep, applications } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { InterviewClient } from '@/components/interview/interview-client'

export default async function InterviewPage() {
  const user = await requireDbUser()

  const [stories, preps, allApps] = await Promise.all([
    db.select().from(storyBank).where(eq(storyBank.userId, user.id)).orderBy(desc(storyBank.createdAt)),
    db.select().from(interviewPrep).where(eq(interviewPrep.userId, user.id)).orderBy(desc(interviewPrep.createdAt)),
    db.select({ id: applications.id, company: applications.company, role: applications.role })
      .from(applications)
      .where(eq(applications.userId, user.id)),
  ])

  const initialStories = stories.map(s => ({
    ...s,
    createdAt: s.createdAt?.toISOString() ?? null,
  }))

  const initialPreps = preps.map(p => ({
    ...p,
    createdAt: p.createdAt?.toISOString() ?? null,
  }))

  return (
    <InterviewClient
      initialStories={initialStories}
      initialPreps={initialPreps}
      applications={allApps}
    />
  )
}
