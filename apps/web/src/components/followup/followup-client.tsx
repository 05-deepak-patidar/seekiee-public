'use client'

import { useState, useCallback } from 'react'
import { Bell, Plus, X, Trash2, Copy } from 'lucide-react'

type Followup = {
  id: string
  applicationId: string | null
  sentDate: string | null
  channel: string | null
  contact: string | null
  notes: string | null
  application?: { company: string; role: string; status: string; appliedDate: string | null } | null
}

type Application = {
  id: string
  company: string
  role: string
  status: string
  appliedDate: string | null
  jobUrl: string | null
}

type DraftData = { subject: string; email: string; linkedin: string }

const CHANNELS = ['Email', 'LinkedIn', 'Phone', 'Other']

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function nextDueDate(app: Application, followups: Followup[]): Date {
  const appFollowups = followups.filter(f => f.applicationId === app.id && f.sentDate)
  if (appFollowups.length === 0) {
    const base = app.appliedDate ? new Date(app.appliedDate) : new Date()
    const d = new Date(base)
    d.setDate(d.getDate() + 7)
    return d
  }
  const latest = appFollowups.sort((a, b) => (b.sentDate ?? '').localeCompare(a.sentDate ?? ''))[0]
  const d = new Date(latest.sentDate!)
  d.setDate(d.getDate() + 7)
  return d
}

function categorize(app: Application, followups: Followup[]): 'overdue' | 'today' | 'upcoming' | 'none' {
  const due = nextDueDate(app, followups)
  const days = daysUntil(due.toISOString().slice(0, 10))
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days <= 14) return 'upcoming'
  return 'none'
}

function CadenceCard({ app, followups, onLog, onDraft }: {
  app: Application
  followups: Followup[]
  onLog: (appId: string) => void
  onDraft: (appId: string) => void
}) {
  const due = nextDueDate(app, followups)
  const days = daysUntil(due.toISOString().slice(0, 10))
  const appFollowups = followups.filter(f => f.applicationId === app.id)
  const lastSent = appFollowups.length > 0
    ? appFollowups.sort((a, b) => (b.sentDate ?? '').localeCompare(a.sentDate ?? ''))[0].sentDate
    : null

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-md)',
      padding: '1rem',
    }}>
      <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{app.company}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '0.625rem' }}>{app.role}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '0.875rem' }}>
        {lastSent ? `Last contact: ${lastSent}` : 'No prior contact'}
        <span style={{ marginLeft: '0.5rem', color: days <= 0 ? '#f87171' : days === 0 ? 'var(--brand-orange)' : 'var(--color-text-tertiary)' }}>
          • {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `Due in ${days}d`}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => onLog(app.id)} style={{
          flex: 1, padding: '0.4rem', borderRadius: 'var(--radius-sm)',
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
        }}>Log</button>
        <button onClick={() => onDraft(app.id)} style={{
          flex: 1, padding: '0.4rem', borderRadius: 'var(--radius-sm)',
          background: 'transparent', color: 'var(--color-text-secondary)',
          border: '1px solid var(--glass-border)',
          fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
        }}>Draft</button>
      </div>
    </div>
  )
}

