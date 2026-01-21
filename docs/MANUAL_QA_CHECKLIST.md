# Manual QA Testing Checklist

## Pre-Testing Setup
- [ ] Backend server running on `http://localhost:8000`
- [ ] `.env.development` configured with correct `VITE_API_BASE_URL`
- [ ] Test user ID configured in environment
- [ ] Clear browser cache and local storage
- [ ] Test in both Chrome and Firefox

---

## 1. Study List Page (Admin)

### Data Loading
- [ ] Page loads without errors
- [ ] Skeleton loaders appear during data fetch
- [ ] Studies display in table after loading
- [ ] Pagination controls appear if > 20 studies
- [ ] Empty state shows if no studies

### Filters
- [ ] Search by study ID works
- [ ] Search by patient ID works
- [ ] Search by client name works
- [ ] Status filter dropdown populates
- [ ] Status filter correctly filters studies
- [ ] Client filter dropdown populates
- [ ] Client filter correctly filters studies
- [ ] Modality filter works
- [ ] Date range filter works (from date)
- [ ] Date range filter works (to date)
- [ ] Time pickers work in date filters
- [ ] "Clear" button clears date filters
- [ ] Multiple filters work together

### Study Cards
- [ ] Study ID displays correctly (STD-XXX format)
- [ ] Patient demographics shown (ID, sex, age)
- [ ] Client name displays
- [ ] Modality and body area shown
- [ ] Status badge displays with correct color
- [ ] Urgency badge displays (STAT/Urgent/Routine)
- [ ] Assigned physician name shows (or "Unassigned")
- [ ] Deadline timer displays and counts down
- [ ] Linked body areas chip shows when applicable
- [ ] Click on study opens detail page

### Dropdown Actions
- [ ] Three-dot menu opens
- [ ] "View Details" navigates to detail page
- [ ] "Download DICOM" option visible
- [ ] "Reassign" option visible

### Error Handling
- [ ] Error message displays if backend is down
- [ ] "Retry" button appears on error
- [ ] Retry button refetches data
- [ ] Offline indicator shows when network is disconnected

---

## 2. Physician Queue Page

### Data Loading
- [ ] Page loads without errors
- [ ] Study card skeletons appear during loading
- [ ] Queue displays after loading
- [ ] Workload warning shows when at max capacity

### Tabs
- [ ] "To Report" tab displays pending studies
- [ ] "Commented" tab displays studies with validator comments
- [ ] "Completed" tab displays finalized studies
- [ ] Badge counts on tabs are correct
- [ ] Switching tabs updates view immediately

### Study Cards
- [ ] All study information displays correctly
- [ ] "Start Reporting" button visible on pending studies
- [ ] Click on study opens reporting page
- [ ] Linked body parts indicator shows
- [ ] Deadline timer displays

### Filtering (Client-Side)
- [ ] Studies filter correctly by tab
- [ ] Urgent studies highlighted
- [ ] STAT studies at top of queue

---

## 3. Validation Queue Page

### Tabs
- [ ] "Urgent Queue" tab shows urgent validations
- [ ] "Retrospective Queue" tab shows non-urgent
- [ ] Badge counts correct
- [ ] Empty state shows when queue empty

### Validation Sections
- [ ] "Pending Validation" section shows unassigned studies
- [ ] "In Validation" section shows assigned studies
- [ ] Badge counts accurate for each section
- [ ] Visual separation between sections clear

### Study Cards
- [ ] "Take for Validation" button on pending studies
- [ ] Study information complete
- [ ] Validator name shows on in-progress studies
- [ ] Click opens reporting page in validation mode

---

## 4. Study Detail Page

### Data Loading
- [ ] Page loads study details
- [ ] Skeleton loaders show during fetch
- [ ] Error if study not found
- [ ] "Go Back" button works on error

### Header
- [ ] Study ID displays correctly
- [ ] Status and urgency badges show
- [ ] Client name and modality display
- [ ] Deadline timer functional
- [ ] "Download DICOM" button visible
- [ ] "Reassign" button visible

### Study Information Card
- [ ] Patient ID shows
- [ ] Sex and age display
- [ ] Received date/time formatted correctly
- [ ] Modality and body area shown
- [ ] Assigned physician name displays

### Current Report Card
- [ ] Protocol section visible
- [ ] Findings section shows (or "No findings yet")
- [ ] Impression section shows (or "No impression yet")

### Prior Studies
- [ ] Prior studies table visible if `hasPriors` true
- [ ] Prior count displays
- [ ] Each prior has type and date
- [ ] "Report" button opens prior report dialog
- [ ] "Download DICOM" button on each prior
- [ ] Dialog shows prior report text when clicked

