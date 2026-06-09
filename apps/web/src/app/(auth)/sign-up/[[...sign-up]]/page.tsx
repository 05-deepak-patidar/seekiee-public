import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--color-bg-primary)' }}>
      <div className="w-full max-w-md px-4">
        <div className="flex flex-col items-center mb-8">
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
            marginBottom: '0.5rem',
          }}>Seekiee</span>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', textAlign: 'center' }}>
            Request early access to your AI-powered job search.<br />
            New accounts are reviewed before activation.
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  )
}
