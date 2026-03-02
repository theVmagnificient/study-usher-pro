import { useEffect, type ReactNode } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useAppStore } from '@/stores/app'
import AppSidebar from './AppSidebar'

interface Props {
  children: ReactNode
}

export default function AppLayout({ children }: Props) {
  const appStore = useAppStore()
  const isDark = appStore.isDark()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault()
        appStore.toggleTheme()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-end px-6 flex-shrink-0">
          <button
            onClick={() => appStore.toggleTheme()}
            className="p-2 rounded hover:bg-accent transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
