import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types/study'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import NotFound from '@/pages/NotFound'

// Admin Pages
import TaskListPage from '@/pages/admin/TaskListPage'
import StudyDetailPage from '@/pages/admin/StudyDetailPage'
import TaskTypesPage from '@/pages/admin/TaskTypesPage'
import UserManagementPage from '@/pages/admin/UserManagementPage'
import PhysicianSchedulePage from '@/pages/admin/PhysicianSchedulePage'
import AuditLogPage from '@/pages/admin/AuditLogPage'
import SLADashboardPage from '@/pages/admin/SLADashboardPage'
import WorkforceCapacityPage from '@/pages/admin/WorkforceCapacityPage'

// Physician Pages
import PhysicianQueuePage from '@/pages/physician/PhysicianQueuePage'
import ValidationQueuePage from '@/pages/physician/ValidationQueuePage'
import PhysicianProfilePage from '@/pages/physician/PhysicianProfilePage'

// Reporting
import ReportingPage from '@/pages/reporting/ReportingPage'

export function getDefaultPathForRole(role?: UserRole): string {
  switch (role) {
    case 'admin': return '/tasks'
    case 'reporting-radiologist': return '/queue'
    case 'validating-radiologist': return '/validation'
    default: return '/tasks'
  }
}

function RequireAuth({ roles }: { roles?: UserRole[] }) {
  const { user, isAuthenticated, getUserInfo } = useAuthStore()
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      const ok = await isAuthenticated()
      if (!ok) { if (!cancelled) { setAuthed(false); setChecking(false) } return }
      if (!Object.keys(user).length) await getUserInfo()
      if (!cancelled) { setAuthed(true); setChecking(false) }
    }
    check()
    return () => { cancelled = true }
  }, [location.pathname])

  if (checking) return null

  if (!authed) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  const userRole = useAuthStore.getState().user.role
  if (roles && roles.length && userRole && !roles.includes(userRole)) {
    return <Navigate to={getDefaultPathForRole(userRole)} replace />
  }

  return <Outlet />
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <Navigate to="/tasks" replace />,
  },

  // Admin-only routes
  {
    element: <RequireAuth roles={['admin']} />,
    children: [
      { path: '/tasks', element: <AppLayout><TaskListPage /></AppLayout> },
      { path: '/task/:taskId', element: <AppLayout><StudyDetailPage /></AppLayout> },
      { path: '/task-types', element: <AppLayout><TaskTypesPage /></AppLayout> },
      { path: '/users', element: <AppLayout><UserManagementPage /></AppLayout> },
      { path: '/audit', element: <AppLayout><AuditLogPage /></AppLayout> },
      { path: '/sla', element: <AppLayout><SLADashboardPage /></AppLayout> },
      { path: '/workforce', element: <AppLayout><WorkforceCapacityPage /></AppLayout> },
    ],
  },

  // Admin + physicians
  {
    element: <RequireAuth roles={['admin', 'reporting-radiologist', 'validating-radiologist']} />,
    children: [
      { path: '/schedule/:physicianId', element: <AppLayout><PhysicianSchedulePage /></AppLayout> },
      { path: '/profile', element: <AppLayout><PhysicianProfilePage /></AppLayout> },
    ],
  },

  // Physician queue
  {
    element: <RequireAuth roles={['admin', 'reporting-radiologist']} />,
    children: [
      { path: '/queue', element: <AppLayout><PhysicianQueuePage /></AppLayout> },
    ],
  },

  // Validation queue
  {
    element: <RequireAuth roles={['admin', 'validating-radiologist']} />,
    children: [
      { path: '/validation', element: <AppLayout><ValidationQueuePage /></AppLayout> },
    ],
  },

  // Reporting page (no layout wrapper)
  {
    element: <RequireAuth roles={['admin', 'reporting-radiologist', 'validating-radiologist']} />,
    children: [
      { path: '/report/:taskId', element: <ReportingPage /> },
    ],
  },

  { path: '*', element: <NotFound /> },
])
