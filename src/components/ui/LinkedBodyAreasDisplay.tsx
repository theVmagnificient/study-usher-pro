import { Link2 } from 'lucide-react'
import type { Study } from '@/types/study'

interface Props {
  study: Study
  allStudies: Study[]
}

export function LinkedBodyAreasDisplay({ study, allStudies }: Props) {
  const linkedStudies = study.linkedStudyGroup
    ? allStudies.filter(s => s.linkedStudyGroup === study.linkedStudyGroup && s.id !== study.id)
    : []

  const isMultiZone = linkedStudies.length > 0
  const otherBodyAreas = linkedStudies.map(s => s.bodyArea)

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{study.modality}</span>
        <span className="text-sm font-semibold text-foreground">{study.bodyArea}</span>
      </div>
      {isMultiZone && (
        <div className="text-xs text-primary font-medium flex items-center gap-1">
          <Link2 className="w-3 h-3" />
          <span>+ {otherBodyAreas.join(', ')}</span>
        </div>
      )}
    </div>
  )
}
