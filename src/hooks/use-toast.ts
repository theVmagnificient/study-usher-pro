/**
 * use-toast.ts — thin wrapper around sonner for backwards compatibility
 * Components that called useToast() or toast() from here will still work.
 */
import { toast as sonnerToast } from 'sonner'

export interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function toast(options: ToastOptions) {
  const { title, description, variant } = options
  const message = title ?? ''
  if (variant === 'destructive') {
    sonnerToast.error(message, { description })
  } else {
    sonnerToast(message, { description })
  }
}

export function useToast() {
  return { toast }
}
