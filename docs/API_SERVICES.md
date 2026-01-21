# API Services Documentation

## Overview

The API services layer provides a clean interface between the Vue frontend and the FastAPI backend. Each service handles:
- API endpoint communication
- Data transformation (via mappers)
- Lookup caching for performance
- Error handling

---

## Architecture

```
Vue Components
      ↓
  Pinia Stores
      ↓
  API Services  ← You are here
      ↓
Data Mappers + HTTP Client
      ↓
Backend API
```

---

## Available Services

1. **studyService** - Study and task management (admin)
2. **taskService** - Task workflow for physicians
3. **userService** - User and profile management
4. **clientTypeService** - Client type (task type) CRUD
5. **auditService** - Audit logs and statistics

---

## 1. Study Service

**File:** `src/services/studyService.ts`

### Methods

#### `getAll(filters, page, perPage)`

Fetch paginated list of studies with filters.

**Parameters:**
```typescript
filters: StudyFilters = {
  status?: StudyStatus
  client?: string
  modality?: Modality
  dateFrom?: Date
  dateTo?: Date
}
page: number = 1
perPage: number = 20
```

**Returns:**
```typescript
Promise<PaginatedResult<Study>>
```

**Example:**
```typescript
import { studyService } from '@/services/studyService'

const result = await studyService.getAll(
  { status: 'in-progress', modality: 'CT' },
  1,
  20
)

console.log(result.items) // Study[]
console.log(result.total) // Total count
console.log(result.page)  // Current page
```

**Backend Endpoint:** `GET /api/v1/admin/studies`

**Data Flow:**
1. Fetches backend studies
2. For each study:
   - Fetches related task
   - Fetches client type (cached)
   - Fetches client (cached)
   - Fetches assigned user (cached)
3. Transforms via `mapTaskToStudy`
4. Returns frontend-format studies

---

#### `getById(id)`

Fetch single study by ID.

**Parameters:**
```typescript
id: string // Frontend ID (e.g., "STD-001")
```

**Returns:**
```typescript
Promise<Study>
```

**Example:**
```typescript
const study = await studyService.getById('STD-001')
console.log(study.patientId)
console.log(study.clientName)
```

**Backend Endpoint:** `GET /api/v1/admin/studies/{id}`

---

#### `triggerProcessing(id)`

Trigger DICOM processing for a study.

**Parameters:**
```typescript
id: string // Frontend ID
```

**Returns:**
```typescript
Promise<void>
```

**Example:**
```typescript
await studyService.triggerProcessing('STD-001')
```

**Backend Endpoint:** `POST /api/v1/admin/studies/{id}/process`

---

## 2. Task Service

**File:** `src/services/taskService.ts`

### Methods

#### `getMyTasks(queue, userId)`

Fetch tasks assigned to a user.

**Parameters:**
```typescript
queue: 'reporting' | 'validation'
userId: number
```

**Returns:**
```typescript
Promise<Study[]>
```

**Example:**
```typescript
// Get reporting tasks
const reportingTasks = await taskService.getMyTasks('reporting', 5)

// Get validation tasks
const validationTasks = await taskService.getMyTasks('validation', 5)
```

**Backend Endpoints:**
- Reporting: `GET /api/v1/user/tasks/reporting`
- Validation: `GET /api/v1/user/tasks/validation`

---

#### `takeTask(taskId, userId)`

Assign a task to the current user.

**Parameters:**
```typescript
taskId: number // Backend task ID
userId: number
```

**Returns:**
```typescript
Promise<void>
```

**Example:**
```typescript
await taskService.takeTask(123, 5)
```

**Backend Endpoint:** `POST /api/v1/user/tasks/{taskId}/take`

---

#### `startTask(taskId, userId)`

Start working on a task (changes status to "in_progress").

**Parameters:**
```typescript
taskId: number
userId: number
```

**Returns:**
```typescript
Promise<void>
```

**Example:**
```typescript
await taskService.startTask(123, 5)
```

**Backend Endpoint:** `POST /api/v1/user/tasks/{taskId}/start`

---

#### `submitReport(taskId, report, userId)`

Submit a report draft for validation.

**Parameters:**
```typescript
taskId: number
report: ReportSubmitData = {
  protocol: string
  findings: string
  impression: string
}
userId: number
```

