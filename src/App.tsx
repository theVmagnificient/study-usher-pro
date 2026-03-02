import { Toaster } from 'sonner'
import { RouterProvider } from 'react-router-dom'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { router } from '@/router'

export default function App() {
  return (
    <TooltipProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </TooltipProvider>
  )
}
