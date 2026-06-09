'use client'

import Image from 'next/image'

export function ReadyStep({ onDone }: { onDone: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>

      <h2 style={{
        fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: '1.6rem',
        marginBottom: '0.5rem',
      }}>
        <span style={{
          background: 'var(--gradient-brand)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>You&apos;re all set!</span>
      </h2>

      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
        Seekiee is ready to work for you. Paste a job URL to evaluate it,<br />
        or run a portal scan to discover new openings.
      </p>

      <div style={{
        background: 'var(--color-bg-primary)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        marginBottom: '1.5rem',
        textAlign: 'left',
      }}>
        {[
          ['🎯', 'Paste a job URL', 'Get a full A-G evaluation in ~60 seconds'],
          ['📊', 'Track applications', 'Table and kanban views, inline status updates'],
          ['📄', 'Generate tailored PDFs', 'ATS-optimized, keyword-injected in seconds'],
          ['🔍', 'Scan 45+ portals', 'Zero-token discovery of new openings'],
        ].map(([icon, title, desc]) => (
          <div key={title} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onDone}
        style={{
          width: '100%', padding: '0.875rem',
          borderRadius: 'var(--radius-full)',
          background: 'var(--gradient-brand-diag)',
          color: '#fff', border: 'none',
          fontWeight: 700, fontSize: '1rem',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-glow)',
          letterSpacing: '0.01em',
        }}>
        Go to Dashboard →
      </button>
    </div>
  )
}
