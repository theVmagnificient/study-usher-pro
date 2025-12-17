import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/layout/AppLayout";

// Admin Pages
import { StudyListPage } from "@/pages/admin/StudyListPage";
import { TaskTypesPage } from "@/pages/admin/TaskTypesPage";
import { AuditLogPage } from "@/pages/admin/AuditLogPage";
import { SLADashboardPage } from "@/pages/admin/SLADashboardPage";
import { UserManagementPage } from "@/pages/admin/UserManagementPage";
import { StudyDetailPage } from "@/pages/admin/StudyDetailPage";
import { PhysicianSchedulePage } from "@/pages/admin/PhysicianSchedulePage";
import { WorkforceCapacityPage } from "@/pages/admin/WorkforceCapacityPage";

// Physician Pages
import { PhysicianQueuePage } from "@/pages/physician/PhysicianQueuePage";
import { ValidationQueuePage } from "@/pages/physician/ValidationQueuePage";
import { PhysicianProfilePage } from "@/pages/physician/PhysicianProfilePage";

// Reporting
import { ReportingPage } from "@/pages/reporting/ReportingPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Redirect root to studies */}
            <Route path="/" element={<Navigate to="/studies" replace />} />
            
            {/* Admin routes with layout */}
            <Route path="/studies" element={<AppLayout><StudyListPage /></AppLayout>} />
            <Route path="/study/:studyId" element={<AppLayout><StudyDetailPage /></AppLayout>} />
            <Route path="/task-types" element={<AppLayout><TaskTypesPage /></AppLayout>} />
            <Route path="/users" element={<AppLayout><UserManagementPage /></AppLayout>} />
            <Route path="/schedule/:physicianId" element={<AppLayout><PhysicianSchedulePage /></AppLayout>} />
            <Route path="/audit" element={<AppLayout><AuditLogPage /></AppLayout>} />
            <Route path="/sla" element={<AppLayout><SLADashboardPage /></AppLayout>} />
            <Route path="/workforce" element={<AppLayout><WorkforceCapacityPage /></AppLayout>} />
            
            {/* Physician routes with layout */}
            <Route path="/queue" element={<AppLayout><PhysicianQueuePage /></AppLayout>} />
            <Route path="/validation" element={<AppLayout><ValidationQueuePage /></AppLayout>} />
            <Route path="/profile" element={<AppLayout><PhysicianProfilePage /></AppLayout>} />
            
            {/* Reporting screen - full screen without sidebar */}
            <Route path="/report/:studyId" element={<ReportingPage />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
