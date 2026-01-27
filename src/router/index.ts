import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types/study'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoginPage from '@/pages/LoginPage.vue'
import NotFound from '@/pages/NotFound.vue'

// Admin Pages
import TaskListPage from '@/pages/admin/TaskListPage.vue'
import StudyListPage from '@/pages/admin/StudyListPage.vue'
import StudyDetailPage from '@/pages/admin/StudyDetailPage.vue'
import TaskTypesPage from '@/pages/admin/TaskTypesPage.vue'
import UserManagementPage from '@/pages/admin/UserManagementPage.vue'
import PhysicianSchedulePage from '@/pages/admin/PhysicianSchedulePage.vue'
import AuditLogPage from '@/pages/admin/AuditLogPage.vue'
import SLADashboardPage from '@/pages/admin/SLADashboardPage.vue'
import WorkforceCapacityPage from '@/pages/admin/WorkforceCapacityPage.vue'

// Physician Pages
import PhysicianQueuePage from '@/pages/physician/PhysicianQueuePage.vue'
import ValidationQueuePage from '@/pages/physician/ValidationQueuePage.vue'
import PhysicianProfilePage from '@/pages/physician/PhysicianProfilePage.vue'

// Reporting
import ReportingPage from '@/pages/reporting/ReportingPage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    allowedRoles?: UserRole[]
  }
}

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/tasks'
  },
  {
    path: '/tasks',
    component: AppLayout,
    meta: { allowedRoles: ['admin'] },
    children: [
      {
        path: '',
        component: TaskListPage
      }
    ]
  },
  {
    path: '/task/:taskId',
    component: AppLayout,
    meta: { allowedRoles: ['admin'] },
    children: [
      {
        path: '',
        component: StudyDetailPage
      }
    ]
  },
  {
    path: '/task-types',
    component: AppLayout,
    meta: { allowedRoles: ['admin'] },
    children: [
      {
        path: '',
        component: TaskTypesPage
      }
    ]
  },
  {
    path: '/users',
    component: AppLayout,
    meta: { allowedRoles: ['admin'] },
    children: [
      {
        path: '',
        component: UserManagementPage
      }
    ]
  },
  {
    path: '/schedule/:physicianId',
    component: AppLayout,
    meta: { allowedRoles: ['admin', 'reporting-radiologist', 'validating-radiologist'] },
    children: [
      {
        path: '',
        component: PhysicianSchedulePage
      }
    ]
  },
  {
    path: '/audit',
    component: AppLayout,
    meta: { allowedRoles: ['admin'] },
    children: [
      {
        path: '',
        component: AuditLogPage
      }
    ]
  },
  {
    path: '/sla',
    component: AppLayout,
    meta: { allowedRoles: ['admin'] },
    children: [
      {
        path: '',
        component: SLADashboardPage
      }
    ]
  },
  {
    path: '/workforce',
    component: AppLayout,
    meta: { allowedRoles: ['admin'] },
    children: [
      {
        path: '',
        component: WorkforceCapacityPage
      }
    ]
  },
  {
    path: '/queue',
    component: AppLayout,
    meta: { allowedRoles: ['admin', 'reporting-radiologist'] },
    children: [
      {
        path: '',
        component: PhysicianQueuePage
      }
    ]
  },
  {
    path: '/validation',
    component: AppLayout,
    meta: { allowedRoles: ['admin', 'validating-radiologist'] },
    children: [
      {
        path: '',
        component: ValidationQueuePage
      }
    ]
  },
  {
    path: '/profile',
    component: AppLayout,
    meta: { allowedRoles: ['admin', 'reporting-radiologist', 'validating-radiologist'] },
    children: [
      {
        path: '',
        component: PhysicianProfilePage
      }
    ]
  },
  {
    path: '/report/:taskId',
    component: ReportingPage,
    meta: { allowedRoles: ['admin', 'reporting-radiologist', 'validating-radiologist'] }
  },
  {
    path: '/:pathMatch(.*)*',
    component: NotFound,
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication and authorization
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Check if route requires authentication (default is true unless explicitly false)
  const requiresAuth = to.meta.requiresAuth !== false

  if (!requiresAuth) {
    // Public route, allow access
    next()
    return
  }

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    // Save the intended destination
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // Check role-based access
  const allowedRoles = to.meta.allowedRoles

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = authStore.role

    if (!userRole || !allowedRoles.includes(userRole)) {
      // User doesn't have permission, redirect to their default page
      const defaultPath = getDefaultPathForRole(userRole)
      next(defaultPath)
      return
    }
  }

  // User is authenticated and authorized
  next()
})

function getDefaultPathForRole(role: UserRole | null): string {
  if (!role) return '/login'

  switch (role) {
    case 'admin':
      return '/tasks'
    case 'reporting-radiologist':
      return '/queue'
    case 'validating-radiologist':
      return '/validation'
    default:
      return '/login'
  }
}

export default router

