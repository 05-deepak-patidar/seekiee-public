'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const BLOCKS = [
  { id: 'A', label: 'Role Summary' },
  { id: 'B', label: 'CV Match' },
  { id: 'C', label: 'Level & Strategy' },
  { id: 'D', label: 'Compensation' },
  { id: 'E', label: 'Plan' },
  { id: 'F', label: 'Interview Prep' },
  { id: 'G', label: 'Legitimacy' },
]

function extractBlock(md: string, blockId: string): string {
  const nextBlock = BLOCKS.find(b => b.id > blockId)?.id
  const startRe = new RegExp(`##\\s*(?:Block\\s+)?${blockId}[\\s\\S]*?(?=##\\s*(?:Block\\s+)?${nextBlock || 'Machine'}|$)`, 'i')
  const match = md.match(startRe)
  return match?.[0] ?? ''
}

type Seg = { type: 'table'; rows: string[][] } | { type: 'line'; raw: string }

function segmentLines(lines: string[]): Seg[] {
  const segs: Seg[] = []
  let i = 0
  while (i < lines.length) {
    if (lines[i].trimStart().startsWith('|')) {
      const tableRows: string[][] = []
      while (i < lines.length && lines[i].trimStart().startsWith('|')) {
        const cells = lines[i]
          .replace(/^\s*\||\|\s*$/g, '')
          .split('|')
          .map(c => c.trim())
        tableRows.push(cells)
        i++
      }
      segs.push({ type: 'table', rows: tableRows })
    } else {
      segs.push({ type: 'line', raw: lines[i] })
      i++
    }
  }
  return segs
}

function isSeparatorRow(row: string[]): boolean {
  return row.every(c => /^:?-+:?$/.test(c.trim()) || c.trim() === '')
}

function colAlign(cell: string): React.CSSProperties['textAlign'] {
  const c = cell.trim()
  if (c.startsWith(':') && c.endsWith(':')) return 'center'
  if (c.endsWith(':')) return 'right'
  return 'left'
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[2] !== undefined) {
      parts.push(<strong key={k++}>{m[2]}</strong>)
    } else if (m[3] !== undefined) {
      parts.push(<em key={k++}>{m[3]}</em>)
    } else if (m[4] !== undefined) {
      parts.push(
        <code key={k++} style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.82em',
          background: 'rgba(255,255,255,0.1)', padding: '0.1em 0.35em',
          borderRadius: 3, color: 'var(--brand-orange-light)',
        }}>{m[4]}</code>
      )
    }
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 0 ? text : parts
}

