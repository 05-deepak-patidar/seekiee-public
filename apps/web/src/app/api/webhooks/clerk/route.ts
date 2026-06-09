import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { db } from '@/lib/db'
import { users, profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

type ClerkUserEvent = {
  type: string
  data: {
    id: string
    email_addresses: { email_address: string }[]
    first_name?: string
    last_name?: string
    public_metadata?: { approved?: boolean }
  }
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  const payload = await req.text()

  // If no secret configured, skip verification (webhook not yet set up in Clerk dashboard)
  if (secret) {
    const wh = new Webhook(secret)
    const hdrs = await headers()
    try {
      wh.verify(payload, {
        'svix-id':        hdrs.get('svix-id') ?? '',
        'svix-timestamp': hdrs.get('svix-timestamp') ?? '',
        'svix-signature': hdrs.get('svix-signature') ?? '',
      })
    } catch {
      return new Response('Invalid signature', { status: 400 })
    }
  }

  const event = JSON.parse(payload) as ClerkUserEvent
  const { type, data } = event

  if (type === 'user.created') {
    const email = data.email_addresses[0]?.email_address ?? ''
    const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null
    const approved = data.public_metadata?.approved === true

    const [user] = await db.insert(users)
      .values({ clerkUserId: data.id, email, name, approved, approvedAt: approved ? new Date() : null })
      .onConflictDoNothing()
      .returning()

    if (user) {
      await db.insert(profiles)
        .values({ userId: user.id, email, fullName: name })
        .onConflictDoNothing()
    }
  }

  // Fired when you approve (or revoke) someone in the Clerk dashboard by
  // setting publicMetadata.approved. Keeps the early-access gate in sync.
  if (type === 'user.updated') {
    const approved = data.public_metadata?.approved === true
    const email = data.email_addresses[0]?.email_address
    const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null

    await db.update(users)
      .set({
        approved,
        approvedAt: approved ? new Date() : null,
        ...(email ? { email } : {}),
        name,
      })
      .where(eq(users.clerkUserId, data.id))
  }

  if (type === 'user.deleted') {
    await db.delete(users).where(eq(users.clerkUserId, data.id))
  }

  return new Response('OK')
}
