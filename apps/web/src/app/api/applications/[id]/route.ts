import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { applications } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireDbUser()
  const { id } = await params
  const body = await req.json()

  const allowed = ['status', 'notes', 'pdfUrl', 'score']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  updates.updatedAt = new Date()

  const [updated] = await db.update(applications)
    .set(updates)
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)))
    .returning()

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireDbUser()
  const { id } = await params
  await db.delete(applications).where(and(eq(applications.id, id), eq(applications.userId, user.id)))
  return NextResponse.json({ ok: true })
}
