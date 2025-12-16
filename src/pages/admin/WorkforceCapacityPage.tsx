import { useState, useMemo } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  getDay,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths
} from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { mockPhysicians } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Modality, BodyArea, Physician } from "@/types/study";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fullDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Capacity thresholds
const CRITICAL_THRESHOLD = 1; // 1 or fewer radiologists = critical
const WARNING_THRESHOLD = 2; // 2 radiologists = warning

interface DayCapacity {
  date: Date;
  radiologists: Physician[];
  totalHours: number;
  modalities: Set<Modality>;
  bodyAreas: Set<BodyArea>;
  capacityLevel: 'critical' | 'warning' | 'good';
}

export function WorkforceCapacityPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayCapacity | null>(null);

  // Calculate which radiologists work on each day
  const monthCapacity = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    return days.map((date): DayCapacity => {
      const dayOfWeek = fullDayNames[getDay(date)];
      const dateString = format(date, "yyyy-MM-dd");
      
      // Find radiologists working on this day
      const workingRadiologists = mockPhysicians.filter(physician => {
        // Check if they have a custom schedule for this date
        if (physician.customSchedule && physician.customSchedule[dateString]) {
          return physician.customSchedule[dateString].length > 0;
        }
        // Otherwise check their regular schedule
        return physician.schedule.days.includes(dayOfWeek);
      });

      // Calculate total hours
      let totalHours = 0;
      workingRadiologists.forEach(physician => {
        if (physician.customSchedule && physician.customSchedule[dateString]) {
          totalHours += physician.customSchedule[dateString].length;
        } else {
          const startHour = parseInt(physician.schedule.hours.start.split(":")[0]);
          const endHour = parseInt(physician.schedule.hours.end.split(":")[0]);
          totalHours += endHour - startHour;
        }
      });

      // Collect modalities and body areas
      const modalities = new Set<Modality>();
      const bodyAreas = new Set<BodyArea>();
      workingRadiologists.forEach(physician => {
        physician.supportedModalities.forEach(m => modalities.add(m));
        physician.supportedBodyAreas.forEach(b => bodyAreas.add(b));
      });

      // Determine capacity level
      let capacityLevel: 'critical' | 'warning' | 'good' = 'good';
      if (workingRadiologists.length <= CRITICAL_THRESHOLD) {
        capacityLevel = 'critical';
      } else if (workingRadiologists.length <= WARNING_THRESHOLD) {
        capacityLevel = 'warning';
      }

      return {
        date,
        radiologists: workingRadiologists,
        totalHours,
        modalities,
        bodyAreas,
        capacityLevel,
      };
    });
  }, [currentMonth]);

  // Stats for the month
  const monthStats = useMemo(() => {
    const inMonth = monthCapacity.filter(d => isSameMonth(d.date, currentMonth));
    const criticalDays = inMonth.filter(d => d.capacityLevel === 'critical').length;
    const warningDays = inMonth.filter(d => d.capacityLevel === 'warning').length;
    const goodDays = inMonth.filter(d => d.capacityLevel === 'good').length;
    const avgRadiologists = inMonth.reduce((sum, d) => sum + d.radiologists.length, 0) / inMonth.length;
    return { criticalDays, warningDays, goodDays, avgRadiologists };
  }, [monthCapacity, currentMonth]);

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Workforce Capacity"
        subtitle="Monitor radiologist availability and identify staffing gaps"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical Days</p>
                <p className="text-2xl font-bold text-destructive">{monthStats.criticalDays}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Warning Days</p>
                <p className="text-2xl font-bold text-yellow-600">{monthStats.warningDays}</p>
              </div>
              <Info className="w-8 h-8 text-yellow-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Good Coverage</p>
                <p className="text-2xl font-bold text-green-600">{monthStats.goodDays}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg. Radiologists/Day</p>
                <p className="text-2xl font-bold">{monthStats.avgRadiologists.toFixed(1)}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {monthCapacity.map((day, index) => {
                const isCurrentMonth = isSameMonth(day.date, currentMonth);
                const isSelected = selectedDay?.date.getTime() === day.date.getTime();
                
                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setSelectedDay(day)}
                        className={cn(
                          "aspect-square p-1 rounded-lg text-left transition-all relative overflow-hidden",
                          !isCurrentMonth && "opacity-40",
                          isSelected && "ring-2 ring-primary",
                          isToday(day.date) && "ring-1 ring-primary/50",
                          day.capacityLevel === 'critical' && isCurrentMonth && "bg-destructive/20 hover:bg-destructive/30",
                          day.capacityLevel === 'warning' && isCurrentMonth && "bg-yellow-500/20 hover:bg-yellow-500/30",
                          day.capacityLevel === 'good' && isCurrentMonth && "bg-green-500/10 hover:bg-green-500/20",
                          !isCurrentMonth && "bg-muted/30 hover:bg-muted/50"
                        )}
                      >
                        <span className={cn(
                          "text-xs font-medium",
                          isToday(day.date) && "text-primary font-bold"
                        )}>
                          {format(day.date, "d")}
                        </span>
                        
                        {isCurrentMonth && (
                          <div className="absolute bottom-1 left-1 right-1">
                            <div className="flex items-center gap-0.5">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] font-medium">{day.radiologists.length}</span>
                            </div>
                          </div>
                        )}

                        {day.capacityLevel === 'critical' && isCurrentMonth && (
                          <AlertTriangle className="absolute top-1 right-1 w-3 h-3 text-destructive" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-medium">{format(day.date, "EEEE, MMM d")}</p>
                      <p>{day.radiologists.length} radiologist{day.radiologists.length !== 1 ? 's' : ''}</p>
                      <p>{day.totalHours} total hours</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-destructive/20" />
                <span>Critical (≤{CRITICAL_THRESHOLD})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-yellow-500/20" />
                <span>Warning (≤{WARNING_THRESHOLD})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-500/10" />
                <span>Good (&gt;{WARNING_THRESHOLD})</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              {selectedDay ? format(selectedDay.date, "EEEE, MMMM d") : "Select a day"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDay ? (
              <div className="space-y-4">
                {/* Capacity indicator */}
                <div className={cn(
                  "p-3 rounded-lg",
                  selectedDay.capacityLevel === 'critical' && "bg-destructive/10 border border-destructive/30",
                  selectedDay.capacityLevel === 'warning' && "bg-yellow-500/10 border border-yellow-500/30",
                  selectedDay.capacityLevel === 'good' && "bg-green-500/10 border border-green-500/30"
                )}>
                  <div className="flex items-center gap-2">
                    {selectedDay.capacityLevel === 'critical' && (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    )}
                    {selectedDay.capacityLevel === 'warning' && (
                      <Info className="w-4 h-4 text-yellow-600" />
                    )}
                    {selectedDay.capacityLevel === 'good' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      selectedDay.capacityLevel === 'critical' && "text-destructive",
                      selectedDay.capacityLevel === 'warning' && "text-yellow-600",
                      selectedDay.capacityLevel === 'good' && "text-green-600"
                    )}>
                      {selectedDay.capacityLevel === 'critical' && "Critical - Staffing needed"}
                      {selectedDay.capacityLevel === 'warning' && "Warning - Limited coverage"}
                      {selectedDay.capacityLevel === 'good' && "Good coverage"}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-2xl font-bold">{selectedDay.radiologists.length}</p>
                    <p className="text-xs text-muted-foreground">Radiologists</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-2xl font-bold">{selectedDay.totalHours}</p>
                    <p className="text-xs text-muted-foreground">Total Hours</p>
                  </div>
                </div>

                {/* Working Radiologists */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    Working Radiologists
                  </h4>
                  {selectedDay.radiologists.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDay.radiologists.map(physician => (
                        <div key={physician.id} className="p-2 bg-muted/30 rounded text-sm">
                          <p className="font-medium">{physician.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {physician.schedule.hours.start} - {physician.schedule.hours.end}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No radiologists scheduled</p>
                  )}
                </div>

                {/* Modalities Coverage */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    Modalities Covered
                  </h4>
                  {selectedDay.modalities.size > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {Array.from(selectedDay.modalities).map(modality => (
                        <Badge key={modality} variant="secondary" className="text-xs">
                          {modality}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No coverage</p>
                  )}
                </div>

                {/* Body Areas Coverage */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    Body Areas Covered
                  </h4>
                  {selectedDay.bodyAreas.size > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {Array.from(selectedDay.bodyAreas).map(area => (
                        <Badge key={area} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No coverage</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click on a day in the calendar to see detailed staffing information.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
