import type { Study } from '@/types/study'

export function getLinkedStudies(study: Study, allStudies: Study[]): Study[] {
  if (!study.linkedStudyGroup) return []
  return allStudies.filter(
    s => s.linkedStudyGroup === study.linkedStudyGroup && s.id !== study.id
  )
}

