'use client'

import { useState } from 'react'

const TOP_COMPANIES = [
  'Anthropic', 'OpenAI', 'Google DeepMind', 'Cohere', 'Together AI',
  'Hugging Face', 'Stripe', 'Databricks', 'Temporal', 'n8n',
  'Retool', 'Vercel', 'Linear', 'Notion', 'Scale AI',
]

export function PortalsStep({ onNext }: { onNext: (portals: string[]) => void }) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(TOP_COMPANIES.slice(0, 8)))

  const toggle = (name: string) => {
    setEnabled(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.25rem' }}>
        Job Portals
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Pick companies to scan for new openings. You can add more later.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {TOP_COMPANIES.map(name => {
          const on = enabled.has(name)
          return (
            <button
              key={name}
              onClick={() => toggle(name)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: on ? 'var(--brand-orange)' : 'var(--glass-border)',
                background: on ? 'rgba(247,127,3,0.08)' : 'var(--color-bg-primary)',
                color: on ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: on ? 600 : 400,
                textAlign: 'left',
                transition: 'all var(--transition-fast)',
              }}>
              <span style={{
                width: 16, height: 16, borderRadius: 4,
                border: '1px solid',
                borderColor: on ? 'var(--brand-orange)' : 'var(--glass-border)',
                background: on ? 'var(--brand-orange)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6rem', color: '#fff', flexShrink: 0,
              }}>{on ? '✓' : ''}</span>
              {name}
            </button>
          )
        })}
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '1rem' }}>
        {enabled.size} companies selected · 45+ more available in Settings
      </p>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button onClick={() => onNext([])}
          style={{
            flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-full)',
            background: 'transparent', border: '1px solid var(--glass-border)',
            color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.9rem',
          }}>
          Skip for now
        </button>
        <button onClick={() => onNext([...enabled])}
          style={{
            flex: 2, padding: '0.75rem', borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
            boxShadow: 'var(--shadow-glow)',
          }}>
          Save & Continue →
        </button>
      </div>
    </div>
  )
}
