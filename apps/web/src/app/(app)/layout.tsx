import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { getAccessState } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { signedIn, approved } = await getAccessState()

  // Not signed in → let Clerk middleware handle the sign-in redirect.
  if (!signedIn) redirect('/sign-in')

  // Signed in but not yet approved for early access → waitlist holding page.
  if (!approved) redirect('/pending')

  return <AppShell>{children}</AppShell>
}
