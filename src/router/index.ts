import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types/study'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoginPage from '@/pages/LoginPage.vue'
import NotFound from '@/pages/NotFound.vue'

// Admin Pages
import TaskListPage from '@/pages/admin/TaskListPage.vue'
// import StudyListPage from '@/pages/admin/StudyListPage.vue'
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
  routes: routes as any,
})

// Navigation guard for authentication and authorization
router.beforeEach(async to => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth === false) {
    return
  }

  if (!await authStore.isAuthenticated()) {
    return { path: '/login', query: { redirect: to.fullPath } }
  } else if (!Object.keys(authStore.user).length) {
    await authStore.getUserInfo()
  }

  const allowedRoles = to.meta.allowedRoles || []
  const userRole = authStore.user.role

  if (allowedRoles.length && !allowedRoles.includes(userRole)) {
    return getDefaultPathForRole(userRole)
  }
})

export const getDefaultPathForRole = (role?: UserRole) => {
  switch (role) {
    case 'admin':
      return '/tasks'
    case 'reporting-radiologist':
      return '/queue'
    case 'validating-radiologist':
      return '/validation'
    default:
      return '/tasks'
  }
}

export default router
