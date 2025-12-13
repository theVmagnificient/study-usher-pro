import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, UserPlus, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { DeadlineTimer } from "@/components/ui/DeadlineTimer";
import { mockStudies, mockPriorStudies, mockAuditLog } from "@/data/mockData";
import { format } from "date-fns";

export function StudyDetailPage() {
  const { studyId } = useParams();
  const navigate = useNavigate();

  const study = mockStudies.find(s => s.id === studyId) || mockStudies[0];
  const studyAuditLog = mockAuditLog.filter(l => l.studyId === study.id);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{study.id}</h1>
            <StatusBadge status={study.status} />
            <UrgencyBadge urgency={study.urgency} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {study.clientName} • {study.modality} {study.bodyArea}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DeadlineTimer deadline={study.deadline} />
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            DICOM
          </Button>
          <Button variant="outline">
            <UserPlus className="w-4 h-4 mr-2" />
            Reassign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="col-span-2 space-y-6">
          {/* Patient & Study Info */}
          <div className="clinical-card">
            <div className="clinical-card-header">
              <h3 className="text-sm font-semibold">Study Information</h3>
            </div>
            <div className="clinical-card-body">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="section-header">Patient ID</label>
                  <p className="text-sm font-mono">{study.patientId}</p>
                </div>
                <div>
                  <label className="section-header">Sex / Age</label>
                  <p className="text-sm">{study.sex} / {study.age} years</p>
                </div>
                <div>
                  <label className="section-header">Received</label>
                  <p className="text-sm">{format(new Date(study.receivedAt), "MMM dd, yyyy HH:mm")}</p>
                </div>
                <div>
                  <label className="section-header">Modality</label>
                  <p className="text-sm">{study.modality}</p>
                </div>
                <div>
                  <label className="section-header">Body Area</label>
                  <p className="text-sm">{study.bodyArea}</p>
                </div>
                <div>
                  <label className="section-header">Assigned To</label>
                  <p className="text-sm">{study.assignedPhysician || 'Unassigned'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Report */}
          <div className="clinical-card">
            <div className="clinical-card-header">
              <h3 className="text-sm font-semibold">Current Report</h3>
            </div>
            <div className="clinical-card-body space-y-4">
              <div>
                <label className="section-header">Protocol</label>
                <p className="text-sm text-muted-foreground">
                  Non-contrast CT of the chest was performed using standard departmental protocol.
                </p>
              </div>
              <div>
                <label className="section-header">Findings</label>
                <p className="text-sm text-muted-foreground italic">No findings documented yet</p>
              </div>
              <div>
                <label className="section-header">Impression</label>
                <p className="text-sm text-muted-foreground italic">No impression documented yet</p>
              </div>
            </div>
          </div>

          {/* Prior Studies */}
          {study.hasPriors && (
            <div className="clinical-card">
              <div className="clinical-card-header">
                <h3 className="text-sm font-semibold">Prior Studies</h3>
                <span className="text-xs text-muted-foreground">{study.priorCount} available</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {mockPriorStudies.map((prior) => (
                    <tr key={prior.id}>
                      <td className="text-sm font-medium">{prior.type}</td>
                      <td className="text-sm text-muted-foreground">{prior.date}</td>
                      <td>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          DICOM
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Audit History */}
        <div className="col-span-1">
          <div className="clinical-card">
            <div className="clinical-card-header">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <History className="w-4 h-4" />
                History
              </h3>
            </div>
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto scrollbar-thin">
              {studyAuditLog.length > 0 ? studyAuditLog.map((entry) => (
                <div key={entry.id} className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{entry.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(entry.timestamp), "HH:mm")}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{entry.user}</p>
                  {entry.previousStatus && entry.newStatus && (
                    <div className="flex items-center gap-1 mt-2">
                      <StatusBadge status={entry.previousStatus} />
                      <span className="text-muted-foreground text-xs">→</span>
                      <StatusBadge status={entry.newStatus} />
                    </div>
                  )}
                  {entry.comment && (
                    <p className="text-xs text-muted-foreground mt-2 italic">"{entry.comment}"</p>
                  )}
                </div>
              )) : (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No history available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
