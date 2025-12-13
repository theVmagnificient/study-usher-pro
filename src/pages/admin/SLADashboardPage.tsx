import { PageHeader } from "@/components/layout/PageHeader";
import { mockStudies } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function SLADashboardPage() {
  // Calculate SLA metrics
  const now = new Date();
  
  const activeStudies = mockStudies.filter(s => 
    !['finalized', 'delivered'].includes(s.status)
  );
  
  const overdueStudies = activeStudies.filter(s => 
    new Date(s.deadline) < now
  );
  
  const criticalStudies = activeStudies.filter(s => {
    const deadline = new Date(s.deadline);
    const diff = deadline.getTime() - now.getTime();
    return diff > 0 && diff < 60 * 60 * 1000; // Less than 1 hour
  });

  const warningStudies = activeStudies.filter(s => {
    const deadline = new Date(s.deadline);
    const diff = deadline.getTime() - now.getTime();
    return diff >= 60 * 60 * 1000 && diff < 4 * 60 * 60 * 1000; // 1-4 hours
  });

  const stats = [
    { label: "Active Studies", value: activeStudies.length, color: "text-primary" },
    { label: "Overdue", value: overdueStudies.length, color: "text-destructive" },
    { label: "Critical (<1h)", value: criticalStudies.length, color: "text-urgency-urgent" },
    { label: "Warning (<4h)", value: warningStudies.length, color: "text-urgency-urgent" },
  ];

  const statusCounts = [
    { status: "New", count: mockStudies.filter(s => s.status === 'new').length, className: "status-new" },
    { status: "Assigned", count: mockStudies.filter(s => s.status === 'assigned').length, className: "status-assigned" },
    { status: "In Progress", count: mockStudies.filter(s => s.status === 'in-progress').length, className: "status-in-progress" },
    { status: "Draft Ready", count: mockStudies.filter(s => s.status === 'draft-ready').length, className: "status-draft-ready" },
    { status: "Under Validation", count: mockStudies.filter(s => s.status === 'under-validation').length, className: "status-under-validation" },
    { status: "Returned", count: mockStudies.filter(s => s.status === 'returned').length, className: "status-returned" },
    { status: "Finalized", count: mockStudies.filter(s => s.status === 'finalized').length, className: "status-finalized" },
    { status: "Delivered", count: mockStudies.filter(s => s.status === 'delivered').length, className: "status-delivered" },
  ];

  return (
    <div>
      <PageHeader
        title="SLA / TAT Dashboard"
        subtitle="Real-time turnaround time monitoring"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="clinical-card p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={cn("text-3xl font-semibold mt-1", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Status Distribution */}
      <div className="clinical-card">
        <div className="clinical-card-header">
          <h2 className="text-sm font-semibold">Status Distribution</h2>
        </div>
        <div className="clinical-card-body">
          <div className="grid grid-cols-4 gap-4">
            {statusCounts.map((item) => (
              <div key={item.status} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                <span className={`status-badge ${item.className}`}>{item.status}</span>
                <span className="text-lg font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overdue Studies Table */}
      {overdueStudies.length > 0 && (
        <div className="clinical-card mt-6">
          <div className="clinical-card-header bg-destructive/10">
            <h2 className="text-sm font-semibold text-destructive">Overdue Studies</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Study ID</th>
                <th>Client</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Overdue By</th>
              </tr>
            </thead>
            <tbody>
              {overdueStudies.map((study) => {
                const overdueMs = now.getTime() - new Date(study.deadline).getTime();
                const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
                const overdueMins = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
                
                return (
                  <tr key={study.id}>
                    <td className="font-mono text-xs">{study.id}</td>
                    <td className="text-sm">{study.clientName}</td>
                    <td><span className={`status-badge status-${study.status}`}>{study.status}</span></td>
                    <td className="text-sm">{study.assignedPhysician || '-'}</td>
                    <td className="text-destructive font-medium">
                      {overdueHours > 0 ? `${overdueHours}h ${overdueMins}m` : `${overdueMins}m`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
