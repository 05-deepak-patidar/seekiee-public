import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { pipelineItems } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireDbUser()
  const { id } = await params
  const body = await req.json() as { status?: string; reportId?: string; errorMsg?: string }

  const [updated] = await db
    .update(pipelineItems)
    .set({
      ...(body.status !== undefined && { status: body.status }),
      ...(body.reportId !== undefined && { reportId: body.reportId }),
      ...(body.errorMsg !== undefined && { errorMsg: body.errorMsg }),
    })
    .where(and(eq(pipelineItems.id, id), eq(pipelineItems.userId, user.id)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireDbUser()
  const { id } = await params

  await db
    .delete(pipelineItems)
    .where(and(eq(pipelineItems.id, id), eq(pipelineItems.userId, user.id)))

  return NextResponse.json({ ok: true })
}
