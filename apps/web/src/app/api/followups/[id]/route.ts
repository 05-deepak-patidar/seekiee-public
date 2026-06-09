import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { followups } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireDbUser()
  const { id } = await params
  const body = await req.json() as { sentDate?: string; channel?: string; contact?: string; notes?: string }

  const [updated] = await db
    .update(followups)
    .set({
      ...(body.sentDate !== undefined && { sentDate: body.sentDate }),
      ...(body.channel !== undefined && { channel: body.channel }),
      ...(body.contact !== undefined && { contact: body.contact }),
      ...(body.notes !== undefined && { notes: body.notes }),
    })
    .where(and(eq(followups.id, id), eq(followups.userId, user.id)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireDbUser()
  const { id } = await params

  await db
    .delete(followups)
    .where(and(eq(followups.id, id), eq(followups.userId, user.id)))

  return NextResponse.json({ ok: true })
}
