import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { DeadlineTimer } from "@/components/ui/DeadlineTimer";
import { LinkedBodyAreasDisplay } from "@/components/ui/LinkedStudiesBadge";
import { mockStudies } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { FileText, AlertCircle, CheckCircle, Clock, MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export function PhysicianQueuePage() {
  const navigate = useNavigate();

  // Studies to be reported (pending)
  const pendingStudies = mockStudies.filter(s => 
    ['assigned', 'in-progress', 'returned'].includes(s.status)
  ).sort((a, b) => 
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  // Completed studies (finalized/delivered)
  const completedStudies = mockStudies.filter(s => 
    ['finalized', 'delivered'].includes(s.status)
  ).sort((a, b) => 
    new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
  );

  // Studies with validator comments
  const commentedStudies = mockStudies.filter(s => 
    s.validatorComment && ['finalized', 'delivered'].includes(s.status)
  ).sort((a, b) => 
    new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
  );

  const activeCount = pendingStudies.filter(s => s.status === 'in-progress').length;
  const maxActive = 2;

  const handleStudyClick = (studyId: string) => {
    navigate(`/report/${studyId}`);
  };

  const StudyItem = ({ study, showDeadline = true }: { study: typeof mockStudies[0]; showDeadline?: boolean }) => (
    <div
      onClick={() => handleStudyClick(study.id)}
      className={cn(
        "queue-item",
        study.urgency === 'stat' && study.status !== 'finalized' && study.status !== 'delivered' && "queue-item-urgent"
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
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <LinkedBodyAreasDisplay study={study} allStudies={mockStudies} />
            <span>• {study.patientId} ({study.sex}/{study.age}y)</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <UrgencyBadge urgency={study.urgency} />
        {showDeadline ? (
          <DeadlineTimer deadline={study.deadline} />
        ) : (
          <span className="text-sm text-muted-foreground">
            {format(new Date(study.deadline), "MMM d, yyyy")}
          </span>
        )}
        {study.hasPriors && (
          <span className="status-badge status-assigned">
            {study.priorCount} prior{study.priorCount !== 1 ? 's' : ''}
          </span>
        )}
        {study.validatorComment && (
          <span className="flex items-center gap-1 text-amber-600">
            <MessageCircle className="w-4 h-4" />
          </span>
        )}
      </div>
    </div>
  );

  const CommentedStudyItem = ({ study }: { study: typeof mockStudies[0] }) => (
    <div
      onClick={() => handleStudyClick(study.id)}
      className="queue-item"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded bg-amber-100 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-medium">{study.id}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-status-finalized/20 text-status-finalized">
              {study.status}
            </span>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <LinkedBodyAreasDisplay study={study} allStudies={mockStudies} />
            <span>• {study.patientId}</span>
          </div>
          <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
            <p className="text-sm text-foreground line-clamp-2">{study.validatorComment}</p>
            {study.validatorName && (
              <p className="text-xs text-muted-foreground mt-1">— {study.validatorName}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-sm text-muted-foreground">
          {format(new Date(study.deadline), "MMM d, yyyy")}
        </span>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="My Queue"
        subtitle={`${pendingStudies.length} studies pending`}
      />

      {/* Workload Warning */}
      {activeCount >= maxActive && (
        <div className="clinical-card p-4 mb-6 border-l-4 border-l-[hsl(var(--urgency-urgent))] bg-[hsl(var(--urgency-urgent)/0.15)]">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[hsl(var(--urgency-urgent))]" />
            <div>
              <p className="text-sm font-medium text-foreground">Maximum workload reached</p>
              <p className="text-xs text-muted-foreground">Complete a study before starting a new one</p>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            To Report
            {pendingStudies.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                {pendingStudies.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="commented" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            Commented
            {commentedStudies.length > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {commentedStudies.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Completed
            {completedStudies.length > 0 && (
              <span className="ml-1 bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
                {completedStudies.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="space-y-3">
            {pendingStudies.map((study) => (
              <StudyItem key={study.id} study={study} showDeadline={true} />
            ))}

            {pendingStudies.length === 0 && (
              <div className="clinical-card p-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg font-medium text-foreground">No studies in queue</p>
                <p className="text-sm text-muted-foreground">New studies will appear here when assigned</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="commented">
          <div className="space-y-3">
            {commentedStudies.map((study) => (
              <CommentedStudyItem key={study.id} study={study} />
            ))}

            {commentedStudies.length === 0 && (
              <div className="clinical-card p-12 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg font-medium text-foreground">No commented studies</p>
                <p className="text-sm text-muted-foreground">Validator feedback on your reports will appear here</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-3">
            {completedStudies.map((study) => (
              <StudyItem key={study.id} study={study} showDeadline={false} />
            ))}

            {completedStudies.length === 0 && (
              <div className="clinical-card p-12 text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg font-medium text-foreground">No completed studies</p>
                <p className="text-sm text-muted-foreground">Finalized reports will appear here</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
