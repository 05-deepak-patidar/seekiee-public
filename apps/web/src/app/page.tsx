import Link from 'next/link'

const features = [
  {
    icon: '⚡',
    title: 'Evaluate any offer in seconds',
    description: 'Paste a job URL and get a structured A–F score covering role fit, comp, culture, and legitimacy.',
  },
  {
    icon: '📄',
    title: 'ATS-optimized CVs',
    description: 'Generate a tailored PDF resume for each application — keyword-matched, clean, recruiter-ready.',
  },
  {
    icon: '🔍',
    title: 'Zero-token portal scanner',
    description: 'Scan Greenhouse, Ashby, Lever and 45+ company portals for new roles without burning AI credits.',
  },
  {
    icon: '📊',
    title: 'Pipeline & pattern tracking',
    description: 'Track every application, follow-up cadence, and rejection pattern to sharpen your targeting over time.',
  },
]

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--color-bg-primary)', minHeight: '100vh', color: 'var(--color-text-primary)', fontFamily: "'Inter', sans-serif" }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--color-border)', padding: '0 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: "'Poppins','Inter',sans-serif",
            fontWeight: 800,
            fontSize: '1.6rem',
            lineHeight: 1,
            background: 'linear-gradient(90deg, #FF8D28 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.03em',
            display: 'inline-block',
          }}>Seekiee</span>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <a href="https://seekiee-docs.darkiee.com" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', textDecoration: 'none' }}>
              Docs
            </a>
            <a href="https://github.com/05-deepak-patidar/Seekiee" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', textDecoration: 'none' }}>
              GitHub
            </a>
            <Link href="/sign-in"
              style={{ background: 'var(--brand-orange)', color: '#fff', padding: '0.4rem 1.1rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '6rem 2rem 4rem' }}>
        <div style={{ display: 'inline-block', background: 'rgba(247,127,3,0.12)', border: '1px solid rgba(247,127,3,0.3)', borderRadius: '999px', padding: '0.3rem 1rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--brand-orange)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Free forever · Open source
        </div>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', lineHeight: 1.15, margin: '0 auto 1.25rem', maxWidth: '720px', background: 'linear-gradient(135deg, #f77f03 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AI Job Search<br />Command Center
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.15rem', maxWidth: '560px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          Evaluate offers, generate tailored CVs, scan portals, and track every application — all in one place. Powered by AI, built for focus.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/sign-up"
            style={{ background: 'var(--brand-orange)', color: '#fff', padding: '0.75rem 2rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(247,127,3,0.35)' }}>
            Get started free
          </Link>
          <a href="https://github.com/05-deepak-patidar/Seekiee" target="_blank" rel="noopener noreferrer"
            style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', padding: '0.75rem 2rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, textDecoration: 'none', border: '1px solid var(--color-border)' }}>
            View on GitHub
          </a>
        </div>
        <p style={{ marginTop: '1rem', color: 'var(--color-text-tertiary)', fontSize: '0.82rem' }}>
          No credit card · Sign in with Google or GitHub
        </p>
      </section>

      {/* Features */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 2rem 6rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {features.map((f) => (
          <div key={f.title} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{f.icon}</div>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>{f.title}</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{f.description}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '1.5rem 2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem', margin: 0 }}>
          Built by{' '}
          <a href="https://darkiee.com" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--brand-orange)', textDecoration: 'none', fontWeight: 600 }}>
            Darkiee
          </a>
          {' '}· MIT License ·{' '}
          <a href="https://seekiee-docs.darkiee.com" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
            Docs
          </a>
          {' · '}
          <a href="https://github.com/05-deepak-patidar/Seekiee" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
            Open source
          </a>
        </p>
      </footer>
    </div>
  )
}
