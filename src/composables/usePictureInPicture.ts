import { ref, inject, onBeforeUnmount, createApp, type Component } from 'vue'
import { useRouter, type Router } from 'vue-router'
import { getActivePinia, type Pinia } from 'pinia'
import { useI18n, type I18n } from 'vue-i18n'
import { useToast } from '@/hooks/use-toast'
import { i18n } from '@/i18n'

interface DocumentPictureInPictureAPI {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>
  window: Window | null
}

const PIP_WINDOW_SIZE = { width: 640, height: 720 } as const

interface UsePictureInPictureOptions {
  canOpen: () => boolean
  getWindowTitle: () => string
  loadShell: () => Promise<Component>
}

export function usePictureInPicture(options: UsePictureInPictureOptions) {
  const router = useRouter()
  const pinia = getActivePinia()
  const { t } = useI18n()
  const { toast } = useToast()
  const pipMode = inject<boolean>('pipMode', false)

  const pipSupported = ref(
    !pipMode && typeof window !== 'undefined' && 'documentPictureInPicture' in window,
  )
  const isPipOpen = ref(false)
  const isOpeningPip = ref(false)

  function getDocumentPictureInPicture(): DocumentPictureInPictureAPI | null {
    if (typeof window === 'undefined') return null
    return (window as Window & { documentPictureInPicture?: DocumentPictureInPictureAPI }).documentPictureInPicture ?? null
  }

  function getPipWindow(): Window | null {
    const api = getDocumentPictureInPicture()
    return api?.window ?? null
  }

  function closePip(): void {
    const w = getPipWindow()
    if (w) w.close()
  }

  function copyStylesToPipWindow(pipWindow: Window): void {
    try {
      ;[...document.styleSheets].forEach((styleSheet) => {
        try {
          const rules = [...styleSheet.cssRules].map((r) => r.cssText).join('')
          const style = document.createElement('style')
          style.textContent = rules
          pipWindow.document.head.appendChild(style)
        } catch {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.type = styleSheet.type
          link.media = 'all'
          link.href = (styleSheet as CSSStyleSheet).href || ''
          pipWindow.document.head.appendChild(link)
        }
      })
    } catch {
      const style = pipWindow.document.createElement('style')
      style.textContent = 'body{font-family:system-ui,sans-serif;margin:0;background:var(--background,#fff);color:var(--foreground,#111)}'
      pipWindow.document.head.appendChild(style)
    }
  }

  function showPipError(): void {
    toast({ title: t('reporting.pipFailed'), description: t('reporting.pipErrorDescription'), variant: 'destructive' })
  }

  async function openPipAndMountApp(router: Router, pinia: Pinia, i18n: I18n): Promise<void> {
    const api = getDocumentPictureInPicture()
    if (!api) return

    // Must start in same tick as user gesture (transient activation)
    const pipWindowPromise = api.requestWindow(PIP_WINDOW_SIZE)
    const ShellComponent = await options.loadShell()

    const pipWindow = await pipWindowPromise
    isPipOpen.value = true
    pipWindow.document.title = `${options.getWindowTitle()} — PiP`

    copyStylesToPipWindow(pipWindow)
    const root = pipWindow.document.createElement('div')
    root.id = 'pip-app'
    pipWindow.document.body.appendChild(root)

    const pipApp = createApp(ShellComponent)
    pipApp.use(pinia)
    pipApp.use(router)
    pipApp.use(i18n)
    pipApp.mount(root)

    pipWindow.addEventListener('pagehide', () => {
      pipApp.unmount()
      isPipOpen.value = false
    })
  }

  async function togglePictureInPicture(): Promise<void> {
    if (!options.canOpen() || isOpeningPip.value) return

    const api = getDocumentPictureInPicture()
    if (!api) {
      showPipError()
      return
    }

    const existing = getPipWindow()
    if (existing) {
      existing.close()
      isPipOpen.value = false
      return
    }

    isOpeningPip.value = true
    try {
      // Pass app instances from component context; useRouter() must not be called after await
      await openPipAndMountApp(router, pinia, i18n)
    } catch {
      isPipOpen.value = false
      showPipError()
    } finally {
      isOpeningPip.value = false
    }
  }

  function closePipIfOpen(): void {
    if (pipMode) return
    const w = getPipWindow()
    if (w) {
      w.close()
      isPipOpen.value = false
    }
  }

  onBeforeUnmount(() => {
    closePipIfOpen()
  })

  return {
    pipSupported,
    isPipOpen,
    isOpeningPip,
    togglePictureInPicture,
    closePipIfOpen,
    closePip,
    pipMode,
  }
}
