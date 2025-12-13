import { cn } from "@/lib/utils";
import { AlertTriangle, Zap, Clock } from "lucide-react";
import type { Urgency } from "@/types/study";

interface UrgencyBadgeProps {
  urgency: Urgency;
  className?: string;
}

const urgencyConfig: Record<Urgency, { label: string; className: string; Icon: typeof AlertTriangle }> = {
  'stat': { label: 'STAT', className: 'urgency-stat', Icon: Zap },
  'urgent': { label: 'Urgent', className: 'urgency-urgent', Icon: AlertTriangle },
  'routine': { label: 'Routine', className: 'urgency-routine', Icon: Clock },
};

export function UrgencyBadge({ urgency, className }: UrgencyBadgeProps) {
  const config = urgencyConfig[urgency];
  const Icon = config.Icon;
  
  return (
    <span className={cn("status-badge", config.className, className)}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
}
