## 2024-07-05 - Extracted pure utility functions to avoid recreation and stale closures
**Learning:** Pure utility functions defined inline within heavily re-rendered functional components (like `app/page.tsx`) cause performance overhead due to recreation on every render, and invalidate React caching like `useMemo`. If they don't depend on state, they should be extracted out of the component entirely.
**Action:** Extract functions like `getDynamicSubjects`, `getClassSubjects`, `getGrade`, and `getCalculations` outside of the `MarksheetApp` component.
