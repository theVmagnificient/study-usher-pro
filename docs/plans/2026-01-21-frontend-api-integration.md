# Frontend API Integration & Authentication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement complete authentication system with role-based access control and migrate all frontend components from mock data to real API integration.

**Architecture:** Vue Router navigation guards check authentication and role permissions before allowing route access. All stores consume real API endpoints exclusively. Login page handles authentication flow with redirect-after-login support.

**Tech Stack:** Vue 3, Vue Router, Pinia stores, Axios, Radix Vue components, Tailwind CSS

---

## Task 1: Create Login Page Component

**Files:**
- Create: `/Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/pages/LoginPage.vue`

**Step 1: Create login page component**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter both email and password'
    return
  }

  isLoading.value = true

  try {
    const success = await authStore.login(email.value, password.value)

    if (success) {
      // Get redirect path from query params or use role default
      const redirectPath = (route.query.redirect as string) || getRoleDefaultPath()
      router.push(redirectPath)
    } else {
      errorMessage.value = authStore.error || 'Login failed. Please check your credentials.'
    }
  } catch (error) {
    errorMessage.value = 'An unexpected error occurred. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const getRoleDefaultPath = (): string => {
  if (!authStore.role) return '/studies'

  switch (authStore.role) {
    case 'admin':
      return '/studies'
    case 'reporting-radiologist':
      return '/queue'
    case 'validating-radiologist':
      return '/validation'
    default:
      return '/studies'
  }
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    handleLogin()
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1">
        <CardTitle class="text-2xl font-bold text-center">
          Reporting Platform
        </CardTitle>
        <CardDescription class="text-center">
          Sign in to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="your.email@example.com"
              :disabled="isLoading"
              @keypress="handleKeyPress"
              autocomplete="email"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              :disabled="isLoading"
              @keypress="handleKeyPress"
              autocomplete="current-password"
              required
            />
          </div>

          <div v-if="errorMessage" class="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {{ errorMessage }}
          </div>

          <Button
            type="submit"
            class="w-full"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Signing in...' : 'Sign in' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
```

**Step 2: Verify component imports exist**

Check that these components exist:
- `@/components/ui/button`
- `@/components/ui/input`
- `@/components/ui/label`
- `@/components/ui/card`

If any are missing, create them using Radix Vue primitives.

---

## Task 2: Add Route Guards and Update Router

**Files:**
- Modify: `/Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/router/index.ts`

**Step 1: Read current router configuration**

Read the file to understand current structure.

**Step 2: Update router with login route and guards**

Replace the entire file with:

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types/study'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoginPage from '@/pages/LoginPage.vue'
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
    redirect: '/studies'
  },
  {
    path: '/studies',
    component: AppLayout,
    meta: { allowedRoles: ['admin'] },
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
    meta: { allowedRoles: ['admin'] },
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
    path: '/report/:studyId',
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
      return '/studies'
    case 'reporting-radiologist':
      return '/queue'
    case 'validating-radiologist':
      return '/validation'
    default:
      return '/login'
  }
}

export default router
```

**Step 3: Test navigation guard**

Start the dev server and test:
1. Navigate to `/studies` without being logged in → should redirect to `/login?redirect=/studies`
2. Navigate to `/login` → should show login page
3. Login should work and redirect back

---

## Task 3: Remove Mock Data from Stores

**Files:**
- Modify: `/Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/stores/studyStore.ts`
- Modify: `/Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/stores/taskStore.ts`
- Modify: `/Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/stores/userStore.ts`
- Modify: `/Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/stores/auditStore.ts`
- Modify: `/Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/stores/clientTypeStore.ts`

**Step 1: Check each store for mock data imports**

Use Grep to find all imports of `mockData`:

```bash
grep -r "from '@/data/mockData'" src/stores/
```

**Step 2: Remove mock data imports and fallbacks from each store**

For each store file found:
1. Read the file
2. Remove the import statement: `import { mockX } from '@/data/mockData'`
3. Remove any fallback logic that uses mock data
4. Ensure all methods only use service calls and throw errors on failure

**Step 3: Verify stores only use API services**

Check that each store method:
- Calls the appropriate service (taskService, studyService, etc.)
- Handles loading states
- Handles errors properly
- Does NOT fall back to mock data

---

## Task 4: Remove Mock Data from Pages

**Files:**
- All page components in `/Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/pages/`

**Step 1: Find all pages importing mock data**

Use Grep to find all imports:

```bash
grep -r "from '@/data/mockData'" src/pages/
```

**Step 2: Update each page component**

For each page file found:
1. Read the file
2. Remove the import statement
3. Ensure page uses store methods exclusively
4. Add loading states if missing
5. Add error handling if missing

**Step 3: Add loading and error states**

Ensure each page has:

```vue
<script setup lang="ts">
const isLoading = ref(false)
const error = ref<string | null>(null)

const loadData = async () => {
  isLoading.value = true
  error.value = null

  try {
    // Load data from store
    await someStore.fetchData()
  } catch (err: any) {
    error.value = err.message || 'Failed to load data'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div v-if="isLoading" class="flex items-center justify-center p-8">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>

  <div v-else-if="error" class="p-4 bg-red-50 text-red-600 rounded-md">
    {{ error }}
  </div>

  <div v-else>
    <!-- Page content -->
  </div>
</template>
```

---

## Task 5: Add Missing Service Methods

**Files:**
- Modify: `/Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/services/userService.ts`
- Create: `/Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/services/adminService.ts`

**Step 1: Read current userService**

Check what methods already exist in userService.ts.

**Step 2: Add admin user management methods to userService**

Add these methods if missing:

```typescript
export const userService = {
  // ... existing methods ...

  async createUser(userData: {
    email: string
    first_name: string
    last_name: string
    role: string
    password: string
  }): Promise<User> {
    try {
      const response = await apiClient.post<User>('/api/v1/admin/users', userData)
      return response.data
    } catch (error) {
      console.error('Failed to create user:', error)
      throw error
    }
  },

  async updateUser(userId: number, userData: Partial<{
    email: string
    first_name: string
    last_name: string
    role: string
  }>): Promise<User> {
    try {
      const response = await apiClient.put<User>(`/api/v1/admin/users/${userId}`, userData)
      return response.data
    } catch (error) {
      console.error(`Failed to update user ${userId}:`, error)
      throw error
    }
  },

  async deleteUser(userId: number): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/admin/users/${userId}`)
    } catch (error) {
      console.error(`Failed to delete user ${userId}:`, error)
      throw error
    }
  },

  async listUsers(params?: {
    page?: number
    per_page?: number
    role?: string
  }): Promise<{ items: User[], total: number }> {
    try {
      const response = await apiClient.get<{ items: User[], total: number }>(
        '/api/v1/admin/users',
        { params }
      )
      return response.data
    } catch (error) {
      console.error('Failed to list users:', error)
      throw error
    }
  },
}
```

**Step 3: Create adminService for task types and statistics**

Create new file `/Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/services/adminService.ts`:

```typescript
import apiClient from '@/lib/api/client'
import type { ClientType } from '@/types/api'

