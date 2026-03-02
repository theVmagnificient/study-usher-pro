import { useState, useEffect, useCallback, ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from '@/hooks/use-toast'
import i18n from '@/i18n'

interface DocumentPictureInPictureAPI {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>
  window: Window | null
}

const PIP_WINDOW_SIZE = { width: 640, height: 720 } as const

interface UsePictureInPictureOptions {
  canOpen: () => boolean
  getWindowTitle: () => string
  loadShell: () => Promise<ComponentType>
}

function getDocumentPictureInPicture(): DocumentPictureInPictureAPI | null {
  if (typeof window === 'undefined') return null
  return (window as any).documentPictureInPicture ?? null
}

function getPipWindow(): Window | null {
  return getDocumentPictureInPicture()?.window ?? null
}

function copyStylesToPipWindow(pipWindow: Window): void {
  try {
    ;[...document.styleSheets].forEach(styleSheet => {
      try {
        const rules = [...styleSheet.cssRules].map(r => r.cssText).join('')
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

export function usePictureInPicture(options: UsePictureInPictureOptions, isPipMode = false) {
  const [pipSupported] = useState(
    !isPipMode && typeof window !== 'undefined' && 'documentPictureInPicture' in window
  )
  const [isPipOpen, setIsPipOpen] = useState(false)
  const [isOpeningPip, setIsOpeningPip] = useState(false)

  const closePip = useCallback(() => {
    getPipWindow()?.close()
  }, [])

  const closePipIfOpen = useCallback(() => {
    if (isPipMode) return
    const w = getPipWindow()
    if (w) { w.close(); setIsPipOpen(false) }
  }, [isPipMode])

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (!isPipMode) closePipIfOpen() }
  }, [closePipIfOpen, isPipMode])

  const togglePictureInPicture = useCallback(async () => {
    if (!options.canOpen() || isOpeningPip) return

    const api = getDocumentPictureInPicture()
    if (!api) {
      toast({ title: i18n.t('reporting.pipFailed'), description: i18n.t('reporting.pipErrorDescription'), variant: 'destructive' })
      return
    }

    const existing = getPipWindow()
    if (existing) {
      existing.close()
      setIsPipOpen(false)
      return
    }

    setIsOpeningPip(true)
    try {
      // Must start in same tick as user gesture
      const pipWindowPromise = api.requestWindow(PIP_WINDOW_SIZE)
      const ShellComponent = await options.loadShell()
      const pipWindow = await pipWindowPromise

      setIsPipOpen(true)
      pipWindow.document.title = `${options.getWindowTitle()} — PiP`
      copyStylesToPipWindow(pipWindow)

      const root = pipWindow.document.createElement('div')
      root.id = 'pip-app'
      pipWindow.document.body.appendChild(root)

      // Mount React app inside PiP window
      const pipRoot = createRoot(root)
      pipRoot.render(<ShellComponent />)

      pipWindow.addEventListener('pagehide', () => {
        pipRoot.unmount()
        setIsPipOpen(false)
      })
    } catch {
      setIsPipOpen(false)
      toast({ title: i18n.t('reporting.pipFailed'), description: i18n.t('reporting.pipErrorDescription'), variant: 'destructive' })
    } finally {
      setIsOpeningPip(false)
    }
  }, [options, isOpeningPip])

  return { pipSupported, isPipOpen, isOpeningPip, togglePictureInPicture, closePipIfOpen, closePip, pipMode: isPipMode }
}
