import { ref, computed } from 'vue'

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  action?: any
  className?: string
  open?: boolean
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toasts = ref<Toast[]>([])
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    removeToast(toastId)
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = genId()
  const newToast: Toast = {
    ...toast,
    id,
    open: true,
  }
  
  toasts.value = [newToast, ...toasts.value].slice(0, TOAST_LIMIT)
  addToRemoveQueue(id)
  
  return {
    id,
    dismiss: () => dismissToast(id),
    update: (props: Partial<Toast>) => updateToast(id, props),
  }
}

const updateToast = (id: string, props: Partial<Toast>) => {
  toasts.value = toasts.value.map((t) => (t.id === id ? { ...t, ...props } : t))
}

const dismissToast = (toastId?: string) => {
  if (toastId) {
    addToRemoveQueue(toastId)
  } else {
    toasts.value.forEach((toast) => {
      addToRemoveQueue(toast.id)
    })
  }

  toasts.value = toasts.value.map((t) =>
    t.id === toastId || toastId === undefined
      ? {
          ...t,
          open: false,
        }
      : t
  )
}

const removeToast = (toastId?: string) => {
  if (toastId === undefined) {
    toasts.value = []
    return
  }
  toasts.value = toasts.value.filter((t) => t.id !== toastId)
}

export function useToast() {
  return {
    toasts: computed(() => toasts.value),
    toast: addToast,
    dismiss: dismissToast,
  }
}

export function toast(props: Omit<Toast, 'id'>) {
  return addToast(props)
}
