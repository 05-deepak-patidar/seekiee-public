'use client'

import { useEffect, useRef } from 'react'
import type { LogEvent } from '@/hooks/use-sse'

const BLOCKS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
const BLOCK_LABELS: Record<string, string> = {
  A: 'Role Summary', B: 'CV Match', C: 'Level & Strategy',
  D: 'Compensation', E: 'Personalization', F: 'Interview Prep', G: 'Legitimacy',
}

interface Props {
  events: LogEvent[]
  status: 'idle' | 'streaming' | 'done' | 'error'
  onCancel?: () => void
}

export function AiLogStream({ events, status, onCancel }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events])

  const doneBlocks = events.filter(e => e.type === 'block_done').map(e => (e as { type: 'block_done'; block: string }).block)
  const activeBlock = events.findLast(e => e.type === 'block_start') as { type: 'block_start'; block: string } | undefined
  const progress = doneBlocks.length / 7

  const logLines = events.filter(e => e.type === 'log') as { type: 'log'; text: string }[]
  const errorEvent = events.find(e => e.type === 'error') as { type: 'error'; message: string } | undefined

  return (
    <div style={{
      background: 'var(--color-code-bg)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      fontFamily: 'var(--font-mono)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.625rem 1rem',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid var(--glass-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {status === 'streaming' && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--brand-orange)',
              display: 'inline-block',
              animation: 'pulse 1s ease-in-out infinite',
            }} />
          )}
          {status === 'done' && <span style={{ color: 'var(--color-success)', fontSize: '0.8rem' }}>✓</span>}
          {status === 'error' && <span style={{ color: 'var(--color-error)', fontSize: '0.8rem' }}>✗</span>}
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, letterSpacing: '0.06em' }}>
            {status === 'streaming' ? 'AI ANALYSIS IN PROGRESS' : status === 'done' ? 'ANALYSIS COMPLETE' : status === 'error' ? 'ERROR' : 'LOG'}
          </span>
        </div>
        {status === 'streaming' && onCancel && (
          <button onClick={onCancel}
            style={{
              fontSize: '0.72rem', color: 'var(--color-text-tertiary)',
              background: 'none', border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-full)', padding: '2px 8px', cursor: 'pointer',
            }}>
            cancel
          </button>
        )}
      </div>

      {/* Block progress pills */}
      {(status === 'streaming' || status === 'done') && (
        <div style={{ display: 'flex', gap: '0.25rem', padding: '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {BLOCKS.map(b => {
            const done = doneBlocks.includes(b)
            const active = activeBlock?.block === b
            return (
              <div key={b} title={BLOCK_LABELS[b]}
                style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: done ? 'var(--color-success)'
                    : active ? 'var(--brand-orange)' : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.4s ease',
                  animation: active ? 'none' : undefined,
                  boxShadow: active ? '0 0 6px var(--brand-orange)' : 'none',
                }} />
            )
          })}
        </div>
      )}

      {/* Log lines */}
      <div style={{ height: 220, overflowY: 'auto', padding: '0.75rem 1rem', fontSize: '0.8rem', lineHeight: 1.7 }}>
        {logLines.map((e, i) => (
          <div key={i} className="log-line"
            style={{ display: 'flex', gap: '0.75rem', color: 'var(--color-text-secondary)' }}>
            <span style={{ color: 'var(--color-text-tertiary)', flexShrink: 0, userSelect: 'none', minWidth: 60 }}>
              [{String(i).padStart(2, '0')}:{String(Math.floor(Math.random() * 59)).padStart(2, '0')}]
            </span>
            <span>{e.text}</span>
            {i === logLines.length - 1 && status === 'streaming' && (
              <span style={{ color: 'var(--brand-orange)', animation: 'pulse 1s infinite' }}>●</span>
            )}
            {i < logLines.length - 1 && (
              <span style={{ color: 'var(--color-success)', marginLeft: 'auto' }}>✓</span>
            )}
          </div>
        ))}
        {errorEvent && (
          <div className="log-line" style={{ color: 'var(--color-error)' }}>
            ✗ {errorEvent.message}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Progress bar */}
      {status !== 'idle' && (
        <div style={{ padding: '0.5rem 1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${status === 'done' ? 100 : Math.round(progress * 100)}%`,
              background: status === 'error' ? 'var(--color-error)'
                : status === 'done' ? 'var(--color-success)' : 'var(--gradient-brand)',
              transition: 'width 0.5s ease',
              borderRadius: 2,
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
            <span>{activeBlock ? `Block ${activeBlock.block}: ${BLOCK_LABELS[activeBlock.block]}` : status === 'done' ? 'Complete' : ''}</span>
            <span>{status === 'done' ? '100%' : `${Math.round(progress * 100)}%`}</span>
          </div>
        </div>
      )}
    </div>
  )
}
