# Frontend API Integration & Authentication Design

**Date:** 2026-01-21
**Status:** Approved
**Project:** Reporting Platform UI

## Overview

Complete migration from mock data to real API integration with authentication and role-based access control. The backend API is fully ready; this focuses purely on frontend integration.

## Goals

1. Implement login page and authentication flow
2. Add route guards with role-based access control
3. Remove all mock data from the application
4. Ensure all pages use real API calls exclusively
5. Test integration with Chrome DevTools MCP

## Authentication Architecture

### Core Flow

1. User attempts to access any route
2. Navigation guard intercepts request
3. If not authenticated → redirect to `/login?redirect=<original-path>`
4. User logs in → `authStore.login()` calls `/api/v1/auth/login`
5. On success:
   - Token saved to localStorage
   - User redirected to original path (if permitted) or role default
6. Axios interceptor adds token to all subsequent requests

### Role-Based Access Control

**Three User Roles:**
- Admin
- Reporting Radiologist
- Validating Radiologist

**Route Permissions:**

| Route | Admin | Reporting | Validating |
|-------|-------|-----------|------------|
| /studies | ✓ | | |
| /study/:id | ✓ | | |
| /task-types | ✓ | | |
| /users | ✓ | | |
| /schedule/:id | ✓ | | |
| /audit | ✓ | | |
| /sla | ✓ | | |
| /workforce | ✓ | | |
| /queue | ✓ | ✓ | |
| /validation | ✓ | | ✓ |
| /profile | ✓ | ✓ | ✓ |
| /report/:id | ✓ | ✓ | ✓ |

**Default Landing Pages:**
- Admin → `/studies`
- Reporting Radiologist → `/queue`
- Validating Radiologist → `/validation`

### Route Guard Implementation

Global `beforeEach` navigation guard checks:
1. Authentication status via `authStore.isAuthenticated`
2. User role against route metadata `allowedRoles`
3. Redirects:
   - Not authenticated → `/login?redirect=<path>`
   - Insufficient permissions → `/403` or role default page
   - Success → proceed to route

## Login Page Design

**Component:** `/src/pages/LoginPage.vue`

**Layout:**
- Minimal centered card design
- Email input field
- Password input field
- Login button
- Error message display area
- Loading state during authentication

**Behavior:**
- Form validation before submission
- Calls `authStore.login(email, password)`
- Shows loading spinner during API call
- Displays error messages from authStore
- Redirects on success to saved path or role default

## Mock Data Removal Strategy

### Complete Removal (Big Bang Approach)

**Phase 1: Identify Dependencies**
- Scan all files importing `@/data/mockData.ts`
- List all stores with mock fallbacks
- List all pages with mock references

**Phase 2: Update Stores**
Remove mock data fallbacks from:
- `studyStore.ts`
- `taskStore.ts`
- `userStore.ts`
- `auditStore.ts`
- `clientTypeStore.ts`

Ensure all methods use only API calls from services.

**Phase 3: Update Pages**
Remove mock data imports and references from:
- Admin pages: StudyListPage, StudyDetailPage, TaskTypesPage, UserManagementPage, PhysicianSchedulePage, AuditLogPage, SLADashboardPage, WorkforceCapacityPage
- Physician pages: PhysicianQueuePage, ValidationQueuePage, PhysicianProfilePage
- ReportingPage

Ensure all pages use stores exclusively for data.

**Phase 4: Delete Mock File**
- Remove `/src/data/mockData.ts`
- Verify no import errors remain

## API Integration Points

### Existing Services (Already Implemented)

These services already call real API endpoints:
- ✅ `taskService.ts` - tasks, reports, validation workflows
- ✅ `studyService.ts` - studies CRUD
- ✅ `authStore.ts` - authentication
- ✅ `auditService.ts` - audit logs
- ✅ `clientTypeService.ts` - client types lookup
- ✅ `userService.ts` - user operations

### Service Methods to Add

**User Management:**
- `POST /api/v1/admin/users` - create user
- `PUT /api/v1/admin/users/:id` - update user
- `DELETE /api/v1/admin/users/:id` - delete user
- `GET /api/v1/admin/users` - list users with pagination

**Task Types Management:**
- `POST /api/v1/admin/types` - create task type
- `PUT /api/v1/admin/types/:id` - update task type
- `DELETE /api/v1/admin/types/:id` - delete task type
- `GET /api/v1/admin/types` - list task types

**Schedule Management:**
- `GET /api/v1/admin/users/:id/schedule` - get physician schedule
- `PUT /api/v1/admin/users/:id/schedule` - update schedule

**Statistics & Analytics:**
- `GET /api/v1/admin/statistics/sla` - SLA dashboard data
- `GET /api/v1/admin/statistics/workforce` - workforce capacity data

## Error Handling & Loading States

### Global Error Handling

Already implemented in `/src/lib/api/client.ts`:
- Network errors show user-friendly messages
- 401 responses auto-clear auth and redirect to login
- Retry logic for transient failures
- Offline detection

### Component-Level Requirements

Each page component must:
- Show loading spinners during API calls
- Display error messages via toast notifications
- Handle empty states (no data returned)
- Disable actions during loading
- Show meaningful error context to users

## Testing Strategy

### Chrome DevTools MCP Testing

