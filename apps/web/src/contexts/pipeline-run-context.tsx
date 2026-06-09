'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { LogEvent } from '@/hooks/use-sse'

type RunStatus = 'idle' | 'streaming' | 'done' | 'error'

interface PipelineRunState {
  evaluatingId: string | null
  evaluatingUrl: string | null
  events: LogEvent[]
  status: RunStatus
  reportId: string | null
  finalScore: number | null
  startEvaluation: (id: string, jobUrl: string) => void
  clearEvaluation: () => void
  cancel: () => void
}

const PipelineRunContext = createContext<PipelineRunState | null>(null)

export function PipelineRunProvider({ children }: { children: React.ReactNode }) {
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null)
  const [evaluatingUrl, setEvaluatingUrl] = useState<string | null>(null)
  const [sseUrl, setSseUrl] = useState<string | null>(null)
  const [events, setEvents] = useState<LogEvent[]>([])
  const [status, setStatus] = useState<RunStatus>('idle')
  const [reportId, setReportId] = useState<string | null>(null)
  const [finalScore, setFinalScore] = useState<number | null>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!sseUrl) return
    setEvents([])
    setStatus('streaming')
    setReportId(null)
    setFinalScore(null)

    const es = new EventSource(sseUrl)
    esRef.current = es

    // closed flag prevents onerror from firing after we already handled 'done'
    let closed = false
    const close = () => { if (!closed) { closed = true; es.close() } }

    es.onmessage = (e) => {
      const event = JSON.parse(e.data) as LogEvent
      if (event.type === 'done') {
        setReportId(event.reportId)
        setFinalScore(event.score)
        setStatus('done')
        setEvents(prev => [...prev, event])
        close()
        // Update pipeline item in DB from here so it works even when PipelineClient is unmounted
        setEvaluatingId(prev => {
          if (prev) {
            fetch(`/api/pipeline/${prev}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'done', reportId: event.reportId }),
            }).catch(() => {})
          }
          return prev
        })
      } else if (event.type === 'error') {
        setStatus('error')
        setEvents(prev => [...prev, event])
        close()
      } else {
        setEvents(prev => [...prev, event])
      }
    }

    es.onerror = () => {
      if (!closed) {
        setStatus('error')
        close()
      }
    }

    return () => close()
  }, [sseUrl])

  const startEvaluation = useCallback((id: string, jobUrl: string) => {
    esRef.current?.close()
    setEvaluatingId(id)
    setEvaluatingUrl(jobUrl)
    setSseUrl(`/api/evaluate?url=${encodeURIComponent(jobUrl)}`)
  }, [])

  const cancel = useCallback(() => {
    esRef.current?.close()
    setStatus('idle')
    setEvents([])
    setReportId(null)
    setFinalScore(null)
  }, [])

  const clearEvaluation = useCallback(() => {
    cancel()
    setEvaluatingId(null)
    setEvaluatingUrl(null)
    setSseUrl(null)
  }, [cancel])

  return (
    <PipelineRunContext.Provider value={{
      evaluatingId, evaluatingUrl,
      events, status, reportId, finalScore,
      startEvaluation, clearEvaluation, cancel,
    }}>
      {children}
    </PipelineRunContext.Provider>
  )
}

export function usePipelineRun() {
  const ctx = useContext(PipelineRunContext)
  if (!ctx) throw new Error('usePipelineRun must be used within PipelineRunProvider')
  return ctx
}
