import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { mockPhysicians } from "@/data/mockData";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function PhysicianSchedulePage() {
  const { physicianId } = useParams();
  const navigate = useNavigate();
  
  const physician = mockPhysicians.find(p => p.id === physicianId);
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  
  // Mock schedule state - in real app this would be from backend
  const [schedule, setSchedule] = useState<Record<string, number[]>>(() => {
    // Initialize with default schedule based on physician's working days/hours
    if (!physician) return {};
    
    const defaultSchedule: Record<string, number[]> = {};
    const startHour = parseInt(physician.schedule.hours.start.split(":")[0]);
    const endHour = parseInt(physician.schedule.hours.end.split(":")[0]);
    const workingHours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
    
    // Apply custom schedule if exists
    if (physician.customSchedule) {
      Object.entries(physician.customSchedule).forEach(([date, hours]) => {
        defaultSchedule[date] = hours;
      });
    }
    
    return defaultSchedule;
  });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const getWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${format(start, "dd.MM")} - ${format(end, "dd.MM")}`;
  };

  const isDefaultWorkingHour = (date: Date, hour: number) => {
    if (!physician) return false;
    const dayName = DAY_NAMES[date.getDay()];
    const isWorkingDay = physician.schedule.days.includes(dayName);
    if (!isWorkingDay) return false;
    
    const startHour = parseInt(physician.schedule.hours.start.split(":")[0]);
    const endHour = parseInt(physician.schedule.hours.end.split(":")[0]);
    return hour >= startHour && hour < endHour;
  };

  const isScheduled = (date: Date, hour: number) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const customHours = schedule[dateKey];
    
    if (customHours !== undefined) {
      return customHours.includes(hour);
    }
    
    // Fall back to default schedule
    return isDefaultWorkingHour(date, hour);
  };

  const toggleHour = (date: Date, hour: number) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const currentHours = schedule[dateKey] ?? getDefaultHoursForDate(date);
    
    const newHours = currentHours.includes(hour)
      ? currentHours.filter(h => h !== hour)
      : [...currentHours, hour].sort((a, b) => a - b);
    
    setSchedule(prev => ({
      ...prev,
      [dateKey]: newHours
    }));
  };

  const getDefaultHoursForDate = (date: Date): number[] => {
    if (!physician) return [];
    const dayName = DAY_NAMES[date.getDay()];
    if (!physician.schedule.days.includes(dayName)) return [];
    
    const startHour = parseInt(physician.schedule.hours.start.split(":")[0]);
    const endHour = parseInt(physician.schedule.hours.end.split(":")[0]);
    return Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  };

  const setAllHoursForDay = (date: Date, hours: number[]) => {
    const dateKey = format(date, "yyyy-MM-dd");
    setSchedule(prev => ({
      ...prev,
      [dateKey]: hours
    }));
  };

  const resetDayToDefault = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    setSchedule(prev => {
      const newSchedule = { ...prev };
      delete newSchedule[dateKey];
      return newSchedule;
    });
  };

  if (!physician) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Physician not found</p>
        <Button variant="outline" onClick={() => navigate("/users")} className="mt-4">
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/users")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{physician.fullName}</h1>
          <p className="text-sm text-muted-foreground">Schedule Management</p>
        </div>
        <Button variant="outline">
          Save Changes
        </Button>
      </div>

      {/* Week Navigation */}
      <div className="clinical-card mb-6">
        <div className="p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCurrentWeekStart(prev => subWeeks(prev, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-4">
            {/* Quick week tabs */}
            {[-1, 0, 1, 2].map((offset) => {
              const weekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), offset);
              const weekEnd = addDays(weekStart, 6);
              const isCurrentView = isSameDay(weekStart, currentWeekStart);
              
              return (
                <button
                  key={offset}
                  onClick={() => setCurrentWeekStart(weekStart)}
                  className={cn(
                    "px-4 py-2 text-sm rounded-md transition-colors",
                    isCurrentView 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {format(weekStart, "dd.MM")} - {format(weekEnd, "dd.MM")}
                </button>
              );
            })}
          </div>
          
          <Button variant="ghost" size="icon" onClick={() => setCurrentWeekStart(prev => addWeeks(prev, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="clinical-card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {weekDays.map((date) => {
              const dateKey = format(date, "yyyy-MM-dd");
              const dayName = DAY_NAMES[date.getDay()];
              const hasCustomSchedule = schedule[dateKey] !== undefined;
              const scheduledHours = hasCustomSchedule 
                ? schedule[dateKey] 
                : getDefaultHoursForDate(date);
              
              return (
                <div key={dateKey} className="border-b border-border last:border-b-0">
                  <div className="flex items-center">
                    {/* Date Label */}
                    <div className="w-32 p-3 border-r border-border bg-muted/30">
                      <div className="text-sm font-medium">{format(date, "dd.MM")}</div>
                      <div className="text-xs text-muted-foreground">{dayName}</div>
                      {hasCustomSchedule && (
                        <button 
                          onClick={() => resetDayToDefault(date)}
                          className="text-xs text-primary hover:underline mt-1"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    
                    {/* Hours Grid */}
                    <div className="flex-1 flex p-2 gap-0.5">
                      {HOURS.map((hour) => {
                        const isActive = isScheduled(date, hour);
                        const isDefault = isDefaultWorkingHour(date, hour);
                        
                        return (
                          <button
                            key={hour}
                            onClick={() => toggleHour(date, hour)}
                            className={cn(
                              "w-8 h-8 text-xs font-medium rounded transition-colors flex items-center justify-center",
                              isActive 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted/50 text-muted-foreground hover:bg-muted",
                              !isActive && isDefault && "ring-1 ring-primary/30"
                            )}
                            title={`${hour}:00 - ${hour + 1}:00`}
                          >
                            {String(hour).padStart(2, "0")}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary" />
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted/50" />
          <span>Not working</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted/50 ring-1 ring-primary/30" />
          <span>Default schedule (not customized)</span>
        </div>
      </div>
    </div>
  );
}
