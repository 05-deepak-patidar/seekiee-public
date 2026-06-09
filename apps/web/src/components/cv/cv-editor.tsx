'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Download, Save, Eye, Code, Upload } from 'lucide-react'

type Props = {
  initialCv: string
  lastSaved: Date | null
  fullName: string
}

function mdToHtml(md: string, name: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const lines = md.split('\n')
  const parts: string[] = []
  for (const line of lines) {
    if (line.startsWith('# ')) parts.push(`<h1 style="font-size:1.6rem;margin:0 0 0.25rem;color:#0f172a">${esc(line.slice(2))}</h1>`)
    else if (line.startsWith('## ')) parts.push(`<h2 style="font-size:1.05rem;border-bottom:2px solid #f77f03;padding-bottom:0.2rem;margin:1.25rem 0 0.5rem;color:#0f172a">${esc(line.slice(3))}</h2>`)
    else if (line.startsWith('### ')) parts.push(`<h3 style="font-size:0.9rem;color:#475569;margin:0.5rem 0 0.2rem">${esc(line.slice(4))}</h3>`)
    else if (line.startsWith('**') && line.endsWith('**')) parts.push(`<strong>${esc(line.slice(2, -2))}</strong>`)
    else if (line.startsWith('- ') || line.startsWith('* ')) parts.push(`<li style="margin-bottom:0.2rem">${esc(line.slice(2))}</li>`)
    else if (line.trim() === '') parts.push('<br/>')
    else parts.push(`<p style="margin:0.1rem 0;line-height:1.6">${esc(line)}</p>`)
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{font-family:Inter,system-ui,sans-serif;max-width:780px;margin:0 auto;padding:2rem;color:#1e293b;font-size:0.9rem}
li{list-style:disc;margin-left:1.25rem}a{color:#f77f03}</style></head>
<body>${parts.join('\n')}</body></html>`
}

export function CvEditor({ initialCv, lastSaved, fullName }: Props) {
  const [cv, setCv] = useState(initialCv)
  const [savedAt, setSavedAt] = useState(lastSaved)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ text: string; warn: boolean } | null>(null)
  const [view, setView] = useState<'split' | 'editor' | 'preview'>('split')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (cv.trim() && !confirm('Replace your current CV with the uploaded file?')) {
      e.target.value = ''
      return
    }
    setUploading(true)
    setUploadMsg(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/import/cv', { method: 'POST', body: form })
      const data = await res.json()
      if (data.text && data.text.length > 50) {
        setCv(data.text)
        setUploadMsg({ text: 'CV imported — review and save.', warn: false })
      } else {
        setUploadMsg({ text: data.warning ?? 'Could not extract text. Paste your CV manually.', warn: true })
      }
    } catch {
      setUploadMsg({ text: 'Upload failed. Please try again or paste directly.', warn: true })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }, [cv])

  // Auto-save with 1s debounce
  const save = useCallback(async (text: string) => {
    setSaving(true)
    await fetch('/api/cv', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvText: text }),
    })
    setSavedAt(new Date())
    setSaving(false)
  }, [])

  useEffect(() => {
    if (cv === initialCv) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(cv), 1000)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [cv, save, initialCv])

  // Live preview
  useEffect(() => {
    if (iframeRef.current) {
      const html = mdToHtml(cv, fullName)
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      iframeRef.current.src = url
      return () => URL.revokeObjectURL(url)
    }
  }, [cv, fullName])

  const generatePdf = async () => {
    setGenerating(true)
    setPdfUrl(null)
    try {
      const res = await fetch('/api/pdf', { method: 'POST' })
      if (res.headers.get('X-PDF-Fallback') === 'true') {
        // Dev fallback: inline HTML, open as blob
        const html = await res.text()
        const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
        window.open(url, '_blank')
        setPdfUrl(url)
      } else {
        const data = await res.json()
        if (!res.ok || !data.url) {
          setUploadMsg({ text: data.error ?? 'Failed to generate CV. Save your CV first.', warn: true })
          return
        }
        setPdfUrl(data.url)
        window.open(data.url, '_blank')
      }
    } catch {
      setUploadMsg({ text: 'Failed to generate CV. Please try again.', warn: true })
    } finally {
      setGenerating(false)
    }
  }

  const tabBtn = (v: typeof view): React.CSSProperties => ({
    padding: '0.35rem 0.75rem',
    borderRadius: 'var(--radius-full)',
    border: '1px solid',
    borderColor: view === v ? 'var(--brand-orange)' : 'var(--glass-border)',
    background: view === v ? 'rgba(247,127,3,0.1)' : 'transparent',
    color: view === v ? 'var(--brand-orange-light)' : 'var(--color-text-secondary)',
    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
    display: 'flex', alignItems: 'center', gap: '0.375rem',
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Upload message banner */}
      {uploadMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.5rem 0.875rem',
          marginBottom: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          background: uploadMsg.warn ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
          border: `1px solid ${uploadMsg.warn ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
          fontSize: '0.82rem',
          color: uploadMsg.warn ? 'var(--color-error)' : 'var(--color-success)',
        }}>
          <span>{uploadMsg.warn ? '⚠ ' : '✓ '}{uploadMsg.text}</span>
          <button onClick={() => setUploadMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem', lineHeight: 1, padding: '0 0.25rem' }}>
            ×
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.docx"
        style={{ display: 'none' }}
        onChange={handleUpload}
      />

      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: '0.75rem', marginBottom: '1rem',
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button style={tabBtn('split')} onClick={() => setView('split')}>
            <Code size={13} />Split
          </button>
          <button style={tabBtn('editor')} onClick={() => setView('editor')}>
            <Code size={13} />Editor
          </button>
          <button style={tabBtn('preview')} onClick={() => setView('preview')}>
            <Eye size={13} />Preview
          </button>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--glass-border)',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem', fontWeight: 500,
            opacity: uploading ? 0.6 : 1,
          }}>
          <Upload size={13} />
          {uploading ? 'Importing…' : 'Upload CV'}
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          {saving && <span style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>Saving…</span>}
          {!saving && savedAt && (
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Save size={12} />
              Saved {new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
              style={{
                padding: '0.4rem 0.875rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-success)',
                color: '#fff', textDecoration: 'none',
                fontWeight: 600, fontSize: '0.8rem',
                display: 'flex', alignItems: 'center', gap: '0.375rem',
              }}>
              <Download size={13} /> View &amp; Print CV
            </a>
          )}

          <button
            onClick={generatePdf}
            disabled={generating || cv.length < 100}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: 'var(--radius-full)',
              background: generating ? 'var(--color-bg-tertiary)' : 'var(--color-secondary)',
              color: generating ? 'var(--color-text-tertiary)' : '#fff',
              border: 'none', cursor: generating ? 'not-allowed' : 'pointer',
              fontWeight: 600, fontSize: '0.8rem',
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              transition: 'all var(--transition-fast)',
            }}>
            {generating ? '⏳ Generating…' : '📄 Generate PDF'}
          </button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div style={{
        flex: 1, display: 'grid', minHeight: 0,
        gridTemplateColumns: view === 'split' ? '1fr 1fr' : '1fr',
        gap: '1rem',
      }}>
        {view !== 'preview' && (
          <textarea
            value={cv}
            onChange={e => setCv(e.target.value)}
            spellCheck={false}
            placeholder="# Your Name&#10;&#10;## Experience&#10;&#10;### Job Title @ Company (2020–Present)&#10;- Achievement one&#10;- Achievement two"
            style={{
              width: '100%', height: '100%',
              background: 'var(--color-code-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              color: '#e2e8f0',
              padding: '1rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.7,
              boxSizing: 'border-box',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-orange)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--glass-border)' }}
          />
        )}

        {view !== 'editor' && (
          <div style={{
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: '#fff',
            height: '100%',
          }}>
            <div style={{
              padding: '0.375rem 0.75rem',
              background: 'var(--color-bg-secondary)',
              borderBottom: '1px solid var(--glass-border)',
              fontSize: '0.72rem',
              color: 'var(--color-text-tertiary)',
            }}>
              Live Preview
            </div>
            <iframe
              ref={iframeRef}
              style={{ width: '100%', height: 'calc(100% - 2rem)', border: 'none' }}
              title="CV Preview"
            />
          </div>
        )}
      </div>
    </div>
  )
}
