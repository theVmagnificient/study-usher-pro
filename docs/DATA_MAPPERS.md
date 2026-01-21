# Data Mappers Documentation

## Overview

Data mappers transform backend relational data into denormalized frontend formats. They bridge the gap between:
- **Backend:** Normalized relational data (Task → Study → ClientType → Client → User)
- **Frontend:** Denormalized view objects (Study with all data embedded)

---

## Why Mappers?

### The Problem

**Backend Data (Relational):**
```typescript
Task {
  id: 1,
  study_id: 10,
  status: "in_progress",
  reporting_radiologist_id: 5
}

Study {
  id: 10,
  client_id: 2,
  client_type_id: 3,
  patient_id: "PAT-123"
}

ClientType {
  id: 3,
  modality: "CT",
  body_area: "CHEST"
}

Client {
  id: 2,
  name: "City Hospital"
}

User {
  id: 5,
  first_name: "John",
  last_name: "Doe"
}
```

**Frontend Needs (Denormalized):**
```typescript
Study {
  id: "STD-010",
  patientId: "PAT-123",
  clientName: "City Hospital",
  status: "in-progress",
  modality: "CT",
  bodyArea: "Chest",
  assignedPhysician: "Dr. John Doe",
  // ... all data in one object
}
```

### The Solution

Mappers fetch related data and merge it into flat frontend objects.

---

## Available Mappers

1. **taskMapper** - Task + Study + ClientType → Frontend Study
2. **userMapper** - User + Profile + Schedule → Frontend Physician
3. **clientTypeMapper** - ClientType + Client → Frontend TaskType
4. **auditMapper** - TaskEvent → Frontend AuditLogEntry
5. **reportMapper** - Report submission helpers

---

## 1. Task Mapper

**File:** `src/lib/mappers/taskMapper.ts`

### `mapTaskToStudy(context)`

Transforms backend task/study data into frontend Study format.

**Input:**
```typescript
interface TaskToStudyContext {
  task: Task
  study: BackendStudy
  clientType: ClientType
  client: Client
  reportingUser?: User
  validatingUser?: User
}
```

**Output:**
```typescript
Study // Frontend format
```

**Example:**
```typescript
import { mapTaskToStudy } from '@/lib/mappers/taskMapper'

const frontendStudy = mapTaskToStudy({
  task: backendTask,
  study: backendStudy,
  clientType: clientType,
  client: client,
  reportingUser: user,
})

console.log(frontendStudy.id) // "STD-010" (formatted)
console.log(frontendStudy.clientName) // "City Hospital" (resolved)
console.log(frontendStudy.assignedPhysician) // "Dr. John Doe" (formatted)
```

### Transformations

| Backend | Frontend | Transformation |
|---------|----------|----------------|
| `study.id: 10` | `id: "STD-010"` | Formatted with prefix + padding |
| `study.patient_id` | `patientId` | Direct copy (snake → camel) |
| `client.name` | `clientName` | Resolved from `client_id` |
| `task.status: "in_progress"` | `status: "in-progress"` | Lowercase + hyphens |
| `task.urgency: "stat"` | `urgency: "stat"` | Lowercase |
| `clientType.modality: "CT"` | `modality: "CT"` | Direct copy |
| `clientType.body_area: "CHEST"` | `bodyArea: "Chest"` | Title case |
| `reporting_radiologist_id: 5` | `assignedPhysician: "Dr. John Doe"` | Resolved + formatted |
| `study.study_datetime` | `receivedAt` | Direct copy (ISO string) |
| `study_datetime + TAT` | `deadline` | Calculated |

### Status Mapping

```typescript
const statusMap = {
  'integrity_validation': 'new',
  'new': 'new',
  'assigned': 'assigned',
  'in_progress': 'in-progress',
  'draft_ready': 'draft-ready',
  'translated': 'draft-ready',
  'assigned_for_validation': 'under-validation',
  'under_validation': 'under-validation',
  'returned_for_revision': 'returned',
  'finalized': 'finalized',
  'delivered': 'delivered',
}
```

---

## 2. User Mapper

**File:** `src/lib/mappers/userMapper.ts`

### `mapUserToPhysician(context)`

Transforms backend user data into frontend Physician format.

**Input:**
```typescript
interface UserToPhysicianContext {
  user: User
  profile?: UserProfile
  scheduleSlots?: ScheduleSlot[]
  activeTasks?: number
}
```

**Output:**
```typescript
Physician // Frontend format
```