function MarkdownBlock({ content }: { content: string }) {
  const lines = content.split('\n')
  const segs = segmentLines(lines)

  return (
    <div style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
      {segs.map((seg, si) => {
        if (seg.type === 'table') {
          const { rows } = seg
          if (rows.length < 2) return null

          const hasSep = isSeparatorRow(rows[1])
          const headerRow = rows[0]
          const sepRow = hasSep ? rows[1] : null
          const bodyRows = hasSep ? rows.slice(2) : rows.slice(1)
          const aligns = sepRow ? sepRow.map(colAlign) : headerRow.map(() => 'left' as const)

          return (
            <div key={si} style={{ overflowX: 'auto', margin: '0.75rem 0' }}>
              <table style={{
                width: '100%', borderCollapse: 'collapse',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
              }}>
                <thead>
                  <tr>
                    {headerRow.map((cell, ci) => (
                      <th key={ci} style={{
                        padding: '0.45rem 0.875rem',
                        background: 'rgba(255,255,255,0.06)',
                        fontWeight: 600,
                        borderBottom: '2px solid var(--glass-border)',
                        textAlign: aligns[ci] ?? 'left',
                        color: 'var(--color-text-primary)',
                        whiteSpace: 'nowrap',
                      }}>
                        {renderInline(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, ri) => (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{
                          padding: '0.4rem 0.875rem',
                          borderBottom: ri < bodyRows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          textAlign: aligns[ci] ?? 'left',
                          verticalAlign: 'top',
                          color: 'var(--color-text-secondary)',
                        }}>
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        // Line segment
        const line = seg.raw
        if (!line.trim()) return <div key={si} style={{ height: '0.5rem' }} />
        if (line.startsWith('### ')) return (
          <h4 key={si} style={{ fontFamily: 'var(--font-primary)', color: 'var(--color-text-primary)', marginTop: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
            {renderInline(line.replace(/^###\s+/, ''))}
          </h4>
        )
        if (line.startsWith('## ')) return (
          <h3 key={si} style={{ fontFamily: 'var(--font-primary)', color: 'var(--color-text-primary)', fontSize: '1rem', fontWeight: 700 }}>
            {renderInline(line.replace(/^##\s+/, ''))}
          </h3>
        )
        if (line.startsWith('# ')) return (
          <h2 key={si} style={{ fontFamily: 'var(--font-primary)', color: 'var(--color-text-primary)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            {renderInline(line.replace(/^#\s+/, ''))}
          </h2>
        )
        if (line.startsWith('- ') || line.startsWith('* ')) return (
          <div key={si} style={{ paddingLeft: '1rem', display: 'flex', gap: '0.5rem' }}>
            <span style={{ color: 'var(--brand-orange)', flexShrink: 0 }}>•</span>
            <span>{renderInline(line.slice(2))}</span>
          </div>
        )
        return <p key={si} style={{ margin: 0 }}>{renderInline(line)}</p>
      })}
    </div>
  )
}

interface Props {
  reportId: string
}

export function ReportViewer({ reportId }: Props) {
  const router = useRouter()
  const [activeBlock, setActiveBlock] = useState('A')
  const [reportMd, setReportMd] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/reports/${reportId}`)
      .then(r => r.json())
      .then(d => setReportMd(d.reportMd))
      .catch(() => {})
  }, [reportId])

  const saveToTracker = async () => {
    setSaving(true)
    await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId }),
    })
    setSaving(false)
    setSaved(true)
    try { sessionStorage.removeItem('seekiee_last_eval') } catch {}
    setTimeout(() => router.push('/applications'), 800)
  }

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Block tabs */}
      <div style={{
        display: 'flex', overflowX: 'auto',
        borderBottom: '1px solid var(--glass-border)',
        padding: '0 0.5rem',
        gap: '0.125rem',
      }}>
        {BLOCKS.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveBlock(id)}
            style={{
              padding: '0.625rem 0.875rem',
              background: 'none', border: 'none',
              borderBottom: activeBlock === id ? '2px solid var(--brand-orange)' : '2px solid transparent',
              color: activeBlock === id ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: activeBlock === id ? 600 : 400,
              whiteSpace: 'nowrap',
              transition: 'all var(--transition-fast)',
            }}>
            <span style={{ color: activeBlock === id ? 'var(--brand-orange)' : 'inherit', fontWeight: 700, marginRight: '0.25rem' }}>
              {id}
            </span>
            {label}
          </button>
        ))}
      </div>

      {/* Block content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', minHeight: 320 }}>
        {reportMd ? (
          <MarkdownBlock content={extractBlock(reportMd, activeBlock)} />
        ) : (
          <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>Loading report…</div>
        )}
      </div>

      {/* Action bar */}
      <div style={{
        padding: '0.875rem 1.25rem',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex', gap: '0.75rem',
      }}>
        <button
          onClick={saveToTracker}
          disabled={saving || saved}
          style={{
            flex: 1, padding: '0.6rem',
            borderRadius: 'var(--radius-full)',
            background: saved ? 'var(--color-success)' : 'var(--color-primary)',
            color: '#fff', border: 'none',
            fontWeight: 600, fontSize: '0.875rem',
            cursor: saving || saved ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'background 0.3s ease',
          }}>
          {saved ? '✓ Saved! Redirecting…' : saving ? 'Saving…' : '✓ Save to Applications'}
        </button>
        <button
          onClick={() => window.open(`/api/reports/${reportId}/pdf`, '_blank')}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-secondary)',
            color: '#fff', border: 'none',
            fontWeight: 600, fontSize: '0.875rem',
            cursor: 'pointer',
          }}>
          📄 PDF
        </button>
      </div>
    </div>
  )
}