### Linked Body Parts
- [ ] Card shows if multiple body areas
- [ ] Current study highlighted
- [ ] Other linked studies listed
- [ ] Click on linked study navigates to that study
- [ ] Status badge for each linked study

### Audit History
- [ ] History entries display in chronological order
- [ ] Each entry shows timestamp, action, user
- [ ] Status transitions display with badges (Previous → New)
- [ ] Comments show when present
- [ ] Scrollable if many entries
- [ ] "No history" message if empty

---

## 5. Reporting Page (Complex)

### Data Loading
- [ ] Study loads correctly
- [ ] Full-screen loading prevents broken UI
- [ ] Error handling if study fails to load

### Layout
- [ ] Left panel: Study info and priors
- [ ] Center panel: Viewer placeholder
- [ ] Right panel: Report form
- [ ] Panels resize correctly

### Study Information
- [ ] All study metadata visible
- [ ] Linked body areas display
- [ ] Navigation to linked studies works

### Report Form
- [ ] Protocol text area functional
- [ ] Findings text area functional
- [ ] Impression text area functional
- [ ] Character counts update
- [ ] "Save Draft" button works
- [ ] "Submit for Validation" button works
- [ ] Form validation prevents empty submission

---

## 6. User Management Page

### Data Loading
- [ ] Users load in table
- [ ] Table skeleton shows during load
- [ ] "Add Physician" button visible

### User Table
- [ ] All columns display (Name, Email, Role, Specialization, etc.)
- [ ] Active studies count shown
- [ ] Max capacity shown
- [ ] Edit and Delete buttons visible

### Search
- [ ] Search filters users by name
- [ ] Search filters by physician ID
- [ ] Results update immediately

### CRUD Operations
- [ ] "Add Physician" opens dialog
- [ ] "Edit" button opens dialog with user data
- [ ] "Delete" button shows confirmation (not implemented)
- [ ] Save button in dialog submits (placeholder)

### Navigation
- [ ] Click on physician name/ID navigates to schedule page

---

## 7. Task Types Page

### Data Loading
- [ ] Client types load in table
- [ ] Skeleton shows during load

### Table Display
- [ ] All columns visible (Client, Modality, Body Area, etc.)
- [ ] TAT displayed in hours
- [ ] Price and payout show currency formatting
- [ ] "Has Priors" badge displays Yes/No

### CRUD Operations
- [ ] "Add Task Type" button opens dialog
- [ ] Dialog has all form fields
- [ ] Modality dropdown populates
- [ ] Body area dropdown populates
- [ ] Edit button opens dialog with data pre-filled
- [ ] Save updates task type (placeholder)
- [ ] Delete button visible

---

## 8. Physician Profile Page

### Data Loading
- [ ] Profile loads
- [ ] Skeleton shows during load

### Contact Information
- [ ] Full name displays
- [ ] Phone number shows (or placeholder)
- [ ] Telegram handle shows (or placeholder)

### Schedule Section
- [ ] Current week's schedule displays
- [ ] Each day shows working hours or "Off"
- [ ] Working days highlighted
- [ ] "Manage Schedule" button navigates to schedule page

### Specialties
- [ ] Supported modalities listed as badges
- [ ] Supported body areas listed as badges

### Statistics
- [ ] "This Month" count displays
- [ ] "Last Month" count displays
- [ ] "All-Time Total" count displays
- [ ] By Modality breakdown shows
- [ ] By Body Area breakdown shows

---

## 9. Physician Schedule Page

### Data Loading
- [ ] Schedule loads
- [ ] Error if physician not found

### Week Navigation
- [ ] Previous week button works
- [ ] Next week button works
- [ ] Quick week tabs (current, +1, +2, etc.) work
- [ ] Selected week highlighted

### Schedule Grid
- [ ] 7 days display (Monday-Sunday)
- [ ] Hours 0-23 display for each day
- [ ] Default working hours have ring indicator
- [ ] Custom hours highlighted in primary color
- [ ] Non-working hours shown in muted color

### Interactions
- [ ] Click hour toggles schedule
- [ ] Visual feedback immediate
- [ ] "Reset" button appears on customized days
- [ ] Reset restores default schedule
- [ ] "Save Changes" button visible (placeholder)

### Legend
- [ ] Scheduled indicator explained
- [ ] Not working indicator explained
- [ ] Default schedule indicator explained

---

## 10. Audit Log Page

