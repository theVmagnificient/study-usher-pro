import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { DeadlineTimer } from "@/components/ui/DeadlineTimer";
import { mockStudies } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { FileText, AlertCircle } from "lucide-react";

export function PhysicianQueuePage() {
  const navigate = useNavigate();

  // Filter studies that would be in physician's queue
  const queueStudies = mockStudies.filter(s => 
    ['assigned', 'in-progress', 'returned'].includes(s.status)
  ).sort((a, b) => 
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  const activeCount = queueStudies.filter(s => s.status === 'in-progress').length;
  const maxActive = 2;

  const handleStudyClick = (studyId: string) => {
    navigate(`/report/${studyId}`);
  };

  return (
    <div>
      <PageHeader
        title="My Queue"
        subtitle={`${queueStudies.length} studies pending`}
      />

      {/* Workload Warning */}
      {activeCount >= maxActive && (
        <div className="clinical-card p-4 mb-6 border-l-4 border-l-urgency-urgent bg-orange-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-urgency-urgent" />
            <div>
              <p className="text-sm font-medium">Maximum workload reached</p>
              <p className="text-xs text-muted-foreground">Complete a study before starting a new one</p>
            </div>
          </div>
        </div>
      )}

      {/* Queue Items */}
      <div className="space-y-3">
        {queueStudies.map((study) => (
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
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-medium">{study.id}</span>
                  <StatusBadge status={study.status} />
                </div>
                <div className="text-sm text-muted-foreground">
                  {study.modality} {study.bodyArea} • {study.patientId} ({study.sex}/{study.age}y)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <UrgencyBadge urgency={study.urgency} />
              <DeadlineTimer deadline={study.deadline} />
              {study.hasPriors && (
                <span className="status-badge status-assigned">
                  {study.priorCount} prior{study.priorCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        ))}

        {queueStudies.length === 0 && (
          <div className="clinical-card p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium text-foreground">No studies in queue</p>
            <p className="text-sm text-muted-foreground">New studies will appear here when assigned</p>
          </div>
        )}
      </div>
    </div>
  );
}