**Returns:**
```typescript
Promise<void>
```

**Example:**
```typescript
await taskService.submitReport(123, {
  protocol: 'CT chest with contrast',
  findings: 'Clear lungs...',
  impression: 'No acute findings'
}, 5)
```

**Backend Endpoint:** `POST /api/v1/user/tasks/{taskId}/submit`

---

#### `finalizeTask(taskId, userId)`

Finalize a validated task.

**Parameters:**
```typescript
taskId: number
userId: number
```

**Returns:**
```typescript
Promise<void>
```

**Backend Endpoint:** `POST /api/v1/user/tasks/{taskId}/finalize`

---

#### `returnForRevision(taskId, comment, userId)`

Return a task for revision with comments.

**Parameters:**
```typescript
taskId: number
comment: string
userId: number
```

**Returns:**
```typescript
Promise<void>
```

**Backend Endpoint:** `POST /api/v1/user/tasks/{taskId}/return`

---

## 3. User Service

**File:** `src/services/userService.ts`

### Methods

#### `getAll(page, perPage)`

Fetch all users.

**Returns:**
```typescript
Promise<PaginatedResult<Physician>>
```

**Backend Endpoint:** `GET /api/v1/admin/users`

---

#### `getById(id)`

Fetch single user by ID.

**Parameters:**
```typescript
id: number // Backend user ID
```

**Returns:**
```typescript
Promise<Physician>
```

**Backend Endpoint:** `GET /api/v1/admin/users/{id}`

---

#### `create(data)`

Create new user.

**Parameters:**
```typescript
data: UserCreateData = {
  first_name: string
  last_name: string
  email: string
  specialization?: string
  role?: string
}
```

**Returns:**
```typescript
Promise<Physician>
```

**Backend Endpoint:** `POST /api/v1/admin/users`

---

#### `update(id, data)`

Update existing user.

**Backend Endpoint:** `PUT /api/v1/admin/users/{id}`

---

#### `delete(id)`

Delete user.

**Backend Endpoint:** `DELETE /api/v1/admin/users/{id}`

---

#### `getProfile(userId)`

Get user profile with schedule.

**Backend Endpoint:** `GET /api/v1/user/profile`

---

#### `updateProfile(userId, data)`

Update user profile.

**Backend Endpoint:** `PUT /api/v1/user/profile`

---

#### `getSchedule(userId, dateRange)`

Get schedule slots for date range.

**Backend Endpoint:** `GET /api/v1/user/schedule`

---

#### `createScheduleSlot(userId, slot)`

Create new schedule slot.

**Backend Endpoint:** `POST /api/v1/user/schedule`

---

#### `deleteScheduleSlot(userId, slotId)`

Delete schedule slot.

**Backend Endpoint:** `DELETE /api/v1/user/schedule/{slotId}`

---

## 4. Client Type Service

**File:** `src/services/clientTypeService.ts`

### Methods

#### `getAll(filters, page, perPage)`

Fetch all client types (task types).

**Returns:**
```typescript
Promise<PaginatedResult<TaskType>>
```

**Backend Endpoint:** `GET /api/v1/admin/client-types`

---

#### `getById(id)`

Fetch single client type.

**Backend Endpoint:** `GET /api/v1/admin/client-types/{id}`

---

#### `create(data)`

Create new client type.

**Backend Endpoint:** `POST /api/v1/admin/client-types`

---

#### `update(id, data)`

Update client type.

**Backend Endpoint:** `PUT /api/v1/admin/client-types/{id}`

---

#### `delete(id)`

Delete client type.

**Backend Endpoint:** `DELETE /api/v1/admin/client-types/{id}`

---

## 5. Audit Service

**File:** `src/services/auditService.ts`

### Methods

#### `getAuditLog(filters, page, perPage)`

Fetch audit log entries.

**Returns:**
```typescript
Promise<PaginatedResult<AuditLogEntry>>
```

**Backend Endpoint:** `GET /api/v1/admin/audit`

---

#### `getStudyAuditLog(studyId)`

Fetch audit log for specific study.

**Backend Endpoint:** `GET /api/v1/admin/audit?study_id={studyId}`

---

#### `getWorkforceStats(dateRange)`