export interface TaskTypeData {
  client_id: number
  modality: string
  body_area: string
  has_priors: boolean
  expected_tat_hours: number
  price: number
  physician_payout: number
}

export interface ScheduleData {
  days: string[]
  hours: { start: string, end: string }
  custom_schedule?: Record<string, number[]>
}

export interface SLAMetrics {
  total_tasks: number
  on_time: number
  late: number
  average_completion_time: number
  by_urgency: Record<string, { total: number, on_time: number, late: number }>
}

export interface WorkforceMetrics {
  total_physicians: number
  active_physicians: number
  available_capacity: number
  current_workload: number
  by_role: Record<string, { total: number, active: number, capacity: number }>
}

export const adminService = {
  // Task Types Management
  async listTaskTypes(params?: {
    page?: number
    per_page?: number
  }): Promise<{ items: ClientType[], total: number }> {
    try {
      const response = await apiClient.get<{ items: ClientType[], total: number }>(
        '/api/v1/admin/types',
        { params }
      )
      return response.data
    } catch (error) {
      console.error('Failed to list task types:', error)
      throw error
    }
  },

  async createTaskType(data: TaskTypeData): Promise<ClientType> {
    try {
      const response = await apiClient.post<ClientType>('/api/v1/admin/types', data)
      return response.data
    } catch (error) {
      console.error('Failed to create task type:', error)
      throw error
    }
  },

  async updateTaskType(typeId: number, data: Partial<TaskTypeData>): Promise<ClientType> {
    try {
      const response = await apiClient.put<ClientType>(`/api/v1/admin/types/${typeId}`, data)
      return response.data
    } catch (error) {
      console.error(`Failed to update task type ${typeId}:`, error)
      throw error
    }
  },

  async deleteTaskType(typeId: number): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/admin/types/${typeId}`)
    } catch (error) {
      console.error(`Failed to delete task type ${typeId}:`, error)
      throw error
    }
  },

  // Schedule Management
  async getUserSchedule(userId: number): Promise<ScheduleData> {
    try {
      const response = await apiClient.get<ScheduleData>(`/api/v1/admin/users/${userId}/schedule`)
      return response.data
    } catch (error) {
      console.error(`Failed to get schedule for user ${userId}:`, error)
      throw error
    }
  },

  async updateUserSchedule(userId: number, schedule: ScheduleData): Promise<ScheduleData> {
    try {
      const response = await apiClient.put<ScheduleData>(
        `/api/v1/admin/users/${userId}/schedule`,
        schedule
      )
      return response.data
    } catch (error) {
      console.error(`Failed to update schedule for user ${userId}:`, error)
      throw error
    }
  },

  // Statistics & Analytics
  async getSLAMetrics(params?: {
    start_date?: string
    end_date?: string
  }): Promise<SLAMetrics> {
    try {
      const response = await apiClient.get<SLAMetrics>(
        '/api/v1/admin/statistics/sla',
        { params }
      )
      return response.data
    } catch (error) {
      console.error('Failed to get SLA metrics:', error)
      throw error
    }
  },

  async getWorkforceMetrics(): Promise<WorkforceMetrics> {
    try {
      const response = await apiClient.get<WorkforceMetrics>('/api/v1/admin/statistics/workforce')
      return response.data
    } catch (error) {
      console.error('Failed to get workforce metrics:', error)
      throw error
    }
  },
}
```

---

## Task 6: Update Pages to Use New Services

**Files:**
- Modify: `/Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/pages/admin/UserManagementPage.vue`
- Modify: `/Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/pages/admin/TaskTypesPage.vue`
- Modify: `/Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/pages/admin/SLADashboardPage.vue`
- Modify: `/Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/pages/admin/WorkforceCapacityPage.vue`
- Modify: `/Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/pages/admin/PhysicianSchedulePage.vue`

**Step 1: Update UserManagementPage**

Ensure it uses `userService.listUsers()`, `userService.createUser()`, `userService.updateUser()`, `userService.deleteUser()`.

**Step 2: Update TaskTypesPage**

Ensure it uses `adminService.listTaskTypes()`, `adminService.createTaskType()`, `adminService.updateTaskType()`, `adminService.deleteTaskType()`.

**Step 3: Update SLADashboardPage**

Ensure it uses `adminService.getSLAMetrics()`.

**Step 4: Update WorkforceCapacityPage**

Ensure it uses `adminService.getWorkforceMetrics()`.

**Step 5: Update PhysicianSchedulePage**

Ensure it uses `adminService.getUserSchedule()` and `adminService.updateUserSchedule()`.

---

## Task 7: Delete Mock Data File

**Files:**
- Delete: `/Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/data/mockData.ts`

**Step 1: Verify no remaining imports**

Run grep to check for any remaining references:

```bash
grep -r "mockData" src/
```

**Step 2: Delete the file**

Only delete if no references remain:

```bash
rm /Users/suslicke/Documents/Programming/WORK/reporting-platform-ui/src/data/mockData.ts
```

**Step 3: Verify app still builds**

Run build command:

```bash
npm run build
```

Expected: Build succeeds with no errors.

---

## Task 8: Testing with Chrome DevTools MCP

**Files:**
- N/A (testing phase)

**Step 1: Start development server**

```bash
npm run dev
```

**Step 2: Test authentication flow with Chrome DevTools MCP**

Use `mcp__chrome-devtools__navigate_page` to navigate to the app, then:

1. Navigate to `http://localhost:5173/studies` (or your dev URL)
2. Verify redirect to `/login?redirect=/studies`
3. Take snapshot of login page
4. Fill login form with test credentials
5. Submit and verify redirect to `/studies`
6. Check network requests for auth token in headers

**Step 3: Test role-based access**

For each role (admin, reporting-radiologist, validating-radiologist):
1. Login with that role
2. Attempt to access various routes
3. Verify access control works correctly
4. Check network tab for proper API calls

**Step 4: Test queue pages**

1. Navigate to `/queue`
2. Verify API call to `/api/v1/tasks?queue=reporting`
3. Take task action
4. Verify POST request to `/api/v1/tasks/:id/take`

**Step 5: Test admin pages**

1. Navigate to each admin page
2. Verify correct API endpoints are called
3. Test CRUD operations
4. Verify network requests and responses

**Step 6: Test error scenarios**

1. Try invalid login credentials
2. Force network error (disconnect)
3. Try accessing unauthorized route
4. Verify error handling works correctly

---

## Task 9: Final Verification

**Files:**
- N/A (verification phase)

**Step 1: Check for console errors**

Use Chrome DevTools MCP to check console:

```
mcp__chrome-devtools__list_console_messages
```

Expected: No errors during normal operation.

**Step 2: Verify all pages load data from API**

Navigate to each page and verify:
- Loading states appear during fetch
- Data displays after loading
- No mock data is shown
- Network tab shows API calls

**Step 3: Verify authentication persistence**

1. Login
2. Refresh page
3. Verify still authenticated
4. Verify token in localStorage
5. Verify API calls include auth header

**Step 4: Verify logout**

1. Logout
2. Verify redirect to login
3. Verify localStorage cleared
4. Verify unable to access protected routes

---

## Success Criteria

- ✅ Login page created and functional
- ✅ Navigation guards protect all routes
- ✅ Role-based access control working
- ✅ All mock data removed from codebase
- ✅ All pages use real API exclusively
- ✅ Loading states visible during API calls
- ✅ Error handling displays proper messages
- ✅ Chrome DevTools MCP shows expected API calls
- ✅ No console errors during operation
- ✅ Authentication persists across page refreshes
- ✅ Logout clears session properly

---

## Notes

- No git operations per user request
- Test continuously with Chrome DevTools MCP
- Add loading states to all pages
- Ensure error messages are user-friendly
- Backend API is fully ready and working
