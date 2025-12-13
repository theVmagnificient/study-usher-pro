import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { mockAuditLog, mockStudies } from "@/data/mockData";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";

export function AuditLogPage() {
  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle="Complete history of all study status changes"
      />

      <div className="clinical-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Study ID</th>
              <th>Action</th>
              <th>Status Change</th>
              <th>User</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {mockAuditLog.map((entry) => (
              <tr key={entry.id}>
                <td className="text-sm text-muted-foreground whitespace-nowrap">
                  {format(new Date(entry.timestamp), "MMM dd, yyyy HH:mm")}
                </td>
                <td className="font-mono text-xs font-medium">{entry.studyId}</td>
                <td className="text-sm">{entry.action}</td>
                <td>
                  {entry.previousStatus && entry.newStatus && (
                    <div className="flex items-center gap-2">
                      <StatusBadge status={entry.previousStatus} />
                      <span className="text-muted-foreground">→</span>
                      <StatusBadge status={entry.newStatus} />
                    </div>
                  )}
                </td>
                <td className="text-sm">{entry.user}</td>
                <td>
                  {entry.comment && (
                    <div className="flex items-start gap-2 max-w-xs">
                      <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground line-clamp-2">{entry.comment}</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
