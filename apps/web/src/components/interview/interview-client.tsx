'use client'

import { useState, useRef, useCallback } from 'react'
import { BookOpen, Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react'

type Story = {
  id: string
  title: string | null
  situation: string | null
  task: string | null
  action: string | null
  result: string | null
  reflection: string | null
  tags: string[] | null
  createdAt: string | null
}

type PrepReport = {
  id: string
  applicationId: string | null
  company: string | null
  role: string | null
  prepMd: string | null
  createdAt: string | null
}

type Application = { id: string; company: string; role: string }

type SseEvent =
  | { type: 'log'; text: string }
  | { type: 'done'; prepId: string }
  | { type: 'error'; message: string }

function MarkdownBlock({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: '0.5rem' }} />
        if (line.startsWith('### ')) return <h4 key={i} style={{ fontFamily: 'var(--font-primary)', color: 'var(--color-text-primary)', marginTop: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>{line.replace(/^###\s+/, '')}</h4>
        if (line.startsWith('## ')) return <h3 key={i} style={{ fontFamily: 'var(--font-primary)', color: 'var(--color-text-primary)', fontSize: '1rem', fontWeight: 700, marginTop: '1rem' }}>{line.replace(/^##\s+/, '')}</h3>
        if (line.startsWith('# ')) return <h2 key={i} style={{ fontFamily: 'var(--font-primary)', color: 'var(--color-text-primary)', fontSize: '1.1rem', fontWeight: 700 }}>{line.replace(/^#\s+/, '')}</h2>
        if (line.startsWith('| ')) return <pre key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', overflowX: 'auto', margin: 0 }}>{line}</pre>
        if (line.startsWith('- ')) return <div key={i} style={{ paddingLeft: '1rem', display: 'flex', gap: '0.5rem' }}><span style={{ color: 'var(--brand-orange)', flexShrink: 0 }}>•</span><span>{line.slice(2)}</span></div>
        if (/^\d+\.\s/.test(line)) return <div key={i} style={{ paddingLeft: '1rem', display: 'flex', gap: '0.5rem' }}><span style={{ color: 'var(--brand-orange)', flexShrink: 0 }}>{line.match(/^\d+/)?.[0]}.</span><span>{line.replace(/^\d+\.\s/, '')}</span></div>
        return <p key={i} style={{ margin: 0 }}>{line}</p>
      })}
    </div>
  )
}

function StoryCard({ story, onDelete, onEdit }: { story: Story; onDelete: () => void; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{story.title ?? 'Untitled Story'}</div>
          {story.tags && story.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {story.tags.map(t => (
                <span key={t} style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: 99, background: 'rgba(247,127,3,0.12)', color: 'var(--brand-orange)', fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={e => { e.stopPropagation(); onEdit() }} style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', fontSize: '0.78rem' }}>Edit</button>
          <button onClick={e => { e.stopPropagation(); onDelete() }} style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={13} /></button>
          {expanded ? <ChevronUp size={15} style={{ color: 'var(--color-text-tertiary)' }} /> : <ChevronDown size={15} style={{ color: 'var(--color-text-tertiary)' }} />}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.875rem' }}>
          {[['Situation', story.situation], ['Task', story.task], ['Action', story.action], ['Result', story.result], ['Reflection', story.reflection]].map(([label, val]) => val ? (
            <div key={label as string} style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>{label}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{val}</div>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  )
}

export function InterviewClient({ initialStories, initialPreps, applications }: {
  initialStories: Story[]
  initialPreps: PrepReport[]
  applications: Application[]
}) {
  const [tab, setTab] = useState<'preps' | 'stories'>('preps')
  const [stories, setStories] = useState<Story[]>(initialStories)
  const [preps, setPreps] = useState<PrepReport[]>(initialPreps)
  const [selectedPrep, setSelectedPrep] = useState<PrepReport | null>(null)

  const [generateAppId, setGenerateAppId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genLog, setGenLog] = useState<string[]>([])
  const [genStatus, setGenStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const esRef = useRef<EventSource | null>(null)

  const [showStoryForm, setShowStoryForm] = useState(false)
  const [editingStory, setEditingStory] = useState<Story | null>(null)
  const [storyForm, setStoryForm] = useState({ title: '', situation: '', task: '', action: '', result: '', reflection: '', tags: '' })
  const [savingStory, setSavingStory] = useState(false)

  const generatePrep = useCallback(() => {
    if (!generateAppId) return
    setGenerating(true)
    setGenLog([])
    setGenStatus('running')

    const es = new EventSource(`/api/interview/prep?applicationId=${generateAppId}`)
    esRef.current = es

    es.onmessage = (e: MessageEvent) => {
      const event = JSON.parse(e.data as string) as SseEvent
      if (event.type === 'log') setGenLog(prev => [...prev, event.text])
      if (event.type === 'done') {
        setGenStatus('done')
        setGenerating(false)
        es.close()
        fetch('/api/interview/prep').then(r => r.json()).then((rows: PrepReport[]) => setPreps(rows))
      }
      if (event.type === 'error') {
        setGenLog(prev => [...prev, `Error: ${event.message}`])
        setGenStatus('error')
        setGenerating(false)
        es.close()
      }
    }
    es.onerror = () => {
      setGenStatus('error')
      setGenerating(false)
      es.close()
    }
  }, [generateAppId])

  const openStoryForm = (story?: Story) => {
    if (story) {
      setEditingStory(story)
      setStoryForm({ title: story.title ?? '', situation: story.situation ?? '', task: story.task ?? '', action: story.action ?? '', result: story.result ?? '', reflection: story.reflection ?? '', tags: story.tags?.join(', ') ?? '' })
    } else {
      setEditingStory(null)
      setStoryForm({ title: '', situation: '', task: '', action: '', result: '', reflection: '', tags: '' })
    }
    setShowStoryForm(true)
  }

  const saveStory = async () => {
    setSavingStory(true)
    const payload = {
      title: storyForm.title || null,
      situation: storyForm.situation || null,
      task: storyForm.task || null,
      action: storyForm.action || null,
      result: storyForm.result || null,
      reflection: storyForm.reflection || null,
      tags: storyForm.tags ? storyForm.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
    }
    try {
      if (editingStory) {
        const res = await fetch(`/api/interview/stories/${editingStory.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const updated = await res.json() as Story
        setStories(prev => prev.map(s => s.id === updated.id ? updated : s))
      } else {
        const res = await fetch('/api/interview/stories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const created = await res.json() as Story
        setStories(prev => [created, ...prev])
      }
      setShowStoryForm(false)
    } finally {
      setSavingStory(false)
    }
  }

  const deleteStory = async (id: string) => {
    await fetch(`/api/interview/stories/${id}`, { method: 'DELETE' })
    setStories(prev => prev.filter(s => s.id !== id))
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)',
    border: '1px solid',
    borderColor: active ? 'var(--brand-orange)' : 'var(--glass-border)',
    background: active ? 'rgba(247,127,3,0.1)' : 'transparent',
    color: active ? 'var(--brand-orange)' : 'var(--color-text-secondary)',
    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
    transition: 'all var(--transition-fast)',
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.625rem 0.75rem',
    background: 'var(--color-bg-primary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text-primary)', fontSize: '0.875rem', outline: 'none',
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <BookOpen size={20} style={{ color: 'var(--brand-orange)' }} />
        <h1 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.5rem' }}>Interview Prep</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
        AI-generated interview guides per company, plus your STAR+R story bank.
      </p>

      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem' }}>
        <button onClick={() => setTab('preps')} style={tabStyle(tab === 'preps')}>Prep Guides {preps.length > 0 && `(${preps.length})`}</button>
        <button onClick={() => setTab('stories')} style={tabStyle(tab === 'stories')}>Story Bank {stories.length > 0 && `(${stories.length})`}</button>
      </div>

      {/* Prep Guides tab */}
      {tab === 'preps' && (
        <div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.875rem' }}>Generate Interview Guide</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>Select Application</label>
                <select value={generateAppId} onChange={e => setGenerateAppId(e.target.value)}
                  style={{ ...inputStyle }}>
                  <option value="">— Select a job —</option>
                  {applications.map(a => (
                    <option key={a.id} value={a.id}>{a.company} — {a.role}</option>
                  ))}
                </select>
              </div>
              <button onClick={generatePrep} disabled={generating || !generateAppId}
                style={{ padding: '0.625rem 1.25rem', borderRadius: 'var(--radius-full)', background: generateAppId && !generating ? 'var(--color-primary)' : 'var(--color-bg-tertiary)', color: generateAppId && !generating ? '#fff' : 'var(--color-text-tertiary)', border: 'none', fontWeight: 700, fontSize: '0.875rem', cursor: generateAppId && !generating ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
                {generating ? 'Generating…' : 'Generate'}
              </button>
            </div>

            {genStatus !== 'idle' && genLog.length > 0 && (
              <div style={{ marginTop: '0.875rem', background: 'var(--color-code-bg)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                {genLog.map((line, i) => (
                  <div key={i} style={{ marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--color-text-tertiary)', marginRight: '0.75rem' }}>[{String(i).padStart(2, '0')}]</span>
                    {line}
                    {i === genLog.length - 1 && genStatus === 'running' && <span style={{ color: 'var(--brand-orange)' }}> ●</span>}
                    {(i < genLog.length - 1 || genStatus === 'done') && <span style={{ color: '#34d399', marginLeft: '0.5rem' }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedPrep ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{selectedPrep.company}</span>
                  <span style={{ color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>— {selectedPrep.role}</span>
                </div>
                <button onClick={() => setSelectedPrep(null)} style={{ background: 'none', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-full)', padding: '0.3rem 0.875rem', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>← Back</button>
              </div>
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', maxHeight: 600, overflowY: 'auto' }}>
                {selectedPrep.prepMd ? <MarkdownBlock content={selectedPrep.prepMd} /> : <p style={{ color: 'var(--color-text-tertiary)' }}>No content.</p>}
              </div>
            </div>
          ) : preps.length === 0 ? (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>📝</div>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No guides yet</div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Select an application above and generate your first interview guide.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {preps.map(p => (
                <div key={p.id} onClick={() => setSelectedPrep(p)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', cursor: 'pointer', transition: 'border-color var(--transition-fast)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.company}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>{p.role} • {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--brand-orange)', fontWeight: 600 }}>View →</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Story Bank tab */}
      {tab === 'stories' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => openStoryForm()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-full)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: 'var(--shadow-glow)' }}>
              <Plus size={14} />Add Story
            </button>
          </div>

          {stories.length === 0 ? (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>📚</div>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No stories yet</div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Build your STAR+R story bank to answer behavioral questions with confidence.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {stories.map(s => (
                <StoryCard key={s.id} story={s} onDelete={() => deleteStory(s.id)} onEdit={() => openStoryForm(s)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Story form modal */}
      {showStoryForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', width: 560, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.1rem' }}>{editingStory ? 'Edit Story' : 'Add STAR+R Story'}</h2>
              <button onClick={() => setShowStoryForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', display: 'flex' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>Title</label>
                <input value={storyForm.title} onChange={e => setStoryForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Led migration that cut latency 40%" style={inputStyle} />
              </div>
              {(['situation', 'task', 'action', 'result', 'reflection'] as const).map(field => (
                <div key={field}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.375rem', textTransform: 'capitalize' }}>{field}</label>
                  <textarea value={storyForm[field]} onChange={e => setStoryForm(f => ({ ...f, [field]: e.target.value }))} rows={2}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>Tags (comma-separated)</label>
                <input value={storyForm.tags} onChange={e => setStoryForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. leadership, technical, cross-functional" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => setShowStoryForm(false)} style={{ flex: 1, padding: '0.625rem', borderRadius: 'var(--radius-full)', background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--glass-border)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveStory} disabled={savingStory} style={{ flex: 1, padding: '0.625rem', borderRadius: 'var(--radius-full)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: savingStory ? 'not-allowed' : 'pointer', opacity: savingStory ? 0.7 : 1 }}>
                {savingStory ? 'Saving…' : 'Save Story'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
