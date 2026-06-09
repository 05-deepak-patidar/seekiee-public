import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { storyBank } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await requireDbUser()
  const rows = await db
    .select()
    .from(storyBank)
    .where(eq(storyBank.userId, user.id))
    .orderBy(desc(storyBank.createdAt))
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const user = await requireDbUser()
  const { title, situation, task, action, result, reflection, tags } = await req.json()

  const [created] = await db
    .insert(storyBank)
    .values({
      userId: user.id,
      title: title ?? null,
      situation: situation ?? null,
      task: task ?? null,
      action: action ?? null,
      result: result ?? null,
      reflection: reflection ?? null,
      tags: tags ?? null,
    })
    .returning()

  return NextResponse.json(created)
}
