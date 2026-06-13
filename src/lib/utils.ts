import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).substring(2, 9)
}

export function formatDeadlineRemaining(ms: number): { text: string; expired: boolean } {
  if (ms <= 0) {
    const age = Math.abs(ms)
    const days = Math.floor(age / (1000 * 60 * 60 * 24))
    const hours = Math.floor((age % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 0) return { text: `${days}d ${hours}h overdue`, expired: true }
    return { text: `${hours}h overdue`, expired: true }
  }
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((ms % (1000 * 60)) / 1000)
  if (days > 0) return { text: `${days}d ${hours}h ${minutes}m ${seconds}s`, expired: false }
  if (hours > 0) return { text: `${hours}h ${minutes}m ${seconds}s`, expired: false }
  if (minutes > 0) return { text: `${minutes}m ${seconds}s`, expired: false }
  return { text: `${seconds}s`, expired: false }
}
