import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { DeadlineTimer } from "@/components/ui/DeadlineTimer";
import { LinkedBodyAreasDisplay } from "@/components/ui/LinkedStudiesBadge";
import { mockStudies } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { FileCheck, User } from "lucide-react";

export function ValidationQueuePage() {
  const navigate = useNavigate();

  // Filter studies that would be in validation queue
  const validationStudies = mockStudies.filter(s => 
    ['draft-ready', 'under-validation'].includes(s.status)
  ).sort((a, b) => 
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  const handleStudyClick = (studyId: string) => {
    navigate(`/report/${studyId}`);
  };

  return (
    <div>
      <PageHeader
        title="Validation Queue"
        subtitle={`${validationStudies.length} studies awaiting validation`}
      />

      {/* Queue Items */}
      <div className="space-y-3">
        {validationStudies.map((study) => (
          <div
            key={study.id}
            onClick={() => handleStudyClick(study.id)}
            className={cn(
              "queue-item",
              study.urgency === 'stat' && "queue-item-urgent"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-medium">{study.id}</span>
                  <StatusBadge status={study.status} />
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <LinkedBodyAreasDisplay study={study} allStudies={mockStudies} />
                  <span>• {study.patientId} ({study.sex}/{study.age}y)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                {study.assignedPhysician}
              </div>
              <UrgencyBadge urgency={study.urgency} />
              <DeadlineTimer deadline={study.deadline} />
            </div>
          </div>
        ))}

        {validationStudies.length === 0 && (
          <div className="clinical-card p-12 text-center">
            <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium text-foreground">No studies pending validation</p>
            <p className="text-sm text-muted-foreground">Studies submitted for review will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
