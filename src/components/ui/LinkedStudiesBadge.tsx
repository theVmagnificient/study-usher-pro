import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Study, BodyArea } from "@/types/study";

interface LinkedStudiesBadgeProps {
  study: Study;
  allStudies: Study[];
  className?: string;
}

export function LinkedStudiesBadge({ study, allStudies, className }: LinkedStudiesBadgeProps) {
  if (!study.linkedStudyGroup) return null;
  
  const linkedStudies = allStudies.filter(
    s => s.linkedStudyGroup === study.linkedStudyGroup && s.id !== study.id
  );
  
  if (linkedStudies.length === 0) return null;
  
  const allBodyAreas = [study.bodyArea, ...linkedStudies.map(s => s.bodyArea)];
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
      "bg-primary/10 text-primary border border-primary/20",
      className
    )}>
      <Link2 className="w-3 h-3" />
      <span>{allBodyAreas.length} zones</span>
    </div>
  );
}

interface LinkedBodyAreasDisplayProps {
  study: Study;
  allStudies: Study[];
  showBadge?: boolean;
}

export function LinkedBodyAreasDisplay({ study, allStudies, showBadge = true }: LinkedBodyAreasDisplayProps) {
  const linkedStudies = study.linkedStudyGroup 
    ? allStudies.filter(s => s.linkedStudyGroup === study.linkedStudyGroup && s.id !== study.id)
    : [];
  
  const isMultiZone = linkedStudies.length > 0;
  const otherBodyAreas = linkedStudies.map(s => s.bodyArea);
  
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{study.modality}</span>
        <span className="text-sm font-semibold text-foreground">{study.bodyArea}</span>
      </div>
      {isMultiZone && (
        <div className="text-xs text-primary font-medium flex items-center gap-1">
          <Link2 className="w-3 h-3" />
          <span>+ {otherBodyAreas.join(", ")}</span>
        </div>
      )}
    </div>
  );
}

export function getLinkedStudies(study: Study, allStudies: Study[]): Study[] {
  if (!study.linkedStudyGroup) return [];
  return allStudies.filter(
    s => s.linkedStudyGroup === study.linkedStudyGroup && s.id !== study.id
  );
}
