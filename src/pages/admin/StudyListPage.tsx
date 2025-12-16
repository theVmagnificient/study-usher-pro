import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreHorizontal, Download, UserPlus, Calendar } from "lucide-react";
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { DeadlineTimer } from "@/components/ui/DeadlineTimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { mockStudies } from "@/data/mockData";
import type { StudyStatus, Study } from "@/types/study";

const statusOptions: { value: StudyStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "assigned", label: "Assigned" },
  { value: "in-progress", label: "In Progress" },
  { value: "draft-ready", label: "Draft Ready" },
  { value: "under-validation", label: "Under Validation" },
  { value: "returned", label: "Returned" },
  { value: "finalized", label: "Finalized" },
  { value: "delivered", label: "Delivered" },
];

export function StudyListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudyStatus | "all">("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [modalityFilter, setModalityFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const clients = [...new Set(mockStudies.map((s) => s.clientName))];
  const modalities = [...new Set(mockStudies.map((s) => s.modality))];

  const filteredStudies = mockStudies.filter((study) => {
    const matchesSearch =
      study.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      study.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      study.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || study.status === statusFilter;
    const matchesClient = clientFilter === "all" || study.clientName === clientFilter;
    const matchesModality = modalityFilter === "all" || study.modality === modalityFilter;
    
    const receivedDate = parseISO(study.receivedAt);
    const matchesDateFrom = !dateFrom || isAfter(receivedDate, startOfDay(dateFrom)) || receivedDate.getTime() === startOfDay(dateFrom).getTime();
    const matchesDateTo = !dateTo || isBefore(receivedDate, endOfDay(dateTo));
    
    return matchesSearch && matchesStatus && matchesClient && matchesModality && matchesDateFrom && matchesDateTo;
  });

  const handleRowClick = (study: Study) => {
    navigate(`/study/${study.id}`);
  };

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div>
      <PageHeader
        title="Study List"
        subtitle={`${filteredStudies.length} studies`}
      />

      {/* Filters */}
      <div className="clinical-card mb-6">
        <div className="p-4 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, Patient ID, or Client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StudyStatus | "all")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={modalityFilter} onValueChange={setModalityFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Modality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {modalities.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "MMM d") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "MMM d") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={clearDateFilters}>
              Clear dates
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="clinical-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Study ID</th>
                <th>Patient</th>
                <th>Client</th>
                <th>Modality / Area</th>
                <th>Received</th>
                <th>Status</th>
                <th>Urgency</th>
                <th>Assigned To</th>
                <th>Deadline</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredStudies.map((study) => (
                <tr
                  key={study.id}
                  onClick={() => handleRowClick(study)}
                  className="cursor-pointer"
                >
                  <td className="font-mono text-xs font-medium">{study.id}</td>
                  <td>
                    <div className="text-sm">{study.patientId}</div>
                    <div className="text-xs text-muted-foreground">
                      {study.sex}/{study.age}y
                    </div>
                  </td>
                  <td className="text-sm">{study.clientName}</td>
                  <td>
                    <div className="text-sm font-medium">{study.modality}</div>
                    <div className="text-xs text-muted-foreground">{study.bodyArea}</div>
                  </td>
                  <td>
                    <div className="text-sm">{format(parseISO(study.receivedAt), "MMM d, yyyy")}</div>
                    <div className="text-xs text-muted-foreground">{format(parseISO(study.receivedAt), "HH:mm")}</div>
                  </td>
                  <td>
                    <StatusBadge status={study.status} />
                  </td>
                  <td>
                    <UrgencyBadge urgency={study.urgency} />
                  </td>
                  <td className="text-sm">
                    {study.assignedPhysician || (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <DeadlineTimer deadline={study.deadline} />
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download DICOM
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Reassign
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
