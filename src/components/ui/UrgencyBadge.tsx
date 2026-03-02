import { useTranslation } from 'react-i18next'
import { AlertTriangle, Zap, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Urgency } from '@/types/study'

const urgencyMap: Record<Urgency, { key: string; className: string; Icon: React.ComponentType<{ className?: string }> }> = {
  stat: { key: 'urgency.stat', className: 'urgency-stat', Icon: Zap },
  urgent: { key: 'urgency.urgent', className: 'urgency-urgent', Icon: AlertTriangle },
  routine: { key: 'urgency.routine', className: 'urgency-routine', Icon: Clock },
}

interface Props {
  urgency: Urgency
  className?: string
}

export function UrgencyBadge({ urgency, className }: Props) {
  const { t } = useTranslation()
  const { key, className: cls, Icon } = urgencyMap[urgency]
  return (
    <span className={cn('status-badge', cls, className)}>
      <Icon className="w-3 h-3 mr-1" />
      {t(key)}
    </span>
  )
}
