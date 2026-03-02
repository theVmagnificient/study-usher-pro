# React Rewrite Plan

## Context

The current project is a Vue 3 SPA (medical imaging reporting platform) with Pinia, Vue Router, shadcn/vue, and vue-i18n. The goal is a 1:1 rewrite to React while keeping all domain logic, services, and types intact.

**Chosen stack:**
- Vite + React (in-place replacement)
- Zustand (replaces Pinia)
- Radix UI (raw primitives, replaces shadcn/vue)
- React Router v6 (replaces Vue Router)
- react-i18next (replaces vue-i18n)
- lucide-react (replaces lucide-vue-next)

---

## What Stays (framework-agnostic, keep as-is)

| Path | Notes |
|---|---|
| `src/services/` | All 7 services — no changes needed |
| `src/types/` | TypeScript types — no changes |
| `src/lib/api/client.ts` | Axios client — no changes |
| `src/lib/mappers/` | All mappers — no changes |
| `src/lib/lookup/lookupCache.ts` | No changes |
| `src/lib/utils/` | batchLoader, requestDeduplication — no changes |
| `src/data/reportTemplates.ts` | No changes |
| `src/utils/linkedStudies.ts` | No changes |
| `src/lib/utils.ts` | `cn()` helper — no changes |
| `tailwind.config.ts` | No changes |
| `postcss.config.js` | No changes |

---

## What Gets Replaced

| Vue | React equivalent |
|---|---|
| `src/main.ts` | `src/main.tsx` |
| `src/App.vue` | `src/App.tsx` |
| `src/vite-env.d.ts` | `src/vite-env.d.ts` (update triple-slash refs) |
| `src/stores/*.ts` (Pinia) | `src/stores/*.ts` (Zustand) |
| `src/router/index.ts` | `src/router/index.tsx` (React Router v6) |
| `src/pages/**/*.vue` | `src/pages/**/*.tsx` |
| `src/components/layout/*.vue` | `src/components/layout/*.tsx` |
| `src/components/ui/*.vue` | `src/components/ui/*.tsx` (Radix UI) |
| `src/composables/*.ts` | `src/hooks/*.ts` |
| `src/hooks/use-mobile.ts` | `src/hooks/use-mobile.ts` |
| `src/hooks/use-toast.ts` | `src/hooks/use-toast.ts` |
| `src/i18n/index.ts` | `src/i18n/index.ts` (react-i18next) |
| `src/App.css` | keep (global styles) |
| `src/index.css` | keep (Tailwind base) |
| `vite.config.ts` | update plugins |
| `tsconfig*.json` | update for React JSX |
| `package.json` | full dependency swap |
| `eslint.config.js` | update for React rules |

---

## Execution Phases

### Phase 1 — Bootstrap (do first, unlocks everything else)

