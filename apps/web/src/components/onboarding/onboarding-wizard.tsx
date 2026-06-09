'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CvStep } from './cv-step'
import { ProfileStep } from './profile-step'
import { PortalsStep } from './portals-step'
import { ReadyStep } from './ready-step'

const STEPS = ['Your CV', 'Your Profile', 'Job Portals', 'Ready!']

export function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    cvText: '',
    profile: {} as Record<string, string>,
    portals: [] as string[],
  })
  const router = useRouter()

  const next = (patch: Partial<typeof data>) => {
    setData(prev => ({ ...prev, ...patch }))
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem 1rem',
    }}>
      {/* Logo */}
      <span style={{
        fontFamily: "'Poppins','Inter',sans-serif",
        fontWeight: 800,
        fontSize: '1.75rem',
        lineHeight: 1,
        background: 'linear-gradient(90deg, #FF8D28 0%, #8B5CF6 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        letterSpacing: '-0.03em',
        display: 'inline-block',
        marginBottom: '2rem',
      }}>Seekiee</span>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', alignItems: 'center' }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 28, height: 28,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700,
              background: i < step ? 'var(--color-success)'
                : i === step ? 'var(--brand-orange)' : 'var(--color-bg-tertiary)',
              color: i <= step ? '#fff' : 'var(--color-text-tertiary)',
              transition: 'all var(--transition-base)',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{
              fontSize: '0.8rem',
              color: i === step ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              fontWeight: i === step ? 600 : 400,
              display: i < 3 ? undefined : undefined,
            }}>{label}</span>
            {i < STEPS.length - 1 && (
              <div style={{ width: 32, height: 2, background: i < step ? 'var(--color-success)' : 'var(--glass-border)', borderRadius: 1 }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div style={{
        width: '100%', maxWidth: 560,
        background: 'var(--color-surface)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
      }}>
        {step === 0 && <CvStep onNext={(cvText) => next({ cvText })} />}
        {step === 1 && <ProfileStep onNext={(profile) => next({ profile })} />}
        {step === 2 && <PortalsStep onNext={(portals) => next({ portals })} />}
        {step === 3 && <ReadyStep onDone={() => next({})} />}
      </div>
    </div>
  )
}
