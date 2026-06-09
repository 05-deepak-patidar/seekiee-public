'use client'

import { useState, useRef } from 'react'
import { ScanSearch, Plus, Trash2, X } from 'lucide-react'

type Portal = {
  id: string
  companyName: string
  careersUrl: string | null
  provider: string | null
  apiUrl: string | null
  enabled: boolean | null
  locationFilter: unknown
}

type ScanResult = {
  id: string
  company: string | null
  jobTitle: string | null
  jobUrl: string | null
  location: string | null
  addedToPipeline: boolean | null
  createdAt: string | null
}

type ScanRun = {
  id: string
  startedAt: string | null
  completedAt: string | null
  companiesScanned: number | null
  jobsFound: number | null
  jobsNew: number | null
  status: string | null
}

type SseEvent =
  | { type: 'log'; text: string }
  | { type: 'company_done'; company: string; found: number; new: number }
  | { type: 'done'; runId: string; jobsFound: number; jobsNew: number }
  | { type: 'error'; message: string }

const PROVIDERS = ['greenhouse', 'lever', 'ashby']

export function ScanClient({ initialPortals, initialResults, initialRuns }: {
  initialPortals: Portal[]
  initialResults: ScanResult[]
  initialRuns: ScanRun[]
}) {
  const [portals, setPortals] = useState<Portal[]>(initialPortals)
  const [results, setResults] = useState<ScanResult[]>(initialResults)
  const [runs, setRuns] = useState<ScanRun[]>(initialRuns)

  const [showAddPortal, setShowAddPortal] = useState(false)
  const [newCompany, setNewCompany] = useState('')
  const [newProvider, setNewProvider] = useState('greenhouse')
  const [newApiUrl, setNewApiUrl] = useState('')
  const [newCareersUrl, setNewCareersUrl] = useState('')
  const [addingPortal, setAddingPortal] = useState(false)

  const [scanning, setScanning] = useState(false)
  const [scanLog, setScanLog] = useState<string[]>([])
  const [scanStatus, setScanStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set())
  const [addingToPipeline, setAddingToPipeline] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  const addPortal = async () => {
    if (!newCompany || !newProvider || !newApiUrl) return
    setAddingPortal(true)
    try {
      const res = await fetch('/api/scan/portals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: newCompany, provider: newProvider, apiUrl: newApiUrl, careersUrl: newCareersUrl || null }),
      })
      const created = await res.json() as Portal
      setPortals(prev => [created, ...prev])
      setNewCompany('')
      setNewApiUrl('')
      setNewCareersUrl('')
      setShowAddPortal(false)
    } finally {
      setAddingPortal(false)
    }
  }

  const togglePortal = async (id: string, enabled: boolean) => {
    await fetch(`/api/scan/portals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled }) })
    setPortals(prev => prev.map(p => p.id === id ? { ...p, enabled } : p))
  }

  const deletePortal = async (id: string) => {
    await fetch(`/api/scan/portals/${id}`, { method: 'DELETE' })
    setPortals(prev => prev.filter(p => p.id !== id))
  }

  const startScan = () => {
    setScanning(true)
    setScanLog([])
    setScanStatus('running')

    const es = new EventSource('/api/scan/run')
    esRef.current = es

    es.onmessage = (e: MessageEvent) => {
      const event = JSON.parse(e.data as string) as SseEvent
      if (event.type === 'log') {
        setScanLog(prev => [...prev, event.text])
      } else if (event.type === 'company_done') {
        setScanLog(prev => [...prev, `  ${event.company}: ${event.found} found, ${event.new} new`])
      } else if (event.type === 'done') {
        setScanLog(prev => [...prev, `✓ Scan complete — ${event.jobsNew} new jobs found`])
        setScanStatus('done')
        setScanning(false)
        es.close()
        fetch('/api/scan/results').then(r => r.json()).then((data: { results: ScanResult[]; runs: ScanRun[] }) => {
          setResults(data.results)
          setRuns(data.runs)
        })
      } else if (event.type === 'error') {
        setScanLog(prev => [...prev, `✗ Error: ${event.message}`])
        setScanStatus('error')
        setScanning(false)
        es.close()
      }
    }
    es.onerror = () => {
      setScanStatus('error')
      setScanning(false)
      es.close()
    }
  }

  const addToPipeline = async (ids: string[]) => {
    if (ids.length === 0) return
    setAddingToPipeline(true)
    try {
      const res = await fetch('/api/scan/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultIds: ids }),
      })
      const data = await res.json() as { added: number }
      setResults(prev => prev.map(r => ids.includes(r.id) ? { ...r, addedToPipeline: true } : r))
      setSelectedResults(new Set())
      alert(`${data.added} jobs added to Pipeline.`)
    } finally {
      setAddingToPipeline(false)
    }
  }

  const toggleResult = (id: string) => {
    setSelectedResults(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.625rem 0.75rem',
    background: 'var(--color-bg-primary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text-primary)', fontSize: '0.875rem', outline: 'none',
  }

  const enabledCount = portals.filter(p => p.enabled).length
  const newResults = results.filter(r => !r.addedToPipeline)

  return (
    <div style={{ padding: '2rem', maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <ScanSearch size={20} style={{ color: 'var(--brand-orange)' }} />
        <h1 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.5rem' }}>Portal Scanner</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
        Scan Greenhouse, Lever, and Ashby portals directly — no scraping, zero token cost.
      </p>

      {/* Portals config */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            COMPANIES ({enabledCount} enabled)
          </h3>
          <button onClick={() => setShowAddPortal(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.875rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
            {showAddPortal ? <X size={13} /> : <Plus size={13} />}{showAddPortal ? 'Cancel' : 'Add Company'}
          </button>
        </div>

        {showAddPortal && (
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Company Name</label>
                <input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="Stripe" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>ATS Provider</label>
                <select value={newProvider} onChange={e => setNewProvider(e.target.value)} style={inputStyle}>
                  {PROVIDERS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  {newProvider === 'greenhouse' ? 'Board Token' : newProvider === 'lever' ? 'Company Slug' : 'Organization ID'}
                </label>
                <input value={newApiUrl} onChange={e => setNewApiUrl(e.target.value)}
                  placeholder={newProvider === 'greenhouse' ? 'stripe' : newProvider === 'lever' ? 'netflix' : 'linear'}
                  style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Careers URL (optional)</label>
                <input value={newCareersUrl} onChange={e => setNewCareersUrl(e.target.value)} placeholder="https://stripe.com/jobs" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={addPortal} disabled={addingPortal || !newCompany || !newApiUrl}
                style={{ padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-full)', background: newCompany && newApiUrl ? 'var(--color-primary)' : 'var(--color-bg-tertiary)', color: newCompany && newApiUrl ? '#fff' : 'var(--color-text-tertiary)', border: 'none', fontWeight: 700, fontSize: '0.875rem', cursor: newCompany && newApiUrl ? 'pointer' : 'not-allowed' }}>
                {addingPortal ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {portals.length === 0 ? (
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>No companies configured. Add your first company above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {portals.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-sm)', background: p.enabled ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.companyName}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginLeft: '0.625rem' }}>{p.provider} • {p.apiUrl}</span>
                </div>
                <button onClick={() => togglePortal(p.id, !p.enabled)}
                  style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid', borderColor: p.enabled ? '#34d399' : 'var(--glass-border)', background: p.enabled ? 'rgba(52,211,153,0.1)' : 'transparent', color: p.enabled ? '#34d399' : 'var(--color-text-tertiary)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
                  {p.enabled ? 'ON' : 'OFF'}
                </button>
                <button onClick={() => deletePortal(p.id)} style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Run scan */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: scanLog.length > 0 ? '1rem' : 0 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Run Scan</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>Scans {enabledCount} enabled {enabledCount === 1 ? 'company' : 'companies'}</div>
          </div>
          <button onClick={startScan} disabled={scanning || enabledCount === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.625rem 1.5rem', borderRadius: 'var(--radius-full)', background: !scanning && enabledCount > 0 ? 'var(--color-primary)' : 'var(--color-bg-tertiary)', color: !scanning && enabledCount > 0 ? '#fff' : 'var(--color-text-tertiary)', border: 'none', fontWeight: 700, fontSize: '0.875rem', cursor: !scanning && enabledCount > 0 ? 'pointer' : 'not-allowed', boxShadow: !scanning && enabledCount > 0 ? 'var(--shadow-glow)' : 'none' }}>
            <ScanSearch size={15} />{scanning ? 'Scanning…' : 'Scan Now'}
          </button>
        </div>

        {scanLog.length > 0 && (
          <div style={{ background: 'var(--color-code-bg)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', maxHeight: 200, overflowY: 'auto' }}>
            {scanLog.map((line, i) => (
              <div key={i} style={{ color: line.startsWith('✓') ? '#34d399' : line.startsWith('✗') ? '#f87171' : 'var(--color-text-secondary)', marginBottom: '0.2rem' }}>
                {line}{i === scanLog.length - 1 && scanStatus === 'running' && <span style={{ color: 'var(--brand-orange)' }}> ●</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scan results */}
      {results.length > 0 && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              SCAN RESULTS ({newResults.length} new)
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {selectedResults.size > 0 && (
                <button onClick={() => addToPipeline(Array.from(selectedResults))} disabled={addingToPipeline}
                  style={{ padding: '0.35rem 0.875rem', borderRadius: 'var(--radius-full)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                  Add {selectedResults.size} to Pipeline
                </button>
              )}
              {newResults.length > 0 && selectedResults.size === 0 && (
                <button onClick={() => addToPipeline(newResults.map(r => r.id))} disabled={addingToPipeline}
                  style={{ padding: '0.35rem 0.875rem', borderRadius: 'var(--radius-full)', background: 'rgba(247,127,3,0.15)', color: 'var(--brand-orange)', border: '1px solid rgba(247,127,3,0.3)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                  Add All New ({newResults.length})
                </button>
              )}
            </div>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {results.slice(0, 50).map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '0.75rem 1rem',
                borderBottom: i < Math.min(results.length, 50) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: selectedResults.has(r.id) ? 'rgba(247,127,3,0.05)' : 'transparent',
                opacity: r.addedToPipeline ? 0.5 : 1,
              }}>
                {!r.addedToPipeline && (
                  <input type="checkbox" checked={selectedResults.has(r.id)} onChange={() => toggleResult(r.id)}
                    style={{ flexShrink: 0, cursor: 'pointer', accentColor: 'var(--brand-orange)' }} />
                )}
                {r.addedToPipeline && <span style={{ width: 16, flexShrink: 0, fontSize: '0.8rem', color: '#34d399' }}>✓</span>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.125rem' }}>{r.company}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.jobTitle}</div>
                </div>
                {r.location && <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{r.location}</span>}
                {r.jobUrl && (
                  <a href={r.jobUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.78rem', color: 'var(--brand-orange)', textDecoration: 'none', flexShrink: 0 }}>View →</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scan history */}
      {runs.length > 0 && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>SCAN HISTORY</h3>
          </div>
          {runs.slice(0, 5).map((run, i) => (
            <div key={run.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 1rem', borderBottom: i < Math.min(runs.length, 5) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                background: run.status === 'done' ? 'rgba(52,211,153,0.2)' : run.status === 'error' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.1)',
                color: run.status === 'done' ? '#34d399' : run.status === 'error' ? '#f87171' : 'var(--color-text-tertiary)',
                textTransform: 'uppercase', flexShrink: 0,
              }}>{run.status}</span>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                {run.startedAt ? new Date(run.startedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
              <div style={{ flex: 1, fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>
                {run.companiesScanned} companies • {run.jobsFound} found • <span style={{ color: run.jobsNew && run.jobsNew > 0 ? 'var(--brand-orange)' : 'inherit' }}>{run.jobsNew} new</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
