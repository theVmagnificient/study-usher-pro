import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  deadline: string
  className?: string
}

function computeDisplay(deadline: string) {
  const now = Date.now()
  const deadlineMs = new Date(deadline).getTime()
  const diffMs = deadlineMs - now
  const isOverdue = diffMs < 0
  const absDiffMs = Math.abs(diffMs)
  const diffHours = Math.floor(absDiffMs / (1000 * 60 * 60))
  const diffMins = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60))
  const isCritical = !isOverdue && diffHours < 1
  const isWarning = !isOverdue && diffHours >= 1 && diffHours < 4

  let text: string
  if (isOverdue) {
    text = diffHours > 0 ? `-${diffHours}h ${diffMins}m` : `-${diffMins}m`
  } else if (diffHours < 1) {
    text = `${diffMins}m`
  } else if (diffHours < 24) {
    text = `${diffHours}h ${diffMins}m`
  } else {
    const days = Math.floor(diffHours / 24)
    const remainingHours = diffHours % 24
    text = `${days}d ${remainingHours}h`
  }
  return { text, isOverdue, isCritical, isWarning }
}

export function DeadlineTimer({ deadline, className }: Props) {
  const [display, setDisplay] = useState(() => computeDisplay(deadline))

  useEffect(() => {
    const id = setInterval(() => setDisplay(computeDisplay(deadline)), 60000)
    return () => clearInterval(id)
  }, [deadline])

  return (
    <div className={cn(
      'flex items-center gap-1.5 text-sm',
      display.isOverdue && 'deadline-critical',
      display.isCritical && 'deadline-critical',
      display.isWarning && 'deadline-warning',
      !display.isOverdue && !display.isCritical && !display.isWarning && 'deadline-normal',
      className
    )}>
      <Clock className="w-3.5 h-3.5" />
      <span>{display.text}</span>
    </div>
  )
}
