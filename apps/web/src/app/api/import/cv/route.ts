import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase()
  const buffer = Buffer.from(await file.arrayBuffer())

  if (ext === 'txt') {
    const text = buffer.toString('utf-8')
    return NextResponse.json({ text })
  }

  if (ext === 'pdf') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse')
      const data = await pdfParse(buffer)
      const text = data.text?.trim()
      if (text && text.length > 50) return NextResponse.json({ text })
      return NextResponse.json({
        text: '',
        warning: 'Could not extract text from this PDF — it may be image-based or scanned. Please paste your CV text directly.',
      })
    } catch {
      return NextResponse.json({
        text: '',
        warning: 'PDF parsing failed. Please paste your CV text directly.',
      })
    }
  }

  if (ext === 'docx') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      const text = result.value?.trim()
      if (text && text.length > 50) return NextResponse.json({ text })
      return NextResponse.json({
        text: '',
        warning: 'Could not extract text from this DOCX. Please paste your CV text directly.',
      })
    } catch {
      return NextResponse.json({
        text: '',
        warning: 'DOCX parsing failed. Please paste your CV text directly.',
      })
    }
  }

  return NextResponse.json({
    text: '',
    warning: 'Unsupported file type. Please upload a PDF, DOCX, or TXT file.',
  })
}
