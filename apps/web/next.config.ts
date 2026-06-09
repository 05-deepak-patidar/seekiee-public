import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Allow images from Clerk and common CDNs
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: '**.clerk.accounts.dev' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
      { protocol: 'https', hostname: 'public.blob.vercel-storage.com' },
    ],
  },
  // serverExternalPackages: needed for playwright + chromium in Node.js routes
  serverExternalPackages: ['playwright-core', '@sparticuz/chromium-min'],
  // Transpile packages that ship ESM
  transpilePackages: [],
  experimental: {
    // Allow reading files from the project root in API routes
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
}

export default nextConfig
