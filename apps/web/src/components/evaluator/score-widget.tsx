'use client'

import { scoreColor, scoreBadgeClass } from '@/lib/utils'

export function ScoreWidget({ score }: { score: number }) {
  const color = scoreColor(score)
  const label = score >= 4.5 ? 'Strong match' : score >= 4.0 ? 'Worth applying' : score >= 3.5 ? 'Borderline' : 'Weak match'
  const verdict = score >= 4.0 ? '✓ Apply' : score >= 3.5 ? '⚠ Consider' : '✗ Skip'

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Gradient top border */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: score >= 4.0 ? 'var(--gradient-brand)' : score >= 3.5 ? 'var(--color-warning)' : 'var(--color-error)',
      }} />

      {/* Score number */}
      <div style={{
        fontFamily: 'var(--font-primary)',
        fontWeight: 800,
        fontSize: '4rem',
        lineHeight: 1,
        marginBottom: '0.25rem',
        background: score >= 4.0 ? 'var(--gradient-brand)' : undefined,
        WebkitBackgroundClip: score >= 4.0 ? 'text' : undefined,
        WebkitTextFillColor: score >= 4.0 ? 'transparent' : undefined,
        color: score < 4.0 ? (score >= 3.5 ? 'var(--color-warning)' : 'var(--color-error)') : undefined,
      }}>
        {score.toFixed(1)}
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)', marginBottom: '0.75rem' }}>
        out of 5.0
      </div>

      {/* Label */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
        padding: '0.3rem 0.875rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.8rem', fontWeight: 700,
        ...Object.fromEntries(
          scoreBadgeClass(score).split(' ').map(c => {
            if (c.startsWith('bg-')) return ['background', c.replace('bg-', '')]
            if (c.startsWith('text-')) return ['color', c.replace('text-', '')]
            return [c, true]
          })
        ),
        background: score >= 4.5 ? 'rgba(16,185,129,0.2)' : score >= 4.0 ? 'rgba(247,127,3,0.15)' : score >= 3.5 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
        color: score >= 4.5 ? '#10b981' : score >= 4.0 ? '#ff8d28' : score >= 3.5 ? '#f59e0b' : '#ef4444',
        border: `1px solid ${score >= 4.5 ? 'rgba(16,185,129,0.3)' : score >= 4.0 ? 'rgba(247,127,3,0.3)' : score >= 3.5 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
        marginBottom: '1rem',
      }}>
        {label}
      </div>

      {/* Verdict */}
      <div style={{
        fontFamily: 'var(--font-primary)',
        fontWeight: 700,
        fontSize: '1.1rem',
        color: score >= 4.0 ? 'var(--color-success)' : score >= 3.5 ? 'var(--color-warning)' : 'var(--color-error)',
      }}>
        {verdict}
      </div>

      {score < 4.0 && (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.5rem', lineHeight: 1.5 }}>
          Score below 4.0 — only apply if you have a specific reason
        </p>
      )}
    </div>
  )
}