export function FollowupClient({ initialFollowups, activeApplications }: {
  initialFollowups: Followup[]
  activeApplications: Application[]
}) {
  const [followups, setFollowups] = useState<Followup[]>(initialFollowups)
  const [showLogModal, setShowLogModal] = useState(false)
  const [logAppId, setLogAppId] = useState('')
  const [logChannel, setLogChannel] = useState('Email')
  const [logContact, setLogContact] = useState('')
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10))
  const [logNotes, setLogNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const [draftAppId, setDraftAppId] = useState<string | null>(null)
  const [draftData, setDraftData] = useState<DraftData | null>(null)
  const [draftLoading, setDraftLoading] = useState(false)
  const [activeHistoryTab, setActiveHistoryTab] = useState<'cadence' | 'history'>('cadence')
  const [copied, setCopied] = useState<'email' | 'linkedin' | null>(null)

  const overdue = activeApplications.filter(a => categorize(a, followups) === 'overdue')
  const dueToday = activeApplications.filter(a => categorize(a, followups) === 'today')
  const upcoming = activeApplications.filter(a => categorize(a, followups) === 'upcoming')

  const openLog = useCallback((appId: string) => {
    setLogAppId(appId)
    setLogChannel('Email')
    setLogContact('')
    setLogDate(new Date().toISOString().slice(0, 10))
    setLogNotes('')
    setShowLogModal(true)
  }, [])

  const openDraft = useCallback(async (appId: string) => {
    setDraftAppId(appId)
    setDraftData(null)
    setDraftLoading(true)
    try {
      const res = await fetch(`/api/followups/draft?applicationId=${appId}`)
      const data = await res.json() as DraftData
      setDraftData(data)
    } catch {
      setDraftData({ subject: 'Error', email: 'Failed to generate draft.', linkedin: '' })
    } finally {
      setDraftLoading(false)
    }
  }, [])

  const saveFollowup = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: logAppId || null,
          sentDate: logDate,
          channel: logChannel,
          contact: logContact || null,
          notes: logNotes || null,
        }),
      })
      const created = await res.json() as Followup
      const app = activeApplications.find(a => a.id === logAppId)
      setFollowups(prev => [{ ...created, application: app ? { company: app.company, role: app.role, status: app.status, appliedDate: app.appliedDate } : null }, ...prev])
      setShowLogModal(false)
    } finally {
      setSaving(false)
    }
  }

  const deleteFollowup = async (id: string) => {
    await fetch(`/api/followups/${id}`, { method: 'DELETE' })
    setFollowups(prev => prev.filter(f => f.id !== id))
  }

  const copyText = (text: string, type: 'email' | 'linkedin') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
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

  return (
    <div style={{ padding: '2rem', maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <Bell size={20} style={{ color: 'var(--brand-orange)' }} />
        <h1 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.5rem' }}>Follow-up Center</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
        Stay on top of your applications with timely follow-ups. 7-day cadence by default.
      </p>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem' }}>
        <button onClick={() => setActiveHistoryTab('cadence')} style={tabStyle(activeHistoryTab === 'cadence')}>Cadence</button>
        <button onClick={() => setActiveHistoryTab('history')} style={tabStyle(activeHistoryTab === 'history')}>
          History {followups.length > 0 && `(${followups.length})`}
        </button>
        <button onClick={() => { setLogAppId(''); openLog('') }} style={{ ...tabStyle(false), marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Plus size={13} /> Log Follow-up
        </button>
      </div>

      {/* Cadence view */}
      {activeHistoryTab === 'cadence' && (
        <div>
          {activeApplications.length === 0 ? (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>🔔</div>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No active applications</div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Apply to jobs first, then track your follow-ups here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {/* Overdue */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Overdue</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>({overdue.length})</span>
                </div>
                {overdue.length === 0
                  ? <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>None overdue</p>
                  : overdue.map(a => <div key={a.id} style={{ marginBottom: '0.75rem' }}><CadenceCard app={a} followups={followups} onLog={openLog} onDraft={openDraft} /></div>)
                }
              </div>

              {/* Due Today */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-orange)' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Due Today</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>({dueToday.length})</span>
                </div>
                {dueToday.length === 0
                  ? <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>Nothing due today</p>
                  : dueToday.map(a => <div key={a.id} style={{ marginBottom: '0.75rem' }}><CadenceCard app={a} followups={followups} onLog={openLog} onDraft={openDraft} /></div>)
                }
              </div>

              {/* Upcoming */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Upcoming</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>({upcoming.length})</span>
                </div>
                {upcoming.length === 0
                  ? <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>All caught up</p>
                  : upcoming.map(a => <div key={a.id} style={{ marginBottom: '0.75rem' }}><CadenceCard app={a} followups={followups} onLog={openLog} onDraft={openDraft} /></div>)
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {activeHistoryTab === 'history' && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {followups.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No follow-ups logged yet.</p>
            </div>
          ) : followups.map((f, i) => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '0.875rem 1rem',
              borderBottom: i < followups.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.125rem' }}>
                  {f.application?.company ?? 'Unknown'} — {f.application?.role ?? ''}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>
                  {f.sentDate} • {f.channel ?? 'Unknown'}
                  {f.contact && ` • ${f.contact}`}
                  {f.notes && ` — ${f.notes}`}
                </div>
              </div>
              <button onClick={() => deleteFollowup(f.id)} style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Log modal */}
      {showLogModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            width: 460,
            maxWidth: '90vw',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.1rem' }}>Log Follow-up</h2>
              <button onClick={() => setShowLogModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', display: 'flex' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>Application</label>
                <select value={logAppId} onChange={e => setLogAppId(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', background: 'var(--color-bg-primary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-primary)', fontSize: '0.875rem', outline: 'none' }}>
                  <option value="">— No specific application —</option>
                  {activeApplications.map(a => (
                    <option key={a.id} value={a.id}>{a.company} — {a.role}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>Date</label>
                  <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
                    style={{ width: '100%', padding: '0.625rem 0.75rem', background: 'var(--color-bg-primary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-primary)', fontSize: '0.875rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>Channel</label>
                  <select value={logChannel} onChange={e => setLogChannel(e.target.value)}
                    style={{ width: '100%', padding: '0.625rem 0.75rem', background: 'var(--color-bg-primary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-primary)', fontSize: '0.875rem', outline: 'none' }}>
                    {CHANNELS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>Contact (optional)</label>
                <input value={logContact} onChange={e => setLogContact(e.target.value)} placeholder="e.g. Jane Smith, Recruiter"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', background: 'var(--color-bg-primary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-primary)', fontSize: '0.875rem', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>Notes (optional)</label>
                <textarea value={logNotes} onChange={e => setLogNotes(e.target.value)} rows={2}
                  style={{ width: '100%', padding: '0.625rem 0.75rem', background: 'var(--color-bg-primary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-primary)', fontSize: '0.875rem', outline: 'none', resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => setShowLogModal(false)} style={{ flex: 1, padding: '0.625rem', borderRadius: 'var(--radius-full)', background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--glass-border)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={saveFollowup} disabled={saving} style={{ flex: 1, padding: '0.625rem', borderRadius: 'var(--radius-full)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft modal */}
      {draftAppId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', width: 560, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.1rem' }}>AI Draft Messages</h2>
              <button onClick={() => { setDraftAppId(null); setDraftData(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', display: 'flex' }}><X size={18} /></button>
            </div>

            {draftLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)' }}>Generating draft with AI…</div>
            ) : draftData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>📧 Email</span>
                    <button onClick={() => copyText(`Subject: ${draftData.subject}\n\n${draftData.email}`, 'email')}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', color: copied === 'email' ? '#34d399' : 'var(--color-text-tertiary)', cursor: 'pointer', fontSize: '0.78rem' }}>
                      <Copy size={13} />{copied === 'email' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '0.875rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    <strong>Subject: {draftData.subject}</strong>{'\n\n'}{draftData.email}
                  </div>
                </div>
                {draftData.linkedin && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>💼 LinkedIn Message</span>
                      <button onClick={() => copyText(draftData.linkedin, 'linkedin')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', color: copied === 'linkedin' ? '#34d399' : 'var(--color-text-tertiary)', cursor: 'pointer', fontSize: '0.78rem' }}>
                        <Copy size={13} />{copied === 'linkedin' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '0.875rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                      {draftData.linkedin}
                    </div>
                  </div>
                )}
                <button onClick={() => openLog(draftAppId)}
                  style={{ padding: '0.625rem', borderRadius: 'var(--radius-full)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                  Log this follow-up
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
