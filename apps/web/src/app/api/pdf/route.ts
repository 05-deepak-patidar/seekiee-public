import { requireDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const runtime = 'nodejs'
export const maxDuration = 60

function getR2() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function fontB64(filename: string): string {
  try {
    const p = path.join(process.cwd(), 'public', 'fonts', filename)
    if (!fs.existsSync(p)) return ''
    return `data:font/woff2;base64,${fs.readFileSync(p).toString('base64')}`
  } catch { return '' }
}

function buildHtml(cvText: string, fullName: string): string {
  // Inline fonts so the page is fully self-contained (no relative paths that break in R2/blob)
  const inter    = fontB64('inter-latin.woff2')
  const pop600   = fontB64('poppins-600-latin.woff2')
  const pop700   = fontB64('poppins-700-latin.woff2')
  const pop800   = fontB64('poppins-800-latin.woff2')

  const faces = [
    inter  && `@font-face{font-family:'Inter';src:url('${inter}')format('woff2');font-weight:100 900;font-style:normal;font-display:swap}`,
    pop600 && `@font-face{font-family:'Poppins';src:url('${pop600}')format('woff2');font-weight:600;font-style:normal;font-display:swap}`,
    pop700 && `@font-face{font-family:'Poppins';src:url('${pop700}')format('woff2');font-weight:700;font-style:normal;font-display:swap}`,
    pop800 && `@font-face{font-family:'Poppins';src:url('${pop800}')format('woff2');font-weight:800;font-style:normal;font-display:swap}`,
  ].filter(Boolean).join('\n')

  // Markdown → HTML (inline bold/italic/code)
  const inline = (t: string) =>
    t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
     .replace(/\*([^*]+)\*/g, '<em>$1</em>')
     .replace(/`([^`]+)`/g, '<code>$1</code>')

  const lines = cvText.split('\n')
  const parts: string[] = []
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim())              { parts.push('<div class="sp"></div>'); continue }
    if (line.startsWith('# '))     { parts.push(`<h1>${esc(line.slice(2))}</h1>`); continue }
    if (line.startsWith('## '))    { parts.push(`<h2>${esc(line.slice(3))}</h2>`); continue }
    if (line.startsWith('### '))   { parts.push(`<h3>${inline(esc(line.slice(4)))}</h3>`); continue }
    if (line.startsWith('- ') || line.startsWith('* '))
                                   { parts.push(`<li>${inline(esc(line.slice(2)))}</li>`); continue }
    parts.push(`<p>${inline(esc(line))}</p>`)
  }

  const title = esc(fullName || 'CV')
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — CV</title>
<style>
${faces}
*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:11pt;line-height:1.6;color:#1a1a2e;background:#fff;max-width:840px;margin:0 auto;padding:36px 52px}
h1{font-family:'Poppins',sans-serif;font-size:26px;font-weight:800;color:#1a1a2e;letter-spacing:-0.02em;margin-bottom:6px}
h2{font-family:'Poppins',sans-serif;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#C96200;border-bottom:1.5px solid #e5e5e5;padding-bottom:5px;margin:22px 0 10px}
h3{font-family:'Poppins',sans-serif;font-size:11.5px;font-weight:600;color:#1a1a2e;margin:10px 0 3px}
p{font-size:10.5pt;color:#2f2f2f;margin:2px 0}
li{list-style:disc;margin-left:20px;font-size:10.5pt;color:#2f2f2f;margin-bottom:3px}
code{font-family:monospace;font-size:0.9em;background:#f4f4f4;padding:1px 4px;border-radius:2px}
strong{font-weight:600}
em{font-style:italic;color:#555}
.sp{height:6px}
.hint{background:#fff8f0;border:1px solid #f0c080;border-radius:6px;padding:10px 18px;margin-bottom:28px;font-size:11px;color:#7a4800;display:flex;align-items:center;gap:10px}
.hint kbd{background:#fff;border:1px solid #ddd;border-radius:3px;padding:0 5px;font-size:10px;font-family:monospace}
@media print{
  .hint{display:none!important}
  body{padding:0;font-size:10.5pt}
  @page{size:A4;margin:18mm 14mm}
  h2{page-break-after:avoid}
  li,p{orphans:3;widows:3}
}
</style>
</head>
<body>
<div class="hint">
  📄&nbsp; Press <kbd>Ctrl+P</kbd> (Windows) or <kbd>Cmd+P</kbd> (Mac) → set destination to <strong>Save as PDF</strong>
</div>
${parts.join('\n')}
</body>
</html>`
}

export async function POST() {
  const user = await requireDbUser()

  const [profile] = await db.select({
    cvText: profiles.cvText,
    fullName: profiles.fullName,
  }).from(profiles).where(eq(profiles.userId, user.id))

  if (!profile?.cvText) {
    return NextResponse.json({ error: 'No CV found. Save your CV first.' }, { status: 400 })
  }

  const html = buildHtml(profile.cvText, profile.fullName ?? '')
  const slug = (profile.fullName ?? 'cv').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()

  // Upload to Cloudflare R2 and return presigned URL
  if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID) {
    const r2 = getR2()
    const bucket = process.env.R2_BUCKET ?? 'seekiee'
    const key = `cvs/${user.id}/${slug}.html`

    await r2.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(html, 'utf-8'),
      ContentType: 'text/html; charset=utf-8',
      ContentDisposition: `inline; filename="${slug}.html"`,
    }))

    const url = await getSignedUrl(
      r2,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 60 * 60 * 24 }, // 24h
    )

    return NextResponse.json({ url })
  }

  // Local dev fallback — no R2 configured
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-PDF-Fallback': 'true',
    },
  })
}
