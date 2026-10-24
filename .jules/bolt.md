## 2025-05-15 - [React.memo in Bulk Print]
**Learning:** The `MarksheetTemplate` component is heavily used in mapping operations (e.g., inside the bulk print container) and lacks memoization. Adding `React.memo` around it and its static props is a key performance improvement.
**Action:** Wrap `MarksheetTemplate` with `React.memo` and define static default objects outside the component to prevent breaking referential equality.
