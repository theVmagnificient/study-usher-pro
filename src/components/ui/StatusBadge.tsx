import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { StudyStatus } from '@/types/study'

const statusMap: Record<string, { key: string; className: string }> = {
  'new': { key: 'status.new', className: 'status-new' },
  'assigned': { key: 'status.assigned', className: 'status-assigned' },
  'in-progress': { key: 'status.inProgress', className: 'status-in-progress' },
  'in_progress': { key: 'status.inProgress', className: 'status-in-progress' },
  'draft-saved': { key: 'status.draftSaved', className: 'status-in-progress' },
  'draft_saved': { key: 'status.draftSaved', className: 'status-in-progress' },
  'draft-ready': { key: 'status.draftReady', className: 'status-draft-ready' },
  'draft_ready': { key: 'status.draftReady', className: 'status-draft-ready' },
  'under-validation': { key: 'status.underValidation', className: 'status-under-validation' },
  'under_validation': { key: 'status.underValidation', className: 'status-under-validation' },
  'returned': { key: 'status.returned', className: 'status-returned' },
  'returned_for_revision': { key: 'status.returned', className: 'status-returned' },
  'returned-for-revision': { key: 'status.returned', className: 'status-returned' },
  'assigned_for_validation': { key: 'status.assignedForValidation', className: 'status-under-validation' },
  'assigned-for-validation': { key: 'status.assignedForValidation', className: 'status-under-validation' },
  'translated': { key: 'status.translated', className: 'status-draft-ready' },
  'finalized': { key: 'status.finalized', className: 'status-finalized' },
  'delivered': { key: 'status.delivered', className: 'status-delivered' },
}

interface Props {
  status: StudyStatus | string
  className?: string
}

export function StatusBadge({ status, className }: Props) {
  const { t } = useTranslation()
  const mapping = statusMap[status]
  const label = mapping ? t(mapping.key) : status
  const cls = mapping ? mapping.className : 'status-assigned'
  return <span className={cn('status-badge', cls, className)}>{label}</span>
}
