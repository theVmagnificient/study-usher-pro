import { MemoryRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import ReportingPage from './ReportingPage'

export default function PipShell() {
  return (
    <MemoryRouter>
      <TooltipProvider>
        <Toaster richColors position="top-right" />
        <div className="pip-shell min-h-full bg-background">
          <ReportingPage pipMode />
        </div>
      </TooltipProvider>
    </MemoryRouter>
  )
}