1. **Update `package.json`** — swap all Vue deps for React equivalents:
   - Remove: `vue`, `vue-router`, `pinia`, `@vueuse/core`, `@vueuse/motion`, `lucide-vue-next`, `radix-vue`, `@headlessui/vue`, `vue-i18n`, `@vitejs/plugin-vue`, `eslint-plugin-vue`, `vue-tsc`
   - Add: `react`, `react-dom`, `react-router-dom`, `zustand`, `lucide-react`, `react-i18next`, `i18next`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-select`, `@radix-ui/react-tooltip`, `@radix-ui/react-popover`, `@radix-ui/react-accordion`, `@radix-ui/react-tabs`, `@radix-ui/react-checkbox`, `@radix-ui/react-label`, `@radix-ui/react-separator`, `@radix-ui/react-avatar`, `@radix-ui/react-scroll-area`, `@radix-ui/react-switch`, `@radix-ui/react-toast`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-context-menu`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-radio-group`, `@radix-ui/react-slider`, `@radix-ui/react-progress`, `@radix-ui/react-collapsible`, `sonner`
   - DevDeps: `@vitejs/plugin-react`, `@types/react`, `@types/react-dom`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `@eslint/js`
   - Update scripts: remove `vue-tsc`, add `tsc` for type-check

2. **Update `vite.config.ts`** — replace `@vitejs/plugin-vue` with `@vitejs/plugin-react`

3. **Update `tsconfig*.json`** — set `"jsx": "react-jsx"`, remove vue-specific options

4. **Update `eslint.config.js`** — replace vue rules with react + react-hooks rules

5. **Create `src/main.tsx`** — React app bootstrap with SuperTokens, i18n, Router, ReactDOM.createRoot

6. **Update `index.html`** — point script src to `src/main.tsx`

7. **Create `src/App.tsx`** — root component with Toaster, router outlet

### Phase 2 — Infrastructure

8. **`src/i18n/index.ts`** — rewrite with react-i18next / i18next (same locale keys)

9. **`src/stores/authStore.ts`** — Zustand store (same shape as Pinia, same SuperTokens calls)

10. **`src/stores/app.ts`** — Zustand store (theme, currentRole)

11. **`src/stores/taskStore.ts`** — Zustand store (largest, 471 lines of actions)

12. **`src/stores/studyStore.ts`** — Zustand store

13. **`src/stores/userStore.ts`** — Zustand store

14. **`src/stores/auditStore.ts`** — Zustand store

15. **`src/stores/clientTypeStore.ts`** — Zustand store

16. **`src/router/index.tsx`** — React Router v6 with auth guards and role-based redirects

### Phase 3 — Shared Hooks & Utils

17. **`src/hooks/useDebounce.ts`** — convert from Vue ref-based to React useState/useEffect

18. **`src/hooks/usePictureInPicture.ts`** — convert from Vue composable (mount React app in PiP window)

19. **`src/hooks/useSlashTemplates.ts`** — convert from Vue composable to React hook

20. **`src/hooks/use-mobile.ts`** — minor tweak (replace VueUse with window.matchMedia)

21. **`src/hooks/use-toast.ts`** — wire to sonner

### Phase 4 — Layout & Core UI Components

22. **`src/components/ui/`** — Build Radix UI primitives as needed (start with button, input, badge, dialog, dropdown-menu, select, table, tooltip, toast, skeleton)

23. **`src/components/layout/AppLayout.tsx`** — Main shell

24. **`src/components/layout/AppSidebar.tsx`** — Navigation sidebar

25. **`src/components/layout/PageHeader.tsx`** — Page title/header

26. **`src/components/layout/NavLink.tsx`** — Nav link with active state

### Phase 5 — Domain Components

27. **`src/components/ui/StatusBadge.tsx`**
28. **`src/components/ui/UrgencyBadge.tsx`**
29. **`src/components/ui/DeadlineTimer.tsx`**
30. **`src/components/ui/ElapsedTimer.tsx`**
31. **`src/components/ui/LinkedStudiesBadge.tsx`**
32. **`src/components/ui/LinkedBodyAreasDisplay.tsx`**
33. **`src/components/ui/ErrorAlert.tsx`**
34. **`src/components/ui/LanguageSwitcher.tsx`**
35. **`src/components/ui/TemplatePopup.tsx`**
36. **`src/components/ui/SkeletonLoader.tsx`** + skeletons/

### Phase 6 — Pages (simplest → most complex)

37. **`src/pages/LoginPage.tsx`** — auth form
38. **`src/pages/NotFound.tsx`** — 404
39. **`src/pages/physician/PhysicianProfilePage.tsx`**
40. **`src/pages/admin/TaskTypesPage.tsx`**
41. **`src/pages/admin/UserManagementPage.tsx`**
42. **`src/pages/admin/PhysicianSchedulePage.tsx`**
43. **`src/pages/admin/AuditLogPage.tsx`**
44. **`src/pages/admin/SLADashboardPage.tsx`**
45. **`src/pages/admin/WorkforceCapacityPage.tsx`**
46. **`src/pages/admin/TaskListPage.tsx`**
47. **`src/pages/admin/StudyListPage.tsx`**
48. **`src/pages/admin/StudyDetailPage.tsx`**
49. **`src/pages/physician/PhysicianQueuePage.tsx`**
50. **`src/pages/physician/ValidationQueuePage.tsx`**
51. **`src/pages/reporting/PipShell.tsx`**
52. **`src/pages/reporting/ReportingPage.tsx`** (most complex — PiP, slash templates, bilingual editor)

---

## Zustand Store Pattern

Each store follows this pattern (vs Pinia):

```ts
// Pinia (before)
export const useTaskStore = defineStore('task', () => {
  const tasks = ref([])
  const fetchTasks = async () => { ... }
  return { tasks, fetchTasks }
})

// Zustand (after)
interface TaskState {
  tasks: Task[]
  fetchTasks: () => Promise<void>
}
export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  fetchTasks: async () => {
    const data = await taskService.getMyReportingTasks()
    set({ tasks: data })
  },
}))
```

Computed values (Pinia getters) become selectors or inline derivations in components.

---

## React Router v6 Auth Guard Pattern

```tsx
// Replaces Vue Router navigation guards
function RequireAuth({ roles }: { roles?: UserRole[] }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />
  return <Outlet />
}
```

---

## Deletion Order (Vue artifacts)

After each phase is complete and verified, delete the corresponding `.vue` files. At Phase 1 completion, also delete:
- `src/vite-env.d.ts` (recreate for React)
- Any `.vue` specific config leftovers

---

## Verification

- `bun install` — no peer dep errors
- `bun dev` — app boots, login page renders
- Auth flow works (SuperTokens)
- Role-based redirects work
- At least one full queue page renders with data
- ReportingPage loads with PiP toggle working

---

## Critical Files to Read Before Starting

- `src/router/index.ts` — understand full guard logic before rewriting
- `src/stores/taskStore.ts` — largest store, read fully before converting
- `src/pages/reporting/ReportingPage.vue` — most complex page
- `src/composables/usePictureInPicture.ts` — Vue-specific DOM mounting needs React equivalent
- `src/main.ts` — SuperTokens init order matters