**Example:**
```typescript
import { mapUserToPhysician } from '@/lib/mappers/userMapper'

const physician = mapUserToPhysician({
  user: backendUser,
  profile: userProfile,
  scheduleSlots: slots,
  activeTasks: 5,
})

console.log(physician.id) // "PHY-005"
console.log(physician.fullName) // "Dr. John Doe"
console.log(physician.role) // "reporting-radiologist"
console.log(physician.schedule) // Derived from slots
```

### Schedule Derivation

Converts array of `ScheduleSlot` into:

```typescript
schedule: {
  days: ["Monday", "Tuesday", "Wednesday"],
  hours: { start: "08:00", end: "17:00" }
}

customSchedule: {
  "2024-01-15": [8, 9, 10, 11, 12, 13, 14, 15, 16],
  "2024-01-16": [8, 9, 10, 11],
  // ...
}
```

### Placeholder Fields

Some frontend fields are not yet in backend (documented with TODO):

```typescript
{
  phone: "placeholder",                          // TODO: Backend needs phone field
  telegram: "placeholder",                        // TODO: Backend needs telegram field
  supportedModalities: [],                        // TODO: Backend needs supported_modalities
  supportedBodyAreas: [],                         // TODO: Backend needs supported_body_areas
  maxActiveStudies: 10,                          // TODO: Backend needs max_active_studies
  statistics: { total: 0, byModality: {}, ... }  // TODO: Backend needs statistics aggregation
}
```

---

## 3. Client Type Mapper

**File:** `src/lib/mappers/clientTypeMapper.ts`

### `mapClientTypeToTaskType(context)`

Transforms ClientType into frontend TaskType.

**Input:**
```typescript
interface ClientTypeToTaskTypeContext {
  clientType: ClientType
  client: Client
}
```

**Output:**
```typescript
TaskType // Frontend format
```

**Example:**
```typescript
const taskType = mapClientTypeToTaskType({
  clientType: backendClientType,
  client: client,
})

console.log(taskType.id) // "CT-003"
console.log(taskType.client) // "City Hospital"
console.log(taskType.modality) // "CT"
console.log(taskType.bodyArea) // "Chest"
console.log(taskType.expectedTAT) // 4 (hours)
console.log(taskType.price) // 150
console.log(taskType.physicianPayout) // 75
```

---

## 4. Audit Mapper

**File:** `src/lib/mappers/auditMapper.ts`

### `mapTaskEventToAuditEntry(context)`

Transforms task event into audit log entry.

**Input:**
```typescript
interface TaskEventToAuditContext {
  taskEvent: TaskEvent
  user?: User
}
```

**Output:**
```typescript
AuditLogEntry // Frontend format
```

**Example:**
```typescript
const auditEntry = mapTaskEventToAuditEntry({
  taskEvent: event,
  user: user,
})

console.log(auditEntry.id) // "LOG-001"
console.log(auditEntry.studyId) // "STD-010"
console.log(auditEntry.action) // "Status Change"
console.log(auditEntry.user) // "Dr. John Doe"
console.log(auditEntry.previousStatus) // "assigned"
console.log(auditEntry.newStatus) // "in-progress"
console.log(auditEntry.comment) // "Started working"
```

---

## 5. Utility Functions

**File:** `src/lib/mappers/utils.ts`

### ID Formatting

```typescript
// Format study ID with padding
formatStudyId(1)    // → "STD-001"
formatStudyId(100)  // → "STD-100"
formatStudyId(1234) // → "STD-1234"

// Parse study ID back to number
parseStudyId("STD-001")  // → 1
parseStudyId("STD-100")  // → 100

// Format user ID
formatUserId(5)    // → "PHY-005"
parseUserId("PHY-005") // → 5
```

### Body Area Formatting

```typescript
// Convert UPPERCASE to Title Case
formatBodyArea("CHEST")   // → "Chest"
formatBodyArea("ABDOMEN") // → "Abdomen"
formatBodyArea("HEAD")    // → "Head"
```

### Deadline Calculation

```typescript
// Add TAT hours to received time
const received = "2024-01-15T08:00:00Z"
const tat = 4

const deadline = calculateDeadline(received, tat)
// → "2024-01-15T12:00:00Z"
```

### Case Conversion

```typescript
// Snake case to camel case
snakeToCamelCase("expected_tat_hours") // → "expectedTatHours"
snakeToCamelCase("patient_id")         // → "patientId"
```

---

## Mapper Patterns

### 1. Lazy vs Eager Loading

**Eager Loading (Current):**
```typescript
// Fetch all related data upfront
const study = mapTaskToStudy({
  task,
  study,
  clientType,  // Already fetched
  client,      // Already fetched
  reportingUser, // Already fetched
})
```

