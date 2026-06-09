'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles, Link, FileText, AlertTriangle, RotateCcw } from 'lucide-react'
import NextLink from 'next/link'
import { useSSE } from '@/hooks/use-sse'
import { AiLogStream } from '@/components/ai-log-stream/ai-log-stream'
import { ScoreWidget } from '@/components/evaluator/score-widget'
import { ReportViewer } from '@/components/evaluator/report-viewer'

type PersistedEval = { reportId: string; finalScore: number; sourceLabel: string }

function UrlPreFill({ onSet }: { onSet: (url: string) => void }) {
  const params = useSearchParams()
  useEffect(() => {
    const u = params.get('url')
    if (u) onSet(u)
  }, [params, onSet])
  return null
}

export default function EvaluatorPage() {
  const [urlInput, setUrlInput] = useState('')
  const handleUrlPreFill = useCallback((url: string) => setUrlInput(url), [])
  const [jdText, setJdText] = useState('')
  const [tab, setTab] = useState<'url' | 'text'>('url')
  const [sseUrl, setSseUrl] = useState<string | null>(null)
  const [restoredEval, setRestoredEval] = useState<PersistedEval | null>(null)

  const { events, status, reportId, finalScore, cancel } = useSSE(sseUrl)

  const errorEvent = events.find(e => e.type === 'error') as { type: 'error'; message: string } | undefined
  const isCvMissing = !!errorEvent?.message.toLowerCase().includes('no cv')

  // Restore last completed eval from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('seekiee_last_eval')
      if (saved) setRestoredEval(JSON.parse(saved))
    } catch {}
  }, [])

  // Persist completed eval to sessionStorage
  useEffect(() => {
    if (status === 'done' && reportId && finalScore !== null) {
      try {
        sessionStorage.setItem('seekiee_last_eval', JSON.stringify({
          reportId,
          finalScore,
          sourceLabel: urlInput || jdText.slice(0, 60),
        }))
      } catch {}
    }
  }, [status, reportId, finalScore, urlInput, jdText])

  const handleNew = () => {
    try { sessionStorage.removeItem('seekiee_last_eval') } catch {}
    setSseUrl(null)
    cancel()
    setRestoredEval(null)
  }

  const startEval = () => {
    if (tab === 'url' && urlInput) {
      setSseUrl(`/api/evaluate?url=${encodeURIComponent(urlInput)}`)
    } else if (tab === 'text' && jdText) {
      setSseUrl(`/api/evaluate?jd=${encodeURIComponent(jdText)}`)
    }
  }

  const showInput = status === 'idle' && !restoredEval
  const showRestored = status === 'idle' && !!restoredEval
  const showStream = status === 'streaming' || status === 'done' || status === 'error'

  const tabBtn = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.4rem 0.875rem',
    borderRadius: 'var(--radius-full)',
    border: '1px solid',
    borderColor: active ? 'var(--brand-orange)' : 'var(--glass-border)',
    background: active ? 'rgba(247,127,3,0.1)' : 'transparent',
    color: active ? 'var(--brand-orange-light)' : 'var(--color-text-secondary)',
    cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
    transition: 'all var(--transition-fast)',
  })

  return (
    <div style={{ padding: '2rem', maxWidth: 1100 }}>
      <Suspense fallback={null}>
        <UrlPreFill onSet={handleUrlPreFill} />
      </Suspense>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Sparkles size={20} style={{ color: 'var(--brand-orange)' }} />
          <h1 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.5rem' }}>
            Evaluate a Job
          </h1>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Get a full A-G evaluation with CV match, compensation research, and interview prep in ~60 seconds.
        </p>
      </div>

      {/* Restored state — last eval persisted across navigation */}
      {showRestored && restoredEval && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            fontSize: '0.8rem', color: 'var(--color-text-tertiary)',
          }}>
            <RotateCcw size={12} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {restoredEval.sourceLabel || 'Last evaluation'}
            </span>
            <button
              onClick={handleNew}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', fontSize: '0.8rem' }}>
              ✕ New Evaluation
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
            <ScoreWidget score={restoredEval.finalScore} />
            <ReportViewer reportId={restoredEval.reportId} />
          </div>
        </>
      )}

      {/* Input section */}
      {showInput && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button style={tabBtn(tab === 'url')} onClick={() => setTab('url')}>
              <Link size={14} /> Paste URL
            </button>
            <button style={tabBtn(tab === 'text')} onClick={() => setTab('text')}>
              <FileText size={14} /> Paste JD text
            </button>
          </div>

          {tab === 'url' ? (
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && startEval()}
              placeholder="https://boards.greenhouse.io/company/jobs/123..."
              style={{
                width: '100%', padding: '0.75rem 1rem',
                background: 'var(--color-bg-primary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-primary)',
                fontSize: '0.95rem', outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-orange)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(247,127,3,0.12)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.boxShadow = 'none' }}
            />
          ) : (
            <textarea
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              placeholder="Paste the full job description text here..."
              rows={8}
              style={{
                width: '100%', padding: '0.75rem 1rem',
                background: 'var(--color-bg-primary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem', outline: 'none',
                resize: 'vertical', lineHeight: 1.6,
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-orange)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--glass-border)' }}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
              Analysis takes 30–90 seconds. Your CV and profile are read automatically.
            </p>
            <button
              onClick={startEval}
              disabled={tab === 'url' ? !urlInput : jdText.length < 50}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.625rem 1.5rem',
                borderRadius: 'var(--radius-full)',
                background: (tab === 'url' ? urlInput : jdText.length >= 50) ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                color: (tab === 'url' ? urlInput : jdText.length >= 50) ? '#fff' : 'var(--color-text-tertiary)',
                border: 'none', fontWeight: 700, fontSize: '0.95rem',
                cursor: (tab === 'url' ? urlInput : jdText.length >= 50) ? 'pointer' : 'not-allowed',
                transition: 'all var(--transition-fast)',
                boxShadow: (tab === 'url' ? urlInput : jdText.length >= 50) ? 'var(--shadow-glow)' : 'none',
              }}>
              <Sparkles size={15} />
              Evaluate
            </button>
          </div>
        </div>
      )}

      {/* Streaming + Report */}
      {showStream && (
        <>
          {/* Source bar */}
          {(urlInput || jdText) && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: 'var(--color-surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              fontSize: '0.8rem', color: 'var(--color-text-tertiary)',
            }}>
              <Link size={12} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {urlInput || `${jdText.slice(0, 80)}…`}
              </span>
              <button
                onClick={handleNew}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', fontSize: '0.8rem' }}>
                ✕ New
              </button>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: status === 'done' && finalScore !== null ? '1fr 2fr' : '1fr',
            gap: '1.5rem',
          }}>
            {/* Left: log + score */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <AiLogStream events={events} status={status} onCancel={handleNew} />
              {status === 'done' && finalScore !== null && <ScoreWidget score={finalScore} />}

              {/* No CV callout */}
              {isCvMissing && (
                <div style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(251,191,36,0.08)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                      CV not set up yet
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    The evaluator needs your CV to score job matches against your experience. Upload or paste it once — it&apos;s reused for every evaluation.
                  </p>
                  <NextLink href="/cv"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                      padding: '0.5rem 1.1rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--brand-orange)',
                      color: '#fff',
                      fontWeight: 600, fontSize: '0.875rem',
                      textDecoration: 'none',
                      alignSelf: 'flex-start',
                    }}>
                    <FileText size={14} /> Set up your CV →
                  </NextLink>
                </div>
              )}
            </div>

            {/* Right: report viewer */}
            {status === 'done' && reportId && (
              <ReportViewer reportId={reportId} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
