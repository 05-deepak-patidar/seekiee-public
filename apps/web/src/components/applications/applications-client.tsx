'use client'

import { useState } from 'react'
import { scoreBadgeClass, formatDate, formatScore } from '@/lib/utils'

const STATUSES = ['Evaluated', 'Applied', 'Responded', 'Interview', 'Offer', 'Rejected', 'Discarded', 'SKIP']

type App = {
  id: string; seqNum: number | null; company: string; role: string
  score: string | null; status: string; pdfUrl: string | null
  jobUrl: string | null; notes: string | null; createdAt: Date | null; reportId: string | null
}

const statusColor: Record<string, string> = {
  Evaluated: '#94a3b8', Applied: '#60a5fa', Responded: '#a78bfa',
  Interview: '#ff8d28', Offer: '#10b981', Rejected: '#ef4444',
  Discarded: '#64748b', SKIP: '#64748b',
}

export function ApplicationsClient({ initialData }: { initialData: App[] }) {
  const [apps, setApps] = useState(initialData)
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const [filter, setFilter] = useState<string>('All')

  const updateStatus = async (id: string, status: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  const filtered = filter === 'All' ? apps : apps.filter(a => a.status === filter)

  const viewBtn = (v: 'table' | 'kanban'): React.CSSProperties => ({
    padding: '0.35rem 0.875rem',
    borderRadius: 'var(--radius-full)',
    border: '1px solid',
    borderColor: view === v ? 'var(--brand-orange)' : 'var(--glass-border)',
    background: view === v ? 'rgba(247,127,3,0.1)' : 'transparent',
    color: view === v ? 'var(--brand-orange-light)' : 'var(--color-text-secondary)',
    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
  })

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button style={viewBtn('table')} onClick={() => setView('table')}>Table</button>
          <button style={viewBtn('kanban')} onClick={() => setView('kanban')}>Kanban</button>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {['All', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding: '0.25rem 0.625rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--glass-border)',
                background: filter === s ? 'var(--color-bg-tertiary)' : 'transparent',
                color: filter === s ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: filter === s ? 600 : 400,
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {view === 'table' ? (
        <TableView apps={filtered} onStatusChange={updateStatus} />
      ) : (
        <KanbanView apps={filtered} onStatusChange={updateStatus} />
      )}
    </div>
  )
}

function TableView({ apps, onStatusChange }: { apps: App[]; onStatusChange: (id: string, status: string) => void }) {
  const score = (s: string | null) => s ? parseFloat(s) : null

  const thStyle: React.CSSProperties = {
    padding: '0.625rem 0.875rem',
    fontSize: '0.72rem', fontWeight: 700,
    color: 'var(--color-text-tertiary)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    textAlign: 'left', borderBottom: '1px solid var(--glass-border)',
    background: 'var(--color-bg-secondary)',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Company</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Score</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>PDF</th>
            <th style={thStyle}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {apps.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>
                No applications yet. Evaluate a job to get started.
              </td>
            </tr>
          )}
          {apps.map((app, i) => {
            const s = score(app.score)
            return (
              <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '0.75rem 0.875rem', color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>
                  {app.seqNum ?? i + 1}
                </td>
                <td style={{ padding: '0.75rem 0.875rem', color: 'var(--color-text-tertiary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {app.createdAt ? formatDate(app.createdAt) : '—'}
                </td>
                <td style={{ padding: '0.75rem 0.875rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  {app.company}
                </td>
                <td style={{ padding: '0.75rem 0.875rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {app.role}
                </td>
                <td style={{ padding: '0.75rem 0.875rem' }}>
                  {s !== null ? (
                    <span style={{
                      display: 'inline-block', padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem', fontWeight: 700,
                      background: s >= 4.5 ? 'rgba(16,185,129,0.15)' : s >= 4.0 ? 'rgba(247,127,3,0.15)' : s >= 3.5 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                      color: s >= 4.5 ? '#10b981' : s >= 4.0 ? '#ff8d28' : s >= 3.5 ? '#f59e0b' : '#ef4444',
                    }}>{formatScore(s)}</span>
                  ) : '—'}
                </td>
                <td style={{ padding: '0.75rem 0.875rem' }}>
                  <select
                    value={app.status}
                    onChange={e => onStatusChange(app.id, e.target.value)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-full)',
                      color: statusColor[app.status] ?? 'var(--color-text-secondary)',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.75rem', fontWeight: 600,
                      cursor: 'pointer',
                    }}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ padding: '0.75rem 0.875rem', textAlign: 'center' }}>
                  {app.pdfUrl ? (
                    <a href={app.pdfUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-success)', fontSize: '0.9rem' }}>📄</a>
                  ) : <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>—</span>}
                </td>
                <td style={{ padding: '0.75rem 0.875rem', color: 'var(--color-text-tertiary)', fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {app.notes ?? '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function KanbanView({ apps, onStatusChange }: { apps: App[]; onStatusChange: (id: string, status: string) => void }) {
  const columns = STATUSES.slice(0, 6)

  return (
    <div style={{ display: 'flex', gap: '0.875rem', overflowX: 'auto', paddingBottom: '1rem' }}>
      {columns.map(col => {
        const colApps = apps.filter(a => a.status === col)
        return (
          <div key={col} style={{ minWidth: 200, flex: '0 0 200px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              marginBottom: '0.625rem',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[col] }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '0.04em' }}>
                {col.toUpperCase()}
              </span>
              <span style={{
                fontSize: '0.7rem', padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-tertiary)',
              }}>{colApps.length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {colApps.map(app => {
                const s = app.score ? parseFloat(app.score) : null
                return (
                  <div key={app.id}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-orange)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>{app.company}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>{app.role}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {s !== null && (
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px',
                          borderRadius: 'var(--radius-full)',
                          background: s >= 4.0 ? 'rgba(247,127,3,0.15)' : 'rgba(148,163,184,0.15)',
                          color: s >= 4.0 ? '#ff8d28' : '#94a3b8',
                        }}>{formatScore(s)}</span>
                      )}
                      <select
                        value={app.status}
                        onChange={e => { e.stopPropagation(); onStatusChange(app.id, e.target.value) }}
                        style={{
                          background: 'var(--color-bg-primary)', border: '1px solid var(--glass-border)',
                          borderRadius: 'var(--radius-full)', color: 'var(--color-text-tertiary)',
                          padding: '1px 4px', fontSize: '0.68rem', cursor: 'pointer',
                        }}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                )
              })}
              {colApps.length === 0 && (
                <div style={{
                  border: '1px dashed var(--glass-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  textAlign: 'center',
                  color: 'var(--color-text-tertiary)',
                  fontSize: '0.75rem',
                }}>—</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