Fetch workforce capacity statistics.

**Returns:**
```typescript
Promise<WorkforceStats>
```

**Backend Endpoint:** `GET /api/v1/admin/stats/workforce`

---

#### `getSLAStats(dateRange, clientId)`

Fetch SLA compliance statistics.

**Returns:**
```typescript
Promise<SLAStats>
```

**Backend Endpoint:** `GET /api/v1/admin/stats/sla`

---

## Performance Optimizations

### 1. Lookup Caching

Frequently accessed data (users, clients, client types) is cached for 5 minutes to reduce API calls.

**Example:**
```typescript
// First call - fetches from API
const user = await userService.getById(5)

// Second call within 5 minutes - returns from cache
const userAgain = await userService.getById(5) // No API call!
```

**Cache Methods:**
```typescript
import { lookupCache } from '@/lib/cache/lookupCache'

// Manual cache operations
lookupCache.setUser(user)
lookupCache.getUser(id)
lookupCache.clearUsers()
lookupCache.clearAll()

// Get cache statistics
const stats = lookupCache.getStats()
console.log(stats) // { users: 10, clients: 5, clientTypes: 8 }
```

---

### 2. Request Deduplication

Prevents duplicate simultaneous requests.

**Example:**
```typescript
// Component A calls studyService.getAll()
// Component B calls studyService.getAll() at same time
// → Only ONE API call is made, both components get same result
```

**Automatic** - no configuration needed.

---

### 3. Automatic Retries

Failed GET requests are automatically retried (max 3 attempts) with exponential backoff.

**Retry Conditions:**
- Network errors
- Timeout errors
- Status codes: 408, 429, 500, 502, 503, 504

**Example:**
```typescript
// Network flickers during request
// → Automatically retries after 1s
// → If fails, retries after 2s
// → If fails, retries after 4s
// → If still fails, returns error to user
```

---

## Error Handling

All services return structured errors via `ApiError`:

```typescript
interface ApiError {
  type: ApiErrorType
  message: string
  statusCode?: number
  details?: any
}

enum ApiErrorType {
  NETWORK = 'NETWORK',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}
```

**Example:**
```typescript
try {
  const studies = await studyService.getAll()
} catch (error) {
  const apiError = error as ApiError

  if (apiError.type === ApiErrorType.NETWORK) {
    console.log('Network issue:', apiError.message)
  }
}
```

---

## Best Practices

### 1. Always Use Services from Stores

❌ **Don't do this:**
```vue
<script setup>
import { studyService } from '@/services/studyService'

const studies = await studyService.getAll() // NO!
</script>
```

✅ **Do this:**
```vue
<script setup>
import { useStudyStore } from '@/stores/studyStore'

const studyStore = useStudyStore()
await studyStore.fetchStudies() // YES!
</script>
```

---

### 2. Handle Loading and Error States

```vue
<template>
  <div v-if="studyStore.loading">Loading...</div>
  <div v-else-if="studyStore.error">{{ studyStore.error }}</div>
  <div v-else>{{ studyStore.studies }}</div>
</template>
```

---

### 3. Use Filters Effectively

```typescript
// Good - specific filters
await studyService.getAll({
  status: 'in-progress',
  modality: 'CT',
  dateFrom: startOfWeek(new Date())
})

// Bad - fetching everything then filtering client-side
const all = await studyService.getAll()
const filtered = all.items.filter(s => s.status === 'in-progress')
```

---

## Troubleshooting

### "Network error. Please check your connection."

**Cause:** Backend not running or wrong BASE_URL
**Fix:**
1. Check backend is running: `http://localhost:8000/docs`
2. Verify `.env.development` has correct `VITE_API_BASE_URL`

---

### "Request timed out."

**Cause:** Backend taking > 30 seconds to respond
**Fix:**
1. Check backend performance
2. Increase timeout in `src/lib/api/client.ts`

---

### Cached data is stale

**Cause:** Cache TTL (5 minutes) hasn't expired
**Fix:**
```typescript
import { lookupCache } from '@/lib/cache/lookupCache'

// Clear specific cache
lookupCache.clearUsers()

// Or clear everything
lookupCache.clearAll()
```

---

## See Also

- [Data Mappers Documentation](./DATA_MAPPERS.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)
