import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Calendar, Clock, CalendarClock, Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { mockPhysicians } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { UserRole, Physician } from "@/types/study";

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  "reporting-radiologist": "Reporting",
  "validating-radiologist": "Validating",
};

const roleBadgeColors: Record<UserRole, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  "reporting-radiologist": "bg-primary/10 text-primary border-primary/20",
  "validating-radiologist": "bg-status-finalized/10 text-status-finalized border-status-finalized/20",
};

export function UserManagementPage() {
  const navigate = useNavigate();
  const [selectedPhysician, setSelectedPhysician] = useState<string | null>(null);
  const [physicians, setPhysicians] = useState<Physician[]>(mockPhysicians);

  const selected = physicians.find(p => p.id === selectedPhysician);

  const handleRoleChange = (physicianId: string, newRole: UserRole) => {
    setPhysicians(prev => 
      prev.map(p => p.id === physicianId ? { ...p, role: newRole } : p)
    );
  };

  const openSchedule = (physicianId: string) => {
    navigate(`/schedule/${physicianId}`);
  };

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
                  <th>Role</th>
                  <th>Contact</th>
                  <th>Modalities</th>
                  <th>Workload</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {physicians.map((physician) => (
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
                    <td onClick={(e) => e.stopPropagation()}>
                      <Select 
                        value={physician.role} 
                        onValueChange={(value: UserRole) => handleRoleChange(physician.id, value)}
                      >
                        <SelectTrigger className={cn(
                          "w-[130px] h-8 text-xs border",
                          roleBadgeColors[physician.role]
                        )}>
                          <Shield className="w-3 h-3 mr-1" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-destructive" />
                              Admin
                            </div>
                          </SelectItem>
                          <SelectItem value="reporting-radiologist">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              Reporting
                            </div>
                          </SelectItem>
                          <SelectItem value="validating-radiologist">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-status-finalized" />
                              Validating
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            openSchedule(physician.id);
                          }}
                          title="Manage Schedule"
                        >
                          <CalendarClock className="w-4 h-4" />
                        </Button>
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
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", roleBadgeColors[selected.role])}
                >
                  {roleLabels[selected.role]}
                </Badge>
              </div>
              <div className="clinical-card-body space-y-4">
                {/* Schedule */}
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="section-header">Default Schedule</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => openSchedule(selected.id)}
                    >
                      <CalendarClock className="w-3 h-3 mr-1" />
                      Manage
                    </Button>
                  </div>
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
