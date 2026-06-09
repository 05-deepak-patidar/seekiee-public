'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard, Sparkles, Briefcase, FileText,
  LayoutList, ScanSearch, BarChart2, Bell, BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePipelineRun } from '@/contexts/pipeline-run-context'

const nav = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/evaluator',     icon: Sparkles,         label: 'Evaluate Job' },
  { href: '/applications',  icon: Briefcase,        label: 'Applications' },
  { href: '/cv',            icon: FileText,         label: 'CV & PDF' },
  { href: '/pipeline',      icon: LayoutList,       label: 'Pipeline' },
  { href: '/scan',          icon: ScanSearch,       label: 'Portal Scan' },
  { href: '/patterns',      icon: BarChart2,        label: 'Analytics' },
  { href: '/followup',      icon: Bell,             label: 'Follow-ups' },
  { href: '/interview',     icon: BookOpen,         label: 'Interview' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { status: runStatus } = usePipelineRun()
  const pipelineRunning = runStatus === 'streaming'

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: 'var(--color-bg-secondary)',
      borderRight: '1px solid var(--glass-border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1.25rem 1rem',
        borderBottom: '1px solid var(--glass-border)',
      }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'var(--font-primary)',
            fontWeight: 800,
            fontSize: '1.375rem',
            lineHeight: 1,
            background: 'linear-gradient(90deg, #FF8D28 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.03em',
            display: 'inline-block',
          }}>Seekiee</span>
        </Link>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem', letterSpacing: '0.05em' }}>
          AI JOB SEARCH
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto' }}>
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          const isPipeline = href === '/pipeline'
          const showRunning = isPipeline && pipelineRunning
          return (
            <Link key={href} href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                marginBottom: '0.125rem',
                fontSize: '0.875rem',
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                background: active ? 'rgba(247,127,3,0.1)' : 'transparent',
                borderLeft: active ? '2px solid var(--brand-orange)' : '2px solid transparent',
                transition: 'all var(--transition-fast)',
                textDecoration: 'none',
              }}>
              <Icon size={16} style={{ color: active ? 'var(--brand-orange)' : 'currentColor', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {showRunning && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--brand-orange)',
                  flexShrink: 0,
                  animation: 'seekiee-pulse 1.4s ease-in-out infinite',
                }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Help & Docs */}
      <div style={{ padding: '0.5rem 0.5rem 0', borderTop: '1px solid var(--glass-border)' }}>
        <a href="https://seekiee-docs.darkiee.com" target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
          }}>
          <BookOpen size={16} style={{ flexShrink: 0 }} />
          <span>Documentation</span>
        </a>
      </div>

      {/* User button */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <UserButton />
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Account</span>
      </div>
    </aside>
  )
}
