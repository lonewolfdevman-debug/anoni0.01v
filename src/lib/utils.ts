// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}

export function timeAgo(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diff = now.getTime() - then.getTime()
  const secs = Math.floor(diff / 1000)
  const mins = Math.floor(secs / 60)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (days > 0) return `${days}d ago`
  if (hrs > 0) return `${hrs}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

export function generateAnonymousAlias(): string {
  const words = [
    'Shadow', 'Nova', 'Cipher', 'Phantom', 'Venom', 'Luna', 'Drift',
    'Echo', 'Blaze', 'Mystic', 'Ghost', 'Raven', 'Storm', 'Neon',
    'Pixel', 'Glitch', 'Specter', 'Void', 'Astra', 'Hex', 'Prism',
    'Flux', 'Apex', 'Zero', 'Nexus', 'Orbit', 'Pulse', 'Quasar',
  ]
  const word = words[Math.floor(Math.random() * words.length)]
  const num = Math.floor(Math.random() * 90) + 10
  return `${word}${num}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
