import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://seekiee.darkiee.com'

export const metadata: Metadata = {
  title: {
    default: 'Seekiee — AI Job Search Command Center',
    template: '%s · Seekiee',
  },
  description: 'Evaluate job offers, generate ATS-optimized CVs, scan portals, and track applications — free forever. Powered by AI, built by Darkiee.',
  icons: { icon: '/brand/seekiee-favicon.svg' },
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Seekiee — AI Job Search Command Center',
    description: 'Evaluate offers, generate tailored CVs, scan 45+ portals, track applications. Free forever. By Darkiee.',
    url: siteUrl,
    siteName: 'Seekiee',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seekiee — AI Job Search Command Center',
    description: 'Evaluate offers, generate tailored CVs, scan 45+ portals. Free forever.',
    creator: '@darkiee',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
