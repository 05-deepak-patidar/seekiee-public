import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from './db'
import { users, profiles } from './db/schema'
import { eq } from 'drizzle-orm'

export async function getDbUser() {
  const { userId } = await auth()
  if (!userId) return null

  const [existing] = await db.select().from(users).where(eq(users.clerkUserId, userId))
  if (existing) {
    // Self-heal the early-access gate: if the DB row isn't marked approved yet,
    // re-check Clerk publicMetadata directly. This covers the case where the
    // user.updated webhook isn't configured or was missed after you approved
    // them in the Clerk dashboard. Only costs an extra Clerk call for users
    // who aren't approved yet (a small, gated set) — approved users skip it.
    if (!existing.approved) {
      const clerkUser = await currentUser()
      if (clerkUser?.publicMetadata?.approved === true) {
        const [updated] = await db.update(users)
          .set({ approved: true, approvedAt: new Date() })
          .where(eq(users.id, existing.id))
          .returning()
        return updated ?? existing
      }
    }
    return existing
  }

  // Auto-provision: user authenticated via Clerk but not yet in DB
  // (happens before webhook fires, or if webhook was missed)
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null
  const approved = clerkUser.publicMetadata?.approved === true

  const [created] = await db.insert(users)
    .values({ clerkUserId: userId, email, name, approved, approvedAt: approved ? new Date() : null, onboardingDone: false })
    .onConflictDoNothing()
    .returning()

  if (created) {
    // Create empty profile row
    await db.insert(profiles)
      .values({ userId: created.id, fullName: name, email })
      .onConflictDoNothing()
    return created
  }

  // Race condition: another request created it simultaneously
  const [race] = await db.select().from(users).where(eq(users.clerkUserId, userId))
  return race ?? null
}

/**
 * Returns the DB user only if they exist AND have been granted early access.
 * Throws otherwise — use this as the guard for every API route and page body.
 * Pending (unapproved) users are redirected to /pending by the (app) layout
 * before any page body runs; this is the belt-and-suspenders guard that also
 * blocks direct API calls from unapproved sessions.
 */
export async function requireDbUser() {
  const user = await getDbUser()
  if (!user) throw new Error('Unauthorized')
  if (!user.approved) throw new Error('Forbidden: account pending approval')
  return user
}

/** Like getDbUser but never throws — for the access gate to branch on. */
export async function getAccessState() {
  const user = await getDbUser()
  if (!user) return { signedIn: false, approved: false, user: null } as const
  return { signedIn: true, approved: user.approved, user } as const
}

export async function getProfile() {
  const user = await requireDbUser()
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id))
  return { user, profile: profile ?? null }
}
