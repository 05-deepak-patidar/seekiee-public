import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function scoreColor(score: number): string {
  if (score >= 4.5) return 'text-emerald-400'
  if (score >= 4.0) return 'text-[#ff8d28]'
  if (score >= 3.5) return 'text-amber-400'
  return 'text-red-400'
}

export function scoreBadgeClass(score: number): string {
  if (score >= 4.5) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
  if (score >= 4.0) return 'bg-orange-500/20 text-[#ff8d28] border border-orange-500/30'
  if (score >= 3.5) return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
  return 'bg-red-500/20 text-red-400 border border-red-500/30'
}

export function formatScore(score: number | null): string {
  if (score === null) return 'N/A'
  return `${score.toFixed(1)}/5`
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function daysSince(date: Date | string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
}
