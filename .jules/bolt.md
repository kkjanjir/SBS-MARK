## 2026-06-03 - Strict Memoization in Hidden Print Containers
**Learning:** Elements hidden via CSS (e.g., `display: none` in `@media print` or similar logic for `#print-bulk-container`) still execute full React render cycles. An O(N) map operation over elements like `classFilteredStudents` without top-level memoization will severely degrade input performance due to unnecessary rendering.
**Action:** Extract purely functional helpers outside the component and wrap mapping operations in hidden containers with strict `useMemo` hooks with correct dependency arrays.
