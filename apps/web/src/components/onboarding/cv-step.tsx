'use client'

import { useState } from 'react'

export function CvStep({ onNext }: { onNext: (cvText: string) => void }) {
  const [tab, setTab] = useState<'paste' | 'upload'>('paste')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/import/cv', { method: 'POST', body: form })
    const { text: extracted } = await res.json()
    setText(extracted)
    setLoading(false)
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.4rem 1rem',
    borderRadius: 'var(--radius-full)',
    border: '1px solid',
    borderColor: active ? 'var(--brand-orange)' : 'var(--glass-border)',
    background: active ? 'rgba(247,127,3,0.1)' : 'transparent',
    color: active ? 'var(--brand-orange-light)' : 'var(--color-text-secondary)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    transition: 'all var(--transition-fast)',
  })

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.25rem' }}>
        Your CV
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Paste your CV or upload a .docx/.pdf. We&apos;ll convert it to markdown automatically.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button style={btnStyle(tab === 'paste')} onClick={() => setTab('paste')}>Paste text</button>
        <button style={btnStyle(tab === 'upload')} onClick={() => setTab('upload')}>Upload file</button>
      </div>

      {tab === 'paste' ? (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste your CV content here (markdown or plain text)..."
          style={{
            width: '100%', height: 280,
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-primary)',
            padding: '0.75rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.825rem',
            resize: 'vertical',
            outline: 'none',
            lineHeight: 1.6,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-orange)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--glass-border)' }}
        />
      ) : (
        <div style={{
          border: '2px dashed var(--glass-border)',
          borderRadius: 'var(--radius-md)',
          padding: '2rem',
          textAlign: 'center',
          position: 'relative',
        }}>
          {loading ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>Extracting text...</p>
          ) : text ? (
            <p style={{ color: 'var(--color-success)' }}>✓ CV extracted ({text.length} chars)</p>
          ) : (
            <>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                Drop .docx or .pdf here
              </p>
              <input type="file" accept=".docx,.pdf,.txt"
                onChange={handleFile}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
            </>
          )}
        </div>
      )}

      <button
        onClick={() => onNext(text)}
        disabled={text.length < 100}
        style={{
          marginTop: '1.5rem',
          width: '100%',
          padding: '0.75rem',
          borderRadius: 'var(--radius-full)',
          background: text.length >= 100 ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
          color: text.length >= 100 ? '#fff' : 'var(--color-text-tertiary)',
          border: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
          cursor: text.length >= 100 ? 'pointer' : 'not-allowed',
          transition: 'all var(--transition-fast)',
        }}>
        Continue →
      </button>
    </div>
  )
}
