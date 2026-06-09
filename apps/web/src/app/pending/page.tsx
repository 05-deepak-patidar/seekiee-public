import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
import { getAccessState } from '@/lib/auth'

export const metadata = { title: 'You\'re on the list — Seekiee' }

export default async function PendingPage() {
  const { signedIn, approved, user } = await getAccessState()

  if (!signedIn) redirect('/sign-in')
  // Already approved (e.g. you just got granted access) → straight to the app.
  if (approved) redirect('/dashboard')

  return (
    <div style={{ background: 'var(--color-bg-primary)', minHeight: '100vh', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
        <span style={{
          fontFamily: "'Poppins','Inter',sans-serif",
          fontWeight: 800,
          fontSize: '2rem',
          lineHeight: 1,
          background: 'linear-gradient(90deg, #FF8D28 0%, #8B5CF6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.03em',
          display: 'inline-block',
          marginBottom: '1.5rem',
        }}>Seekiee</span>

        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎟️</div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          You&apos;re on the early-access list
        </h1>

        <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Seekiee is in limited early access while we onboard people gradually.
          Your request{user?.email ? <> (<strong style={{ color: 'var(--color-text-secondary)' }}>{user.email}</strong>)</> : null} has been received — we&apos;ll email you the moment your account is approved.
        </p>

        <div style={{ background: 'var(--color-bg-secondary, rgba(255,255,255,0.03))', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--color-text-tertiary)', lineHeight: 1.6, marginBottom: '1.75rem', textAlign: 'left' }}>
          <strong style={{ color: 'var(--color-text-secondary)' }}>What happens next?</strong>
          <ol style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem' }}>
            <li>We review early-access requests in small batches.</li>
            <li>You&apos;ll get an email when you&apos;re approved.</li>
            <li>Sign back in and you&apos;re in — your account is ready.</li>
          </ol>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center' }}>
          <Link href="/pending" replace
            style={{ background: 'var(--brand-orange, #FF8D28)', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
            Check status
          </Link>
          <SignOutButton>
            <button style={{ background: 'transparent', color: 'var(--color-text-tertiary)', border: '1px solid var(--color-border)', padding: '0.5rem 1.25rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              Sign out
            </button>
          </SignOutButton>
        </div>

        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
          Questions? <a href="https://discord.gg/8pRpHETxa4" style={{ color: 'var(--brand-orange, #FF8D28)' }}>Join our Discord</a>.
        </p>
      </div>
    </div>
  )
}
