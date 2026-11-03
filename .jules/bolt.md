## 2024-05-19 - MarksheetTemplate continuous re-rendering
**Learning:** `MarksheetTemplate` component is heavily used in mapping operations inside `MarksheetApp` (e.g., inside the bulk print container) but is not memoized, causing huge DOM recalculations on any state change.
**Action:** Always wrap heavy rendering components used in loops with `React.memo` and define static default objects outside the component to prevent breaking referential equality.
