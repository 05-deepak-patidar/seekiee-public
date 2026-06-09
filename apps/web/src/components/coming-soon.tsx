import { type LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  description: string
  features: string[]
}

export function ComingSoon({ icon: Icon, title, description, features }: Props) {
  return (
    <div style={{ padding: '2rem', maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <Icon size={20} style={{ color: 'var(--brand-orange)' }} />
        <h1 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.5rem' }}>
          {title}
        </h1>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 99,
          background: 'rgba(139,92,246,0.15)',
          color: 'var(--brand-purple)',
          letterSpacing: '0.06em',
        }}>v2</span>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        {description}
      </p>

      <div style={{
        background: 'var(--gradient-brand-soft)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem',
      }}>
        <div style={{
          fontFamily: 'var(--font-primary)',
          fontWeight: 700,
          fontSize: '0.85rem',
          marginBottom: '1rem',
          color: 'var(--color-text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          COMING IN v2
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {features.map(f => (
            <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--brand-orange)', fontWeight: 700, flexShrink: 0 }}>→</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
