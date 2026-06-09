'use client'

import { useState } from 'react'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  background: 'var(--color-bg-primary)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text-primary)',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'border-color var(--transition-fast)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: '0.375rem',
}

function Field({ label, name, value, onChange, placeholder }: {
  label: string; name: string; value: string
  onChange: (k: string, v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        style={inputStyle}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(name, e.target.value)}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-orange)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--glass-border)' }}
      />
    </div>
  )
}

export function ProfileStep({ onNext }: { onNext: (profile: Record<string, string>) => void }) {
  const [form, setForm] = useState({
    fullName: '', email: '', location: '', linkedin: '',
    targetRoles: '', compTarget: '', compCurrency: 'USD',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const ready = form.fullName.length > 1 && form.email.includes('@')

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.25rem' }}>
        Your Profile
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Tell us who you are so evaluations can be personalized to you.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        <Field label="Full Name *" name="fullName" value={form.fullName} onChange={set} placeholder="Deepak Patidar" />
        <Field label="Email *" name="email" value={form.email} onChange={set} placeholder="you@email.com" />
        <Field label="Location" name="location" value={form.location} onChange={set} placeholder="Mumbai, India" />
        <Field label="LinkedIn URL" name="linkedin" value={form.linkedin} onChange={set} placeholder="linkedin.com/in/..." />
      </div>

      <div style={{ marginTop: '0.875rem' }}>
        <label style={labelStyle}>Target Roles (comma-separated)</label>
        <input
          style={inputStyle}
          value={form.targetRoles}
          placeholder="Senior AI Engineer, Staff ML Engineer"
          onChange={e => set('targetRoles', e.target.value)}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-orange)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--glass-border)' }}
        />
      </div>

      <div style={{ marginTop: '0.875rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
        <Field label="Salary Target" name="compTarget" value={form.compTarget} onChange={set} placeholder="30-35 LPA or $150-180K" />
        <div>
          <label style={labelStyle}>Currency</label>
          <select
            value={form.compCurrency}
            onChange={e => set('compCurrency', e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="USD">USD</option>
            <option value="INR">INR</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      <button
        onClick={() => onNext(form)}
        disabled={!ready}
        style={{
          marginTop: '1.5rem', width: '100%', padding: '0.75rem',
          borderRadius: 'var(--radius-full)',
          background: ready ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
          color: ready ? '#fff' : 'var(--color-text-tertiary)',
          border: 'none', fontWeight: 600, fontSize: '0.95rem',
          cursor: ready ? 'pointer' : 'not-allowed',
          transition: 'all var(--transition-fast)',
        }}>
        Continue →
      </button>
    </div>
  )
}
