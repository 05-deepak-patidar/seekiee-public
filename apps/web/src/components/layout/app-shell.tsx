'use client'

import { PipelineRunProvider } from '@/contexts/pipeline-run-context'
import { Sidebar } from './sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PipelineRunProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </PipelineRunProvider>
  )
}
