'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Trash2, ExternalLink, LayoutList } from 'lucide-react'
import { usePipelineRun } from '@/contexts/pipeline-run-context'
import { AiLogStream } from '@/components/ai-log-stream/ai-log-stream'
import { ScoreWidget } from '@/components/evaluator/score-widget'

type PipelineItem = {
  id: string
  jobUrl: string
  companyHint: string | null
  roleHint: string | null
  status: string | null
  errorMsg: string | null
  reportId: string | null
  createdAt: string | null
  report?: { company: string | null; role: string | null; score: string | null } | null
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'rgba(255,255,255,0.15)',
  evaluating: 'rgba(247,127,3,0.3)',
  done: 'rgba(52,211,153,0.3)',
  error: 'rgba(248,113,113,0.3)',
}
const STATUS_TEXT: Record<string, string> = {
  pending: 'var(--color-text-tertiary)',
  evaluating: 'var(--brand-orange)',
  done: '#34d399',
  error: '#f87171',
}

export function PipelineClient({ initialItems }: { initialItems: PipelineItem[] }) {
  const [items, setItems] = useState<PipelineItem[]>(initialItems)
  const [urlInput, setUrlInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'done' | 'error'>('all')

  const { evaluatingId, events, status, reportId, finalScore, startEvaluation, clearEvaluation, cancel } = usePipelineRun()

  // Local items state sync — context already handles the DB update, this just keeps
  // the displayed row in sync while the user is on this page
  const updateItemLocal = useCallback((id: string, patch: Record<string, unknown>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  }, [])

  useEffect(() => {
    if (status === 'done' && evaluatingId && reportId) {
      updateItemLocal(evaluatingId, { status: 'done', reportId })
    }
    if (status === 'error' && evaluatingId) {
      updateItemLocal(evaluatingId, { status: 'error', errorMsg: 'Evaluation failed' })
    }
  }, [status, evaluatingId, reportId, updateItemLocal])

  const addUrls = async () => {
    const urls = urlInput.split('\n').map(u => u.trim()).filter(Boolean)
    if (urls.length === 0) return
    setAdding(true)
    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      })
      const data = await res.json() as { items?: PipelineItem[] }
      if (data.items) {
        setItems(prev => [...(data.items ?? []), ...prev])
      }
      setUrlInput('')
    } finally {
      setAdding(false)
    }
  }

  const deleteItem = async (id: string) => {
    await fetch(`/api/pipeline/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
    if (evaluatingId === id) {
      clearEvaluation()
    }
  }

  const startEvaluate = async (item: PipelineItem) => {
    // Update DB + local state to 'evaluating' before starting SSE
    await fetch(`/api/pipeline/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'evaluating' }),
    })
    updateItemLocal(item.id, { status: 'evaluating' })
    startEvaluation(item.id, item.jobUrl)
  }

  const clearDone = () => {
    const doneIds = items.filter(i => i.status === 'done').map(i => i.id)
    doneIds.forEach(id => deleteItem(id))
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)
  const counts = { all: items.length, pending: items.filter(i => i.status === 'pending').length, done: items.filter(i => i.status === 'done').length, error: items.filter(i => i.status === 'error').length }

  const filterBtn = (f: typeof filter): React.CSSProperties => ({
    padding: '0.35rem 0.875rem',
    borderRadius: 'var(--radius-full)',
    border: '1px solid',
    borderColor: filter === f ? 'var(--brand-orange)' : 'var(--glass-border)',
    background: filter === f ? 'rgba(247,127,3,0.1)' : 'transparent',
    color: filter === f ? 'var(--brand-orange)' : 'var(--color-text-secondary)',
    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
    transition: 'all var(--transition-fast)',
  })

  return (
    <div style={{ padding: '2rem', maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <LayoutList size={20} style={{ color: 'var(--brand-orange)' }} />
        <h1 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.5rem' }}>Pipeline Inbox</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
        Queue job URLs for AI evaluation. Evaluate them one by one without losing your place.
      </p>

      {/* URL input */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <textarea
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          placeholder={'Paste job URLs here, one per line:\nhttps://boards.greenhouse.io/company/jobs/123\nhttps://jobs.lever.co/company/abc-def'}
          rows={4}
          style={{
            width: '100%', padding: '0.75rem 1rem',
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-primary)',
            fontSize: '0.875rem', outline: 'none',
            resize: 'vertical', lineHeight: 1.6, fontFamily: 'var(--font-mono)',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-orange)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--glass-border)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
          <button
            onClick={addUrls}
            disabled={adding || !urlInput.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              background: urlInput.trim() ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
              color: urlInput.trim() ? '#fff' : 'var(--color-text-tertiary)',
              border: 'none', fontWeight: 700, fontSize: '0.875rem',
              cursor: urlInput.trim() ? 'pointer' : 'not-allowed',
              transition: 'all var(--transition-fast)',
              boxShadow: urlInput.trim() ? 'var(--shadow-glow)' : 'none',
            }}>
            <Plus size={14} />
            {adding ? 'Adding…' : 'Add to Queue'}
          </button>
        </div>
      </div>

      {/* Inline evaluation panel */}
      {evaluatingId && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
              Evaluating: <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                {(items.find(i => i.id === evaluatingId)?.jobUrl ?? '').slice(0, 60)}…
              </span>
            </span>
            <button onClick={clearEvaluation} style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', fontSize: '0.8rem' }}>✕ Close</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: status === 'done' && finalScore !== null ? '1fr 1fr' : '1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <AiLogStream events={events} status={status} onCancel={() => {
  if (evaluatingId) {
    fetch(`/api/pipeline/${evaluatingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pending' }),
    }).catch(() => {})
    updateItemLocal(evaluatingId, { status: 'pending' })
  }
  cancel()
  clearEvaluation()
}} />
              {status === 'done' && finalScore !== null && <ScoreWidget score={finalScore} />}
            </div>
            {status === 'done' && reportId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link href={`/evaluator`} style={{
                  display: 'block', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary)', color: '#fff', textDecoration: 'none',
                  fontWeight: 600, fontSize: '0.875rem', textAlign: 'center',
                  boxShadow: 'var(--shadow-glow)',
                }}>
                  Open Full Report →
                </Link>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>
                  Go to Applications to find this report and save it to your tracker.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter + actions bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {(['all', 'pending', 'done', 'error'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={filterBtn(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)} {counts[f] > 0 && <span style={{ marginLeft: '0.25rem', opacity: 0.7 }}>({counts[f]})</span>}
            </button>
          ))}
        </div>
        {counts.done > 0 && (
          <button onClick={clearDone} style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', fontSize: '0.8rem' }}>
            Clear done ({counts.done})
          </button>
        )}
      </div>

      {/* Queue table */}
      {filtered.length === 0 ? (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>📋</div>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Queue is empty</div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Paste job URLs above to add them to the queue.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {filtered.map((item, i) => {
            const status = item.status ?? 'pending'
            const isActive = evaluatingId === item.id
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '0.875rem 1rem',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: isActive ? 'rgba(247,127,3,0.05)' : 'transparent',
              }}>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  background: STATUS_COLORS[status] ?? STATUS_COLORS.pending,
                  color: STATUS_TEXT[status] ?? 'var(--color-text-tertiary)',
                  textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
                }}>{status}</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {(item.report?.company || item.companyHint) && (
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.125rem' }}>
                      {item.report?.company ?? item.companyHint}
                      {(item.report?.role ?? item.roleHint) && (
                        <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>
                          — {item.report?.role ?? item.roleHint}
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400, fontFamily: 'var(--font-mono)' }}>
                    {item.jobUrl}
                  </div>
                </div>

                {item.report?.score && (
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: parseFloat(item.report.score) >= 4 ? 'var(--brand-orange)' : 'var(--color-text-secondary)', flexShrink: 0 }}>
                    {parseFloat(item.report.score).toFixed(1)}/5
                  </span>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  {status === 'pending' && !evaluatingId && (
                    <button
                      onClick={() => startEvaluate(item)}
                      style={{
                        padding: '0.35rem 0.875rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-primary)',
                        color: '#fff', border: 'none',
                        fontWeight: 600, fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}>
                      Evaluate
                    </button>
                  )}
                  {status === 'done' && (
                    <a href={item.jobUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-text-tertiary)', fontSize: '0.8rem', textDecoration: 'none' }}>
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <button
                    onClick={() => deleteItem(item.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
