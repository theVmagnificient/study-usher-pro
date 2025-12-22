import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import NotFound from '@/pages/NotFound.vue'

// Admin Pages
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

const routes = [
  {
    path: '/',
    redirect: '/studies'
  } as any,
  {
    path: '/studies',
    component: AppLayout,
    children: [
      {
        path: '',
        component: StudyListPage
      }
    ]
  },
  {
    path: '/study/:studyId',
    component: AppLayout,
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
    children: [
      {
        path: '',
        component: PhysicianProfilePage
      }
    ]
  },
  {
    path: '/report/:studyId',
    component: ReportingPage
  },
  {
    path: '/:pathMatch(.*)*',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