**Lazy Loading (Alternative):**
```typescript
// Fetch related data on-demand
const study = await mapTaskToStudyLazy({
  task,
  study,
  // Mapper fetches clientType/client/user internally
})
```

**We use eager loading** because:
- More control over when fetches happen
- Better for caching (can batch lookups)
- Explicit dependencies

---

### 2. Bidirectional Mapping

Some mappers support bidirectional transformation:

```typescript
// Frontend → Backend (for API submissions)
const backendReport = mapFrontendReportToBackend(frontendReport)

// Backend → Frontend (for display)
const frontendReport = mapBackendReportToFrontend(backendReport)
```

---

### 3. Null Handling

Mappers handle missing data gracefully:

```typescript
// If user is not assigned
mapTaskToStudy({ ..., reportingUser: undefined })
// → study.assignedPhysician = undefined (not null, not "")

// If profile is missing
mapUserToPhysician({ user, profile: undefined })
// → uses defaults for profile fields
```

---

## Testing Mappers

Mappers are pure functions, making them easy to test:

```typescript
import { describe, it, expect } from 'vitest'
import { formatStudyId } from '@/lib/mappers/utils'

describe('formatStudyId', () => {
  it('should format with padding', () => {
    expect(formatStudyId(1)).toBe('STD-001')
    expect(formatStudyId(100)).toBe('STD-100')
  })
})
```

See `tests/unit/mappers/` for full test examples.

---

## Performance Considerations

### 1. Caching

Related entities (users, clients, client types) are cached to avoid redundant lookups:

```typescript
// First study - fetches user from API
const study1 = mapTaskToStudy({ ..., reportingUser: await fetchUser(5) })

// Second study with same user - uses cache
const study2 = mapTaskToStudy({ ..., reportingUser: await fetchUser(5) })
```

### 2. Batch Processing

When mapping multiple studies, fetch related data in batches:

```typescript
// Collect all unique user IDs
const userIds = new Set(tasks.map(t => t.reporting_radiologist_id))

// Fetch all users at once
const users = await fetchUsersBatch(Array.from(userIds))

// Map studies with pre-fetched users
const studies = tasks.map(task => mapTaskToStudy({
  task,
  study,
  ...,
  reportingUser: users.find(u => u.id === task.reporting_radiologist_id)
}))
```

---

## Common Issues

### Issue: "Cannot read property 'name' of undefined"

**Cause:** Missing related entity (e.g., client not fetched)
**Fix:** Ensure all required context is provided:

```typescript
// ❌ Missing client
mapTaskToStudy({ task, study, clientType })

// ✅ All required data
mapTaskToStudy({ task, study, clientType, client })
```

---

### Issue: Wrong status displayed

**Cause:** Status mapping mismatch
**Fix:** Check `statusMap` in taskMapper matches backend values

---

### Issue: IDs not formatted

**Cause:** Using raw backend IDs
**Fix:** Use mapper, not raw backend data:

```typescript
// ❌ Direct use
<div>{{ backendStudy.id }}</div> // Shows: 10

// ✅ Use mapped data
<div>{{ study.id }}</div> // Shows: STD-010
```

---

## Best Practices

### 1. Always Use Mappers

Never use backend data directly in components:

```vue
<!-- ❌ BAD -->
<template>
  <div>{{ backendStudy.patient_id }}</div>
</template>

<!-- ✅ GOOD -->
<template>
  <div>{{ study.patientId }}</div>
</template>
```

---

### 2. Type Safety

Use TypeScript interfaces for mapper inputs and outputs:

```typescript
// ✅ Type-safe
function mapTaskToStudy(ctx: TaskToStudyContext): Study {
  // TypeScript ensures all required fields present
}

// ❌ Not type-safe
function mapTaskToStudy(ctx: any): any {
  // No compile-time checks
}
```

---

### 3. Document Placeholder Fields

When frontend expects a field not yet in backend, document it:

```typescript
{
  hasPriors: false, // TODO: Backend needs prior_count field
  phone: "placeholder", // TODO: Backend needs phone field
}
```

---

## Migration Notes

When backend schema changes:

1. **Update types** in `src/types/api.ts`
2. **Update mappers** to use new fields
3. **Update tests** to reflect changes
4. **Remove placeholders** when backend implements missing fields

**Example:**
```typescript
// Before (placeholder)
phone: "placeholder",

// After (backend implements phone)
phone: user.phone || "Not provided",
```

---

## See Also

- [API Services Documentation](./API_SERVICES.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
