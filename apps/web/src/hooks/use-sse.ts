'use client'

import { useState, useEffect, useRef } from 'react'

export type LogEvent =
  | { type: 'log';        text: string }
  | { type: 'block_start'; block: string }
  | { type: 'block_done'; block: string }
  | { type: 'chunk';      text: string }
  | { type: 'score';      value: number }
  | { type: 'done';       reportId: string; score: number }
  | { type: 'error';      message: string }

export function useSSE(url: string | null) {
  const [events, setEvents] = useState<LogEvent[]>([])
  const [status, setStatus] = useState<'idle' | 'streaming' | 'done' | 'error'>('idle')
  const [reportId, setReportId] = useState<string | null>(null)
  const [finalScore, setFinalScore] = useState<number | null>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!url) return
    setEvents([])
    setStatus('streaming')
    setReportId(null)
    setFinalScore(null)

    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (e) => {
      const event = JSON.parse(e.data) as LogEvent
      setEvents(prev => [...prev, event])
      if (event.type === 'done') {
        setReportId(event.reportId)
        setFinalScore(event.score)
        setStatus('done')
        es.close()
      }
      if (event.type === 'error') {
        setStatus('error')
        es.close()
      }
    }

    es.onerror = () => {
      setStatus('error')
      es.close()
    }

    return () => es.close()
  }, [url])

  const cancel = () => {
    esRef.current?.close()
    setStatus('idle')
    setEvents([])
  }

  return { events, status, reportId, finalScore, cancel }
}
