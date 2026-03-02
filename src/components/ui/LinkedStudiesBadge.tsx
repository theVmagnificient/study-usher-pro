import { Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Study } from '@/types/study'

interface Props {
  study: Study
  allStudies: Study[]
  className?: string
}

export function LinkedStudiesBadge({ study, allStudies, className }: Props) {
  const linkedStudies = study.linkedStudyGroup
    ? allStudies.filter(s => s.linkedStudyGroup === study.linkedStudyGroup && s.id !== study.id)
    : []

  if (linkedStudies.length === 0) return null

  const allBodyAreas = [study.bodyArea, ...linkedStudies.map(s => s.bodyArea)]

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
      'bg-primary/10 text-primary border border-primary/20',
      className
    )}>
      <Link2 className="w-3 h-3" />
      <span>{allBodyAreas.length} zones</span>
    </div>
  )
}
