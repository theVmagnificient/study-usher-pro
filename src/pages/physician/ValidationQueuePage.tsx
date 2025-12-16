import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { DeadlineTimer } from "@/components/ui/DeadlineTimer";
import { LinkedBodyAreasDisplay } from "@/components/ui/LinkedStudiesBadge";
import { mockStudies } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { FileCheck, User, AlertTriangle, Clock, CheckCircle, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { differenceInHours, format } from "date-fns";

export function ValidationQueuePage() {
  const navigate = useNavigate();

  // Studies pending validation
  const pendingValidation = mockStudies.filter(s => 
    ['draft-ready'].includes(s.status)
  ).sort((a, b) => 
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  // Studies currently being validated (in progress)
  const inProgressValidation = mockStudies.filter(s => 
    ['under-validation'].includes(s.status)
  ).sort((a, b) => 
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  // Completed validations
  const completedValidation = mockStudies.filter(s => 
    ['finalized', 'delivered'].includes(s.status)
  ).sort((a, b) => 
    new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
  );

  const allValidationStudies = [...pendingValidation, ...inProgressValidation];

  // Split into urgent and retrospective
  const now = new Date();
  
  const isUrgent = (s: typeof mockStudies[0]) => {
    const hoursUntilDeadline = differenceInHours(new Date(s.deadline), now);
    return hoursUntilDeadline < 1 || s.urgency === 'stat';
  };

  // Urgent queue breakdown
  const urgentPending = pendingValidation.filter(isUrgent);
  const urgentInProgress = inProgressValidation.filter(isUrgent);
  const urgentCompleted = completedValidation.filter(isUrgent);

  // Retrospective queue breakdown
  const retroPending = pendingValidation.filter(s => !isUrgent(s));
  const retroInProgress = inProgressValidation.filter(s => !isUrgent(s));
  const retroCompleted = completedValidation.filter(s => !isUrgent(s));

  const handleStudyClick = (studyId: string) => {
    navigate(`/report/${studyId}`);
  };

  const StudyItem = ({ study, showDeadline = true }: { study: typeof mockStudies[0]; showDeadline?: boolean }) => (
    <div
      onClick={() => handleStudyClick(study.id)}
      className={cn(
        "queue-item",
        study.urgency === 'stat' && !['finalized', 'delivered'].includes(study.status) && "queue-item-urgent"
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
        {showDeadline ? (
          <DeadlineTimer deadline={study.deadline} />
        ) : (
          <span className="text-sm text-muted-foreground">
            {format(new Date(study.deadline), "MMM d, yyyy")}
          </span>
        )}
      </div>
    </div>
  );

  const EmptyState = ({ message, submessage }: { message: string; submessage: string }) => (
    <div className="clinical-card p-8 text-center">
      <FileCheck className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground">{submessage}</p>
    </div>
  );

  const QueueSection = ({ 
    title, 
    icon: Icon, 
    studies, 
    emptyMessage, 
    showDeadline = true,
    accentColor = "muted"
  }: { 
    title: string; 
    icon: React.ElementType;
    studies: typeof mockStudies; 
    emptyMessage: string;
    showDeadline?: boolean;
    accentColor?: "muted" | "primary" | "success";
  }) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn(
          "w-4 h-4",
          accentColor === "primary" && "text-primary",
          accentColor === "success" && "text-status-finalized",
          accentColor === "muted" && "text-muted-foreground"
        )} />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">({studies.length})</span>
      </div>
      {studies.length > 0 ? (
        <div className="space-y-2">
          {studies.map((study) => (
            <StudyItem key={study.id} study={study} showDeadline={showDeadline} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic pl-6">{emptyMessage}</p>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Validation Queue"
        subtitle={`${allValidationStudies.length} studies awaiting validation`}
      />

      <Tabs defaultValue="urgent" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="urgent" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Urgent Queue
            {(urgentPending.length + urgentInProgress.length) > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                {urgentPending.length + urgentInProgress.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="retrospective" className="gap-2">
            <Clock className="w-4 h-4" />
            Retrospective Queue
            {(retroPending.length + retroInProgress.length) > 0 && (
              <span className="ml-1 bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
                {retroPending.length + retroInProgress.length}
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
          
          <QueueSection
            title="In Progress"
            icon={Loader2}
            studies={urgentInProgress}
            emptyMessage="No urgent validations in progress"
            accentColor="primary"
          />
          
          <QueueSection
            title="To Validate"
            icon={FileCheck}
            studies={urgentPending}
            emptyMessage="No urgent studies pending validation"
            accentColor="muted"
          />
          
          <QueueSection
            title="Completed"
            icon={CheckCircle}
            studies={urgentCompleted}
            emptyMessage="No urgent validations completed yet"
            showDeadline={false}
            accentColor="success"
          />
        </TabsContent>

        <TabsContent value="retrospective">
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-primary font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Focus on detailed analysis and accuracy — take time to ensure thorough review
            </p>
          </div>
          
          <QueueSection
            title="In Progress"
            icon={Loader2}
            studies={retroInProgress}
            emptyMessage="No retrospective validations in progress"
            accentColor="primary"
          />
          
          <QueueSection
            title="To Validate"
            icon={FileCheck}
            studies={retroPending}
            emptyMessage="No retrospective studies pending validation"
            accentColor="muted"
          />
          
          <QueueSection
            title="Completed"
            icon={CheckCircle}
            studies={retroCompleted}
            emptyMessage="No retrospective validations completed yet"
            showDeadline={false}
            accentColor="success"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
