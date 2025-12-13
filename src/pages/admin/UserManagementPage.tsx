import { useState } from "react";
import { Plus, Edit2, Trash2, Calendar, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { mockPhysicians } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function UserManagementPage() {
  const [selectedPhysician, setSelectedPhysician] = useState<string | null>(null);

  const selected = mockPhysicians.find(p => p.id === selectedPhysician);

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage physicians and their assignments"
        actions={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Physician
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Physician List */}
        <div className="col-span-2">
          <div className="clinical-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Physician</th>
                  <th>Contact</th>
                  <th>Modalities</th>
                  <th>Workload</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {mockPhysicians.map((physician) => (
                  <tr 
                    key={physician.id}
                    className={cn(
                      "cursor-pointer",
                      selectedPhysician === physician.id && "bg-accent"
                    )}
                    onClick={() => setSelectedPhysician(physician.id)}
                  >
                    <td>
                      <div className="font-medium text-sm">{physician.fullName}</div>
                      <div className="text-xs text-muted-foreground">
                        {physician.statistics.total.toLocaleString()} studies completed
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">{physician.phone}</div>
                      {physician.telegram && (
                        <div className="text-xs text-muted-foreground">{physician.telegram}</div>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {physician.supportedModalities.map((m) => (
                          <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "text-sm font-medium",
                          physician.activeStudies >= physician.maxActiveStudies && "text-destructive"
                        )}>
                          {physician.activeStudies}/{physician.maxActiveStudies}
                        </div>
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all",
                              physician.activeStudies >= physician.maxActiveStudies 
                                ? "bg-destructive" 
                                : "bg-primary"
                            )}
                            style={{ width: `${(physician.activeStudies / physician.maxActiveStudies) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Physician Details Panel */}
        <div className="col-span-1">
          {selected ? (
            <div className="clinical-card">
              <div className="clinical-card-header">
                <h3 className="text-sm font-semibold">{selected.fullName}</h3>
              </div>
              <div className="clinical-card-body space-y-4">
                {/* Schedule */}
                <div>
                  <h4 className="section-header">Schedule</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{selected.schedule.days.join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{selected.schedule.hours.start} - {selected.schedule.hours.end}</span>
                    </div>
                  </div>
                </div>

                {/* Body Areas */}
                <div>
                  <h4 className="section-header">Body Areas</h4>
                  <div className="flex flex-wrap gap-1">
                    {selected.supportedBodyAreas.map((area) => (
                      <Badge key={area} variant="outline" className="text-xs">{area}</Badge>
                    ))}
                  </div>
                </div>

                {/* Statistics */}
                <div>
                  <h4 className="section-header">Statistics by Modality</h4>
                  <div className="space-y-2">
                    {Object.entries(selected.statistics.byModality)
                      .filter(([_, count]) => count > 0)
                      .sort(([, a], [, b]) => b - a)
                      .map(([modality, count]) => (
                        <div key={modality} className="flex items-center justify-between text-sm">
                          <span>{modality}</span>
                          <span className="font-medium">{count.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="clinical-card p-8 text-center text-muted-foreground">
              <p className="text-sm">Select a physician to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
