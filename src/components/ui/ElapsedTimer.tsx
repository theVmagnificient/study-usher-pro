import { useState, useEffect } from 'react'
import { Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  startTime: string
  endTime?: string
  className?: string
}

function formatElapsed(startTime: string, endTime?: string): string {
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : Date.now()
  const elapsedMs = Math.max(0, end - start)
  const totalMinutes = Math.floor(elapsedMs / (1000 * 60))
  const totalHours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  if (totalHours < 1) return `${mins}m`
  if (totalHours < 24) return `${totalHours}h ${mins}m`
  const days = Math.floor(totalHours / 24)
  return `${days}d ${totalHours % 24}h`
}

export function ElapsedTimer({ startTime, endTime, className }: Props) {
  const [text, setText] = useState(() => formatElapsed(startTime, endTime))

  useEffect(() => {
    if (endTime) return
    const id = setInterval(() => setText(formatElapsed(startTime, endTime)), 60000)
    return () => clearInterval(id)
  }, [startTime, endTime])

  return (
    <div className={cn('flex items-center gap-1.5 text-sm', className)}>
      <Timer className="w-3.5 h-3.5" />
      <span>{text}</span>
    </div>
  )
}
