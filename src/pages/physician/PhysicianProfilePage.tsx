import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { mockPhysicians } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Clock, Phone, MessageCircle, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startOfWeek, addDays, format, getDay } from "date-fns";

// Mock monthly statistics
const currentMonthStats = {
  total: 156,
  byModality: { CT: 68, MRI: 52, "X-Ray": 36 },
  byBodyArea: { Spine: 58, Head: 42, Chest: 34, Neck: 22 },
};

const previousMonthStats = {
  total: 143,
  byModality: { CT: 61, MRI: 48, "X-Ray": 34 },
  byBodyArea: { Spine: 52, Head: 38, Chest: 31, Neck: 22 },
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function PhysicianProfilePage() {
  const navigate = useNavigate();
  // Using first physician as current user for demo
  const physician = mockPhysicians[0];

  const currentWeekDays = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dayIndex = getDay(date);
      const dayName = dayNames[dayIndex];
      const isWorkingDay = physician.schedule.days.includes(dayName);
      
      return {
        date,
        shortName: shortDayNames[dayIndex],
        dayNumber: format(date, "d"),
        isWorkingDay,
        hours: isWorkingDay ? `${physician.schedule.hours.start} - ${physician.schedule.hours.end}` : "Off",
      };
    });
  }, [physician]);

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
              <h3 className="text-sm font-semibold">This Week's Schedule</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/schedule/${physician.id}`)}
              >
                <CalendarClock className="w-4 h-4 mr-2" />
                Manage Schedule
              </Button>
            </div>
            <div className="clinical-card-body">
              <div className="grid grid-cols-7 gap-2">
                {currentWeekDays.map((day) => (
                  <div 
                    key={day.shortName} 
                    className={`text-center p-3 rounded-lg border ${
                      day.isWorkingDay 
                        ? "bg-primary/10 border-primary/20" 
                        : "bg-muted/50 border-border"
                    }`}
                  >
                    <p className="text-xs font-medium text-muted-foreground">{day.shortName}</p>
                    <p className="text-lg font-semibold mt-1">{day.dayNumber}</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <p className={`text-xs ${day.isWorkingDay ? "text-foreground" : "text-muted-foreground"}`}>
                        {day.hours}
                      </p>
                    </div>
                  </div>
                ))}
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
          {/* Monthly Stats */}
          <div className="clinical-card">
            <div className="clinical-card-header">
              <h3 className="text-sm font-semibold">Monthly Performance</h3>
            </div>
            <div className="clinical-card-body">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">This Month</p>
                  <p className="text-3xl font-bold text-primary mt-1">{currentMonthStats.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(), "MMMM")}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Month</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{previousMonthStats.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">{format(addDays(new Date(), -30), "MMMM")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* All-time Total */}
          <div className="clinical-card">
            <div className="clinical-card-body text-center py-4">
              <p className="text-2xl font-bold text-primary">{physician.statistics.total.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">All-Time Total</p>
            </div>
          </div>

          {/* By Modality */}
          <div className="clinical-card">
            <div className="clinical-card-header">
              <h3 className="text-sm font-semibold">By Modality</h3>
              <span className="text-xs text-muted-foreground">This month</span>
            </div>
            <div className="clinical-card-body">
              <div className="space-y-3">
                {Object.entries(currentMonthStats.byModality)
                  .sort(([, a], [, b]) => b - a)
                  .map(([modality, count]) => (
                    <div key={modality} className="flex items-center justify-between">
                      <span className="text-sm">{modality}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* By Body Area */}
          <div className="clinical-card">
            <div className="clinical-card-header">
              <h3 className="text-sm font-semibold">By Body Area</h3>
              <span className="text-xs text-muted-foreground">This month</span>
            </div>
            <div className="clinical-card-body">
              <div className="space-y-3">
                {Object.entries(currentMonthStats.byBodyArea)
                  .sort(([, a], [, b]) => b - a)
                  .map(([area, count]) => (
                    <div key={area} className="flex items-center justify-between">
                      <span className="text-sm">{area}</span>
                      <span className="text-sm font-medium">{count}</span>
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
