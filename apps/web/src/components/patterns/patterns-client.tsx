'use client'

import { formatScore } from '@/lib/utils'

type AnalyticsData = {
  totalReports: number
  avgScore: number | null
  appliedCount: number
  interviewRate: number
  scoreDistribution: { label: string; count: number }[]
  archetypeFit: { archetype: string; avgScore: number; count: number }[]
  statusFunnel: { status: string; count: number }[]
  weeklyActivity: { label: string; count: number }[]
  topCompanies: { company: string; role: string; score: number }[]
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }} className="stat-border-top">
      <div style={{
        fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: '2.25rem', lineHeight: 1.1,
        background: 'var(--gradient-brand)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>{value}</div>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.375rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>{sub}</div>}
    </div>
  )
}

function scoreBarColor(score: number): string {
  if (score >= 4.5) return '#34d399'
  if (score >= 4.0) return 'var(--brand-orange)'
  if (score >= 3.5) return '#fbbf24'
  return '#f87171'
}

export function PatternsClient({ data }: { data: AnalyticsData }) {
  if (data.totalReports === 0) {
    return (
      <div style={{ padding: '2rem', maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <h1 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.5rem' }}>Analytics</h1>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Analyze your rejection patterns and improve targeting.
        </p>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📊</div>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No data yet</div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Evaluate some job offers first, then come back to see your patterns.</p>
        </div>
      </div>
    )
  }

  const maxScore = Math.max(...data.scoreDistribution.map(s => s.count), 1)
  const maxArchetype = Math.max(...data.archetypeFit.map(a => a.avgScore), 1)
  const maxWeekly = Math.max(...data.weeklyActivity.map(w => w.count), 1)
  const maxFunnel = Math.max(...data.statusFunnel.map(s => s.count), 1)

  const FUNNEL_ORDER = ['Evaluated', 'evaluated', 'Applied', 'applied', 'Responded', 'responded', 'Interview', 'interview', 'Offer', 'offer', 'Rejected', 'rejected', 'Discarded', 'discarded', 'SKIP']
  const sortedFunnel = [...data.statusFunnel].sort((a, b) => {
    const ai = FUNNEL_ORDER.findIndex(s => s === a.status)
    const bi = FUNNEL_ORDER.findIndex(s => s === b.status)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  return (
    <div style={{ padding: '2rem', maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <h1 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.5rem' }}>Analytics</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
        Patterns and insights across your {data.totalReports} evaluated offers.
      </p>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="Total Evaluated" value={data.totalReports} />
        <StatCard label="Avg Score" value={data.avgScore !== null ? `${data.avgScore}/5` : '—'} />
        <StatCard label="Applied" value={data.appliedCount} sub="moved to applied stage" />
        <StatCard label="Interview Rate" value={data.appliedCount > 0 ? `${data.interviewRate}%` : '—'} sub="of applied → interview" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Score Distribution */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
            SCORE DISTRIBUTION
          </h3>
          {data.scoreDistribution.map(({ label, count }) => (
            <div key={label} style={{ marginBottom: '0.625rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{count}</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(count / maxScore) * 100}%`,
                  background: label.includes('4.5') ? '#34d399' : label.includes('4') ? 'var(--brand-orange)' : label.includes('3') ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                  borderRadius: 4,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Status Funnel */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
            STATUS FUNNEL
          </h3>
          {sortedFunnel.map(({ status, count }, i) => (
            <div key={status} style={{ marginBottom: '0.625rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{status}</span>
                <span style={{ fontWeight: 600 }}>{count}</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(count / maxFunnel) * 100}%`,
                  background: i === 0 ? 'rgba(147,197,253,0.6)' : i === 1 ? 'rgba(167,139,250,0.6)' : i === 2 ? '#fbbf24' : i === 3 ? 'var(--brand-orange)' : '#34d399',
                  borderRadius: 4,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Archetype Fit */}
        {data.archetypeFit.length > 0 && (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              ARCHETYPE FIT
            </h3>
            {data.archetypeFit.map(({ archetype, avgScore, count }) => (
              <div key={archetype} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{archetype}</span>
                  <span style={{ fontWeight: 600, color: scoreBarColor(avgScore), flexShrink: 0 }}>{formatScore(avgScore)} <span style={{ fontWeight: 400, color: 'var(--color-text-tertiary)' }}>×{count}</span></span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(avgScore / maxArchetype) * 100}%`,
                    background: scoreBarColor(avgScore),
                    borderRadius: 3,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Weekly Activity */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
            WEEKLY ACTIVITY
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.375rem', height: 100 }}>
            {data.weeklyActivity.map(({ label, count }) => (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: count > 0 ? 'var(--color-text-primary)' : 'transparent' }}>{count || ''}</span>
                <div style={{
                  width: '100%',
                  height: `${maxWeekly > 0 ? (count / maxWeekly) * 72 : 4}px`,
                  minHeight: 4,
                  background: count > 0 ? 'var(--brand-orange)' : 'rgba(255,255,255,0.06)',
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.6s ease',
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem' }}>
            {data.weeklyActivity.map(({ label }) => (
              <div key={label} style={{ flex: 1, textAlign: 'center', fontSize: '0.6rem', color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label.split(' ')[0]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Companies */}
      {data.topCompanies.length > 0 && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>
            TOP SCORED COMPANIES
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
            {data.topCompanies.map(({ company, role, score }) => (
              <div key={`${company}-${role}`} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: '0.875rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{company}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{role}</div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: scoreBarColor(score) }}>{formatScore(score)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
