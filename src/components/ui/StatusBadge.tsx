import { cn } from "@/lib/utils";
import type { StudyStatus } from "@/types/study";

interface StatusBadgeProps {
  status: StudyStatus;
  className?: string;
}

const statusConfig: Record<StudyStatus, { label: string; className: string }> = {
  'new': { label: 'New', className: 'status-new' },
  'assigned': { label: 'Assigned', className: 'status-assigned' },
  'in-progress': { label: 'In Progress', className: 'status-in-progress' },
  'draft-ready': { label: 'Draft Ready', className: 'status-draft-ready' },
  'under-validation': { label: 'Under Validation', className: 'status-under-validation' },
  'returned': { label: 'Returned', className: 'status-returned' },
  'finalized': { label: 'Finalized', className: 'status-finalized' },
  'delivered': { label: 'Delivered', className: 'status-delivered' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn("status-badge", config.className, className)}>
      {config.label}
    </span>
  );
}
