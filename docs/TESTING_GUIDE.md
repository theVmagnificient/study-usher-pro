# Testing Guide

## Overview

This project uses **Vitest** for unit and integration testing. Tests are organized by type and location.

---

## Test Structure

```
tests/
├── unit/
│   ├── mappers/          # Mapper transformation tests
│   │   ├── utils.test.ts
│   │   └── taskMapper.test.ts
│   └── cache/            # Cache layer tests
│       └── lookupCache.test.ts
└── integration/
    └── services/         # API service integration tests
        └── studyService.test.ts
```

---

## Running Tests

### All Tests
```bash
npm run test
```

### Watch Mode (Re-runs on file changes)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Specific Test File
```bash
npm run test tests/unit/mappers/utils.test.ts
```

### Specific Test Suite
```bash
npm run test -t "formatStudyId"
```

---

## Test Categories

### 1. Unit Tests

**Purpose:** Test individual functions in isolation

**Location:** `tests/unit/`

**Examples:**
- Mapper utilities (formatStudyId, calculateDeadline)
- Data transformations (taskMapper, userMapper)
- Cache operations (get, set, clear)

**Characteristics:**
- Fast execution (< 10ms per test)
- No external dependencies
- Pure functions
- High coverage target (> 90%)

**Example:**
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

---

### 2. Integration Tests

**Purpose:** Test how components work together

**Location:** `tests/integration/`

**Examples:**
- API services with mocked HTTP client
- Store actions with mocked services
- Component interactions

**Characteristics:**
- Medium execution time (< 100ms per test)
- Mocked external dependencies (API, localStorage)
- Tests data flow between layers

**Example:**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { studyService } from '@/services/studyService'
import apiClient from '@/lib/api/client'

vi.mock('@/lib/api/client')

describe('studyService', () => {
  it('should fetch and transform studies', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { items: [...], total: 1 }
    })

    const result = await studyService.getAll()
    expect(result.items[0].id).toBe('STD-001')
  })
})
```

---

### 3. Manual QA Testing

**Purpose:** Catch UX issues and edge cases

**Location:** `docs/MANUAL_QA_CHECKLIST.md`

**When to Run:**
- Before major releases
- After significant features
- Before merging to main branch

**What to Test:**
- Visual appearance
- User workflows
- Error states
- Loading states
- Responsive design
- Browser compatibility

---

## Writing Good Tests

### Test Structure (AAA Pattern)

```typescript
it('should do something', () => {
  // Arrange - Set up test data
  const input = { id: 1 }

  // Act - Execute the function
  const result = formatStudyId(input.id)

  // Assert - Verify the result
  expect(result).toBe('STD-001')
})
```

### Test Naming

**Good:**
```typescript
it('should format study ID with STD prefix and padding')
it('should calculate deadline by adding TAT hours')
it('should return undefined for non-existent cache entry')
```

**Bad:**
```typescript
it('test 1')
it('works')
it('formatStudyId function')
```

### Test Coverage Goals

| Layer | Target Coverage |
|-------|----------------|
| Mappers | > 95% |
| Services | > 80% |
| Stores | > 75% |
| Components | > 60% |
| Overall | > 75% |

---

## Mocking

### Mock API Client

```typescript
import { vi } from 'vitest'
import apiClient from '@/lib/api/client'

vi.mock('@/lib/api/client')

// Mock specific endpoints
vi.mocked(apiClient.get).mockImplementation((url) => {
  if (url === '/api/v1/admin/studies') {
    return Promise.resolve({ data: mockStudies })
  }
  return Promise.reject(new Error('Unexpected URL'))
})
```

### Mock Environment Variables

```typescript
vi.stubEnv('VITE_API_BASE_URL', 'http://test-api.example.com')
```

### Mock Timers

```typescript
import { vi, beforeEach, afterEach } from 'vitest'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

