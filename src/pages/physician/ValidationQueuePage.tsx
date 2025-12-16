import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { DeadlineTimer } from "@/components/ui/DeadlineTimer";
import { LinkedBodyAreasDisplay } from "@/components/ui/LinkedStudiesBadge";
import { mockStudies } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { FileCheck, User, AlertTriangle, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { differenceInHours } from "date-fns";

export function ValidationQueuePage() {
  const navigate = useNavigate();

  // Filter studies that would be in validation queue
  const validationStudies = mockStudies.filter(s => 
    ['draft-ready', 'under-validation'].includes(s.status)
  ).sort((a, b) => 
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  // Split into urgent (deadline within 1 hour) and retrospective queues
  const now = new Date();
  const urgentStudies = validationStudies.filter(s => {
    const hoursUntilDeadline = differenceInHours(new Date(s.deadline), now);
    return hoursUntilDeadline < 1 || s.urgency === 'stat';
  });
  
  const retrospectiveStudies = validationStudies.filter(s => {
    const hoursUntilDeadline = differenceInHours(new Date(s.deadline), now);
    return hoursUntilDeadline >= 1 && s.urgency !== 'stat';
  });

  const handleStudyClick = (studyId: string) => {
    navigate(`/report/${studyId}`);
  };

  const StudyItem = ({ study }: { study: typeof mockStudies[0] }) => (
    <div
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
  );

  const EmptyState = ({ message, submessage }: { message: string; submessage: string }) => (
    <div className="clinical-card p-12 text-center">
      <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
      <p className="text-lg font-medium text-foreground">{message}</p>
      <p className="text-sm text-muted-foreground">{submessage}</p>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Validation Queue"
        subtitle={`${validationStudies.length} studies awaiting validation`}
      />

      <Tabs defaultValue="urgent" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="urgent" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Urgent Queue
            {urgentStudies.length > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                {urgentStudies.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="retrospective" className="gap-2">
            <Clock className="w-4 h-4" />
            Retrospective Queue
            {retrospectiveStudies.length > 0 && (
              <span className="ml-1 bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
                {retrospectiveStudies.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="urgent">
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Studies requiring review within 1 hour — prioritize speed while maintaining accuracy
            </p>
          </div>
          <div className="space-y-3">
            {urgentStudies.map((study) => (
              <StudyItem key={study.id} study={study} />
            ))}
            {urgentStudies.length === 0 && (
              <EmptyState 
                message="No urgent studies" 
                submessage="All studies have sufficient time for review" 
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="retrospective">
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-primary font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Focus on detailed analysis and accuracy — take time to ensure thorough review
            </p>
          </div>
          <div className="space-y-3">
            {retrospectiveStudies.map((study) => (
              <StudyItem key={study.id} study={study} />
            ))}
            {retrospectiveStudies.length === 0 && (
              <EmptyState 
                message="No retrospective studies" 
                submessage="Studies with flexible deadlines will appear here" 
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
