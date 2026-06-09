import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { storyBank } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireDbUser()
  const { id } = await params
  const body = await req.json() as {
    title?: string; situation?: string; task?: string
    action?: string; result?: string; reflection?: string; tags?: string[]
  }

  const [updated] = await db
    .update(storyBank)
    .set({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.situation !== undefined && { situation: body.situation }),
      ...(body.task !== undefined && { task: body.task }),
      ...(body.action !== undefined && { action: body.action }),
      ...(body.result !== undefined && { result: body.result }),
      ...(body.reflection !== undefined && { reflection: body.reflection }),
      ...(body.tags !== undefined && { tags: body.tags }),
    })
    .where(and(eq(storyBank.id, id), eq(storyBank.userId, user.id)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireDbUser()
  const { id } = await params

  await db
    .delete(storyBank)
    .where(and(eq(storyBank.id, id), eq(storyBank.userId, user.id)))

  return NextResponse.json({ ok: true })
}
