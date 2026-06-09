import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { reports, applications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await requireDbUser()

  const [allReports, allApps] = await Promise.all([
    db.select().from(reports).where(eq(reports.userId, user.id)),
    db.select().from(applications).where(eq(applications.userId, user.id)),
  ])

  const scoreRanges = [
    { label: '0–2', min: 0, max: 2 },
    { label: '2–3', min: 2, max: 3 },
    { label: '3–3.5', min: 3, max: 3.5 },
    { label: '3.5–4', min: 3.5, max: 4 },
    { label: '4–4.5', min: 4, max: 4.5 },
    { label: '4.5–5', min: 4.5, max: 5.1 },
  ]
  const scoreDistribution = scoreRanges.map(r => ({
    label: r.label,
    count: allReports.filter(rep => {
      const s = rep.score ? parseFloat(rep.score) : null
      return s !== null && s >= r.min && s < r.max
    }).length,
  }))

  const archetypeMap = new Map<string, number[]>()
  for (const r of allReports) {
    if (!r.archetype || !r.score) continue
    const arch = r.archetype.trim()
    if (!archetypeMap.has(arch)) archetypeMap.set(arch, [])
    archetypeMap.get(arch)!.push(parseFloat(r.score))
  }
  const archetypeFit = Array.from(archetypeMap.entries())
    .map(([archetype, scores]) => ({
      archetype,
      avgScore: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
      count: scores.length,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 8)

  const statusMap = new Map<string, number>()
  for (const a of allApps) statusMap.set(a.status, (statusMap.get(a.status) ?? 0) + 1)
  const statusFunnel = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }))

  const now = new Date()
  const weeklyActivity = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - 7 * (7 - i))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const count = allApps.filter(a => {
      if (!a.appliedDate) return false
      const d = new Date(a.appliedDate)
      return d >= weekStart && d < weekEnd
    }).length
    return { label, count }
  })

  const topCompanies = [...allReports]
    .filter(r => r.score && r.company)
    .sort((a, b) => parseFloat(b.score!) - parseFloat(a.score!))
    .slice(0, 5)
    .map(r => ({ company: r.company!, role: r.role ?? '', score: parseFloat(r.score!) }))

  const scores = allReports.filter(r => r.score).map(r => parseFloat(r.score!))
  const avgScore = scores.length
    ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
    : null
  const appliedCount = allApps.filter(a =>
    ['Applied', 'applied', 'Responded', 'responded', 'Interview', 'interview', 'Offer', 'offer'].includes(a.status)
  ).length
  const interviewCount = allApps.filter(a =>
    ['Interview', 'interview', 'Offer', 'offer'].includes(a.status)
  ).length
  const interviewRate = appliedCount > 0 ? Math.round((interviewCount / appliedCount) * 100) : 0

  return NextResponse.json({
    totalReports: allReports.length,
    avgScore,
    appliedCount,
    interviewRate,
    scoreDistribution,
    archetypeFit,
    statusFunnel,
    weeklyActivity,
    topCompanies,
  })
}
