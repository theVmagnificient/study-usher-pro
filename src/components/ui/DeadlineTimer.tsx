import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface DeadlineTimerProps {
  deadline: string;
  className?: string;
}

export function DeadlineTimer({ deadline, className }: DeadlineTimerProps) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  const isOverdue = diffMs < 0;
  const isCritical = diffHours < 1 && !isOverdue;
  const isWarning = diffHours < 4 && !isCritical && !isOverdue;
  
  let displayText: string;
  if (isOverdue) {
    const overHours = Math.abs(diffHours);
    const overMins = Math.abs(diffMins);
    displayText = overHours > 0 ? `-${overHours}h ${overMins}m` : `-${overMins}m`;
  } else if (diffHours < 1) {
    displayText = `${diffMins}m`;
  } else if (diffHours < 24) {
    displayText = `${diffHours}h ${diffMins}m`;
  } else {
    const days = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    displayText = `${days}d ${remainingHours}h`;
  }
  
  return (
    <div className={cn(
      "flex items-center gap-1.5 text-sm",
      isOverdue && "deadline-critical",
      isCritical && "deadline-critical",
      isWarning && "deadline-warning",
      !isOverdue && !isCritical && !isWarning && "deadline-normal",
      className
    )}>
      <Clock className="w-3.5 h-3.5" />
      <span>{displayText}</span>
    </div>
  );
}