Test each section systematically:

**1. Authentication Flow**
- Navigate to protected route while logged out
- Verify redirect to `/login?redirect=<path>`
- Enter valid credentials
- Verify token stored in localStorage
- Verify redirect to original path
- Check Authorization header on subsequent requests

**2. Role-Based Access**
- Login as Admin → verify access to all routes
- Login as Reporting Radiologist → verify access only to queue, profile, report
- Login as Validating Radiologist → verify access only to validation, profile, report
- Attempt unauthorized access → verify redirect/403

**3. Queue Pages**
- Load reporting queue → verify `/api/v1/tasks?queue=reporting` call
- Load validation queue → verify `/api/v1/tasks?queue=validation` call
- Take task → verify POST to `/api/v1/tasks/:id/take`
- Start task → verify POST to `/api/v1/tasks/:id/reporting/start`

**4. Reporting Flow**
- Open study for reporting
- Submit report → verify POST to `/api/v1/tasks/:id/reporting/submit`
- Submit for validation → verify POST to `/api/v1/tasks/:id/validation/submit`

**5. Validation Flow**
- Open study for validation
- Start validation → verify POST to `/api/v1/tasks/:id/validation/start`
- Approve → verify POST to `/api/v1/tasks/:id/validation/approve`
- Reject → verify POST to `/api/v1/tasks/:id/validation/reject`

**6. Admin Pages**
- Load studies list → verify API call with pagination
- Create/update/delete users → verify CRUD endpoints
- Manage task types → verify CRUD endpoints
- View audit log → verify audit API calls
- Check SLA dashboard → verify statistics endpoints

**7. Error Scenarios**
- Invalid credentials → verify error display
- Network failure → verify retry logic and error message
- 401 during session → verify auto-logout and redirect
- 403 forbidden → verify proper handling

## Implementation Order

1. **Authentication Foundation**
   - Create LoginPage component
   - Add route guards with role checking
   - Update router with route metadata
   - Add login route outside AppLayout

2. **Mock Data Removal**
   - Remove mock imports from all stores
   - Remove mock imports from all pages
   - Update stores to throw errors if API fails (no fallbacks)
   - Update pages to use only store data

3. **Service Expansion**
   - Add missing CRUD methods for admin features
   - Add statistics/SLA endpoint calls
   - Add schedule management endpoints

4. **UI Polish**
   - Add loading states to all pages
   - Add error handling with toasts
   - Add empty states
   - Ensure proper disabled states during operations

5. **Testing**
   - Delete mockData.ts file
   - Test all flows with Chrome DevTools MCP
   - Verify network requests
   - Fix any integration issues

6. **Cleanup**
   - Remove any unused imports
   - Verify no console errors
   - Final testing pass

## File Changes Summary

### New Files
- `/src/pages/LoginPage.vue` - login UI component
- `/src/router/guards.ts` - navigation guard logic (optional separation)
- `/docs/plans/2026-01-21-frontend-api-integration-design.md` - this document

### Modified Files
- `/src/router/index.ts` - add guards, metadata, login route
- `/src/stores/studyStore.ts` - remove mock fallbacks
- `/src/stores/taskStore.ts` - remove mock fallbacks
- `/src/stores/userStore.ts` - remove mock fallbacks
- `/src/stores/auditStore.ts` - remove mock fallbacks
- `/src/stores/clientTypeStore.ts` - remove mock fallbacks
- `/src/services/userService.ts` - add admin CRUD methods
- `/src/services/studyService.ts` - verify completeness
- All page components - remove mock imports, add loading/error states

### Deleted Files
- `/src/data/mockData.ts` - all mock data removed

## Success Criteria

- ✅ All routes protected by authentication
- ✅ Role-based access working correctly
- ✅ No references to mockData.ts remain
- ✅ All pages load data from real API
- ✅ Loading states visible during API calls
- ✅ Error messages display on failures
- ✅ Login/logout flow works correctly
- ✅ Token persistence across page refreshes
- ✅ Chrome DevTools MCP shows all expected API calls
- ✅ No console errors during normal operation

## Technical Decisions

**Why big bang approach?**
- Backend is fully ready
- Faster to complete
- Easier to ensure consistency
- Can test entire system at once

**Why soft redirect with return path?**
- Better user experience
- Users land where they intended
- Handles deep linking properly

**Why overlapping role permissions?**
- Admins need full visibility
- Radiologists need focused access
- More flexible than strict separation

**Why minimal login page?**
- Focus on functionality first
- Can enhance later if needed
- Matches clean application aesthetic

## Risk Mitigation

**Risk: API endpoints don't match expectations**
- Mitigation: User confirmed backend is ready; test with Chrome DevTools MCP early

**Risk: Missing API endpoints for admin features**
- Mitigation: Add service methods incrementally; stub if needed

**Risk: Breaking existing functionality during migration**
- Mitigation: Test systematically with Chrome DevTools MCP; big bang allows full integration testing

**Risk: Auth token handling issues**
- Mitigation: Existing axios interceptor already handles token; well-tested pattern

## Next Steps

After design approval:
1. Set up git worktree for isolated development
2. Create detailed implementation plan with specific tasks
3. Begin implementation following the defined order
4. Test continuously with Chrome DevTools MCP