it('should expire after TTL', () => {
  cache.set('key', 'value')
  vi.advanceTimersByTime(5 * 60 * 1000) // 5 minutes
  expect(cache.get('key')).toBeUndefined()
})
```

---

## Common Patterns

### Testing Async Functions

```typescript
it('should fetch data asynchronously', async () => {
  const result = await studyService.getAll()
  expect(result.items).toHaveLength(5)
})
```

### Testing Error Handling

```typescript
it('should handle API errors gracefully', async () => {
  vi.mocked(apiClient.get).mockRejectedValue(
    new Error('Network error')
  )

  await expect(studyService.getAll()).rejects.toThrow('Network error')
})
```

### Testing with Cache

```typescript
import { lookupCache } from '@/lib/cache/lookupCache'

beforeEach(() => {
  lookupCache.clearAll()
})

it('should use cached data', () => {
  lookupCache.setUser(mockUser)
  const user = lookupCache.getUser(1)
  expect(user).toBeDefined()
})
```

---

## Test Data Factories

Create reusable test data:

```typescript
// tests/factories/studyFactory.ts
export const createMockBackendStudy = (overrides = {}) => ({
  id: 1,
  client_id: 1,
  client_type_id: 1,
  patient_id: 'PAT-001',
  patient_sex: 'M',
  patient_age: 50,
  study_datetime: '2024-01-15T08:00:00Z',
  ...overrides,
})

// Usage in tests
const study = createMockBackendStudy({ patient_age: 65 })
```

---

## Debugging Tests

### Run Single Test in Debug Mode

```bash
npm run test -- --reporter=verbose tests/unit/mappers/utils.test.ts
```

### Check Coverage for Specific File

```bash
npm run test:coverage -- tests/unit/mappers/utils.test.ts
```

### View Coverage Report

After running `npm run test:coverage`:
```bash
open coverage/index.html
```

---

## CI/CD Integration

Tests run automatically on:
- Pre-commit hooks (if configured)
- Pull request creation
- Merges to main branch

**Requirements:**
- All tests must pass
- Coverage must not decrease
- No failing tests allowed in main

---

## Test Utilities

### Assertion Helpers

```typescript
// Check array includes item
expect(array).toContain(item)

// Check object has property
expect(obj).toHaveProperty('id')

// Check close to (for floating point)
expect(value).toBeCloseTo(4.2, 1) // Within 0.1

// Check defined/undefined
expect(value).toBeDefined()
expect(value).toBeUndefined()

// Check truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
```

### Snapshot Testing

```typescript
it('should match snapshot', () => {
  const result = mapTaskToStudy(mockData)
  expect(result).toMatchSnapshot()
})
```

---

## Best Practices

### ✅ DO

- Test business logic thoroughly
- Mock external dependencies
- Use descriptive test names
- Test edge cases
- Clean up after tests (clearAll, resetMocks)
- Test error paths
- Keep tests independent

### ❌ DON'T

- Test implementation details
- Make tests depend on each other
- Use real API calls in tests
- Skip error case testing
- Test framework code
- Over-mock (test too little)
- Under-mock (test too much)

---

## Troubleshooting

### Tests Fail Locally But Pass in CI

**Cause:** Environment differences
**Fix:** Check environment variables, node versions

### Flaky Tests (Sometimes Pass/Fail)

**Cause:** Race conditions, timing issues
**Fix:** Use `await`, increase timeouts, use fake timers

### Coverage Report Shows Uncovered Lines

**Cause:** Missing test cases
**Fix:** Add tests for error paths, edge cases

### Mock Not Working

**Cause:** Import order, mock timing
**Fix:** Ensure `vi.mock()` is called before imports

---

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [Vue Test Utils](https://test-utils.vuejs.org)

---

## Running Manual QA

See `docs/MANUAL_QA_CHECKLIST.md` for comprehensive manual testing checklist.

**Before Release:**
1. Run full automated test suite
2. Check test coverage report
3. Execute manual QA checklist
4. Test in staging environment
5. Verify all critical flows

---

## Next Steps

1. **Expand Unit Tests:** Add tests for remaining mappers
2. **Add Service Tests:** Test all API services
3. **Component Tests:** Test critical Vue components
4. **E2E Tests:** Add Playwright/Cypress for end-to-end flows
5. **Performance Tests:** Add benchmarks for critical paths
