import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await requireDbUser()
  const [profile] = await db.select({
    cvText: profiles.cvText,
    cvUpdatedAt: profiles.cvUpdatedAt,
    fullName: profiles.fullName,
  }).from(profiles).where(eq(profiles.userId, user.id))

  return NextResponse.json({
    cvText: profile?.cvText ?? '',
    cvUpdatedAt: profile?.cvUpdatedAt ?? null,
    fullName: profile?.fullName ?? '',
  })
}

export async function PATCH(req: Request) {
  const user = await requireDbUser()
  const { cvText } = await req.json()

  await db.update(profiles)
    .set({ cvText, cvUpdatedAt: new Date(), updatedAt: new Date() })
    .where(eq(profiles.userId, user.id))

  return NextResponse.json({ ok: true })
}
