import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { portalsConfig } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await requireDbUser()
  const rows = await db
    .select()
    .from(portalsConfig)
    .where(eq(portalsConfig.userId, user.id))
    .orderBy(desc(portalsConfig.createdAt))
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const user = await requireDbUser()
  const { companyName, careersUrl, provider, apiUrl, locationFilter } = await req.json()

  if (!companyName || !provider || !apiUrl) {
    return NextResponse.json({ error: 'companyName, provider, and apiUrl are required' }, { status: 400 })
  }

  const [created] = await db
    .insert(portalsConfig)
    .values({
      userId: user.id,
      companyName,
      careersUrl: careersUrl ?? null,
      provider,
      apiUrl,
      enabled: true,
      locationFilter: locationFilter ?? null,
    })
    .returning()

  return NextResponse.json(created)
}
