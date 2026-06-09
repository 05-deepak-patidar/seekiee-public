'use client'

import Link from 'next/link'
import { Sparkles, Plus, ScanSearch } from 'lucide-react'
import { formatScore, daysSince } from '@/lib/utils'

type App = {
  id: string; company: string; role: string
  score: string | null; status: string; createdAt: Date | null; updatedAt: Date | null
}

const FUNNEL = ['Evaluated', 'Applied', 'Responded', 'Interview', 'Offer']
const STATUS_ICON: Record<string, string> = {
  Evaluated: '📋', Applied: '📤', Responded: '📬',
  Interview: '🎤', Offer: '🎉', Rejected: '❌', Discarded: '🗑',
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
    }}
      className="stat-border-top">
      <div style={{
        fontFamily: 'var(--font-primary)',
        fontWeight: 800, fontSize: '2.5rem', lineHeight: 1.1,
        background: 'var(--gradient-brand)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>{value}</div>
      <div style={{
        fontSize: '0.72rem', fontWeight: 700,
        color: 'var(--color-text-tertiary)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginTop: '0.375rem',
      }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>{sub}</div>}
    </div>
  )
}

export function DashboardClient({ apps, userName }: { apps: App[]; userName: string }) {
  const total = apps.length
  const applied = apps.filter(a => ['Applied', 'Responded', 'Interview', 'Offer'].includes(a.status)).length
  const interviews = apps.filter(a => ['Interview', 'Offer'].includes(a.status)).length
  const scores = apps.map(a => a.score ? parseFloat(a.score) : null).filter(Boolean) as number[]
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—'
  const interviewRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0

  const funnelCounts = FUNNEL.map(s => ({
    status: s,
    count: apps.filter(a => a.status === s).length,
  }))
  const maxCount = Math.max(...funnelCounts.map(f => f.count), 1)

  const recent = [...apps]
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime())
    .slice(0, 8)

  const thisWeek = apps.filter(a => a.createdAt && daysSince(a.createdAt) <= 7).length

  return (
    <div>
      {/* Welcome */}
      {total === 0 && (
        <div style={{
          background: 'var(--gradient-brand-soft)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '1rem',
        }}>
          <div style={{ fontSize: '2rem' }}>👋</div>
          <div>
            <div style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>
              Welcome, {userName}!
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Start by evaluating your first job. Paste a URL in the{' '}
              <Link href="/evaluator" style={{ color: 'var(--brand-orange-light)', fontWeight: 600 }}>Evaluator</Link>.
            </p>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="Total Applications" value={total} />
        <StatCard label="Applied This Week" value={thisWeek} />
        <StatCard label="Interview Rate" value={applied > 0 ? `${interviewRate}%` : '—'} sub={`${interviews} interviews`} />
        <StatCard label="Avg Score" value={avgScore} sub={`${scores.length} evaluated`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Conversion funnel */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
        }}>
          <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
            CONVERSION FUNNEL
          </h3>
          {funnelCounts.map(({ status, count }, i) => (
            <div key={status} style={{ marginBottom: '0.625rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{status}</span>
                <span style={{ fontWeight: 600 }}>{count}</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`,
                  background: i === 0 ? 'rgba(147,197,253,0.6)' : i === 1 ? 'rgba(167,139,250,0.6)' : i === 2 ? 'rgba(251,191,36,0.6)' : i === 3 ? 'var(--brand-orange)' : 'var(--color-success)',
                  borderRadius: 4,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
        }}>
          <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
            QUICK ACTIONS
          </h3>
          <Link href="/evaluator"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.875rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#fff', textDecoration: 'none', fontWeight: 700,
              boxShadow: 'var(--shadow-glow)',
              transition: 'all var(--transition-base)',
            }}>
            <Sparkles size={18} />
            Evaluate a Job
          </Link>
          <Link href="/pipeline"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.875rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)', textDecoration: 'none', fontWeight: 600,
              transition: 'all var(--transition-base)',
            }}>
            <Plus size={18} />
            Add to Pipeline
          </Link>
          <Link href="/scan"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.875rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.3)',
              color: 'var(--brand-purple)', textDecoration: 'none', fontWeight: 600,
              transition: 'all var(--transition-base)',
            }}>
            <ScanSearch size={18} />
            Run Portal Scan
          </Link>
        </div>
      </div>

      {/* Activity feed */}
      {recent.length > 0 && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
        }}>
          <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.875rem' }}>
            RECENT ACTIVITY
          </h3>
          {recent.map(app => (
            <div key={app.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '0.625rem 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{STATUS_ICON[app.status] ?? '📋'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{app.company}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.role}</div>
              </div>
              {app.score && (
                <span style={{
                  fontSize: '0.75rem', fontWeight: 700,
                  color: parseFloat(app.score) >= 4.0 ? '#ff8d28' : '#94a3b8',
                }}>{formatScore(parseFloat(app.score))}</span>
              )}
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
                {app.updatedAt ? `${daysSince(app.updatedAt)}d ago` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