### Data Loading
- [ ] Audit entries load
- [ ] Table skeleton shows during load
- [ ] Table displays after load

### Table Display
- [ ] Timestamp formatted correctly (MMM dd, yyyy HH:mm)
- [ ] Study ID displayed
- [ ] Action type shown
- [ ] Status transitions display with badges
- [ ] User name shown
- [ ] Comments display when present
- [ ] Empty state if no entries

### Performance
- [ ] Table scrolls smoothly with many entries
- [ ] No layout shift during load

---

## 11. SLA Dashboard Page

### Data Loading
- [ ] Dashboard loads
- [ ] Multiple skeletons show (stats, cards, table)
- [ ] All sections populate

### Key Metrics
- [ ] 4 stat cards display
- [ ] Numbers are formatted correctly
- [ ] Colors match metric type

### Status Distribution
- [ ] All statuses shown with counts
- [ ] Status badges colored correctly
- [ ] Layout responsive

### Overdue Studies Table
- [ ] Table shows if there are overdue studies
- [ ] Study info displays correctly
- [ ] "Overdue By" calculated correctly
- [ ] Click on study navigates to detail

---

## 12. Workforce Capacity Page

### Data Loading
- [ ] Page loads statistics
- [ ] Card skeletons show

### Statistics Display
- [ ] Active physicians count
- [ ] Available capacity shown
- [ ] Studies in progress count
- [ ] Average completion time displayed

### Physician List
- [ ] All physicians listed
- [ ] Active studies count per physician
- [ ] Progress bars show capacity utilization
- [ ] Color coding for capacity levels (green/amber/red)

---

## Error Handling (Global)

### Network Errors
- [ ] Offline detection works
- [ ] "You appear to be offline" message shows
- [ ] Automatic retry when online again
- [ ] Network status indicator

### API Errors
- [ ] 401 Unauthorized: Clear message about re-login
- [ ] 404 Not Found: User-friendly message
- [ ] 422 Validation: Shows validation errors
- [ ] 500 Server Error: Suggests retry
- [ ] Timeout: Clear timeout message

### Retry Logic
- [ ] Automatic retries for GET requests (up to 3x)
- [ ] Exponential backoff visible in console
- [ ] Manual retry button works
- [ ] No duplicate requests during retry

---

## Performance

### Loading Times
- [ ] Initial page load < 2 seconds
- [ ] Study list loads < 1 second
- [ ] Study detail loads < 1 second
- [ ] Navigation feels instant

### Caching
- [ ] Lookup cache reduces redundant API calls
- [ ] Cache expires after 5 minutes (check console)
- [ ] Request deduplication prevents duplicate calls

### UI Responsiveness
- [ ] No layout shift during data load
- [ ] Skeleton loaders match final layout
- [ ] Smooth transitions
- [ ] No flickering

---

## Browser Compatibility

### Chrome
- [ ] All pages work
- [ ] No console errors
- [ ] Styling correct

### Firefox
- [ ] All pages work
- [ ] No console errors
- [ ] Styling correct

### Safari (if available)
- [ ] All pages work
- [ ] No console errors
- [ ] Styling correct

---

## Accessibility (Basic)

- [ ] All interactive elements keyboard accessible
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Error messages announced to screen readers
- [ ] Form labels properly associated

---

## Success Criteria

**PASS if:**
- ✅ All critical flows work without errors
- ✅ Loading states display correctly
- ✅ Error handling works and is user-friendly
- ✅ Data displays accurately after mapping
- ✅ No console errors on any page
- ✅ Performance is acceptable (< 2s page load)

**FAIL if:**
- ❌ Any page crashes or shows white screen
- ❌ Data mapping errors (wrong IDs, names, etc.)
- ❌ API errors not handled gracefully
- ❌ Skeleton loaders don't match final layout
- ❌ Excessive API calls (check Network tab)

---

## Notes Section

**Issues Found:**
```
Date | Page | Issue | Severity | Status
-----|------|-------|----------|-------
     |      |       |          |
```

**Performance Observations:**
```
Page                    | Load Time | API Calls | Cache Hits
------------------------|-----------|-----------|------------
Study List             |           |           |
Physician Queue        |           |           |
Study Detail           |           |           |
```

---

## Testing Completed By

- **Tester Name:** ___________________
- **Date:** ___________________
- **Environment:** Development / Staging / Production
- **Backend Version:** ___________________
- **Frontend Version:** ___________________

---

## Sign-off

- [ ] All critical tests passed
- [ ] All blocking issues resolved
- [ ] Ready for deployment

**Signature:** ___________________
**Date:** ___________________
