import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicPage = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

const isPublicApi = createRouteMatcher(['/api/webhooks(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl
  const { userId } = await auth()

  // Root: authenticated users go to dashboard; unauthenticated see the landing page
  if (url.pathname === '/') {
    if (userId) return NextResponse.redirect(new URL('/dashboard', req.url))
    return
  }

  // Public API routes (webhooks) — no auth needed
  if (isPublicApi(req)) return

  // Public pages — if already signed in, send to dashboard
  if (isPublicPage(req)) {
    if (userId && (url.pathname.startsWith('/sign-in') || url.pathname.startsWith('/sign-up'))) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return
  }

  // Everything else: require auth
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', url.pathname)
    return NextResponse.redirect(signInUrl)
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|fonts/|brand/).*)',
  ],
}
