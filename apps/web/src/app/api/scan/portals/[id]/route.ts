import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { portalsConfig } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireDbUser()
  const { id } = await params
  const body = await req.json() as { enabled?: boolean; locationFilter?: unknown }

  const [updated] = await db
    .update(portalsConfig)
    .set({
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      ...(body.locationFilter !== undefined && { locationFilter: body.locationFilter }),
    })
    .where(and(eq(portalsConfig.id, id), eq(portalsConfig.userId, user.id)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireDbUser()
  const { id } = await params

  await db
    .delete(portalsConfig)
    .where(and(eq(portalsConfig.id, id), eq(portalsConfig.userId, user.id)))

  return NextResponse.json({ ok: true })
}
