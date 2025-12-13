import { PageHeader } from "@/components/layout/PageHeader";
import { mockPhysicians } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PhysicianProfilePage() {
  // Using first physician as current user for demo
  const physician = mockPhysicians[0];

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="My Profile"
        subtitle="View your profile and statistics"
        actions={
          <Button variant="outline">Edit Profile</Button>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="clinical-card">
            <div className="clinical-card-header">
              <h3 className="text-sm font-semibold">Contact Information</h3>
            </div>
            <div className="clinical-card-body">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="section-header">Full Name</label>
                  <p className="text-sm font-medium">{physician.fullName}</p>
                </div>
                <div>
                  <label className="section-header">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm">{physician.phone}</p>
                  </div>
                </div>
                {physician.telegram && (
                  <div>
                    <label className="section-header">Telegram</label>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm">{physician.telegram}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Card */}
          <div className="clinical-card">
            <div className="clinical-card-header">
              <h3 className="text-sm font-semibold">Working Schedule</h3>
            </div>
            <div className="clinical-card-body">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="section-header">Days</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm">{physician.schedule.days.join(", ")}</p>
                  </div>
                </div>
                <div>
                  <label className="section-header">Hours</label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm">{physician.schedule.hours.start} - {physician.schedule.hours.end}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Specialties Card */}
          <div className="clinical-card">
            <div className="clinical-card-header">
              <h3 className="text-sm font-semibold">Supported Areas</h3>
            </div>
            <div className="clinical-card-body space-y-4">
              <div>
                <label className="section-header">Modalities</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {physician.supportedModalities.map((m) => (
                    <Badge key={m} variant="secondary">{m}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="section-header">Body Areas</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {physician.supportedBodyAreas.map((area) => (
                    <Badge key={area} variant="outline">{area}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="col-span-1 space-y-6">
          {/* Total Count */}
          <div className="clinical-card">
            <div className="clinical-card-body text-center py-6">
              <p className="text-4xl font-bold text-primary">{physician.statistics.total.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Studies Completed</p>
            </div>
          </div>

          {/* By Modality */}
          <div className="clinical-card">
            <div className="clinical-card-header">
              <h3 className="text-sm font-semibold">By Modality</h3>
            </div>
            <div className="clinical-card-body">
              <div className="space-y-3">
                {Object.entries(physician.statistics.byModality)
                  .filter(([_, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([modality, count]) => (
                    <div key={modality} className="flex items-center justify-between">
                      <span className="text-sm">{modality}</span>
                      <span className="text-sm font-medium">{count.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* By Body Area */}
          <div className="clinical-card">
            <div className="clinical-card-header">
              <h3 className="text-sm font-semibold">By Body Area</h3>
            </div>
            <div className="clinical-card-body">
              <div className="space-y-3">
                {Object.entries(physician.statistics.byBodyArea)
                  .filter(([_, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([area, count]) => (
                    <div key={area} className="flex items-center justify-between">
                      <span className="text-sm">{area}</span>
                      <span className="text-sm font-medium">{count.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
