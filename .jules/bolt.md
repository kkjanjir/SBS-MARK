
## 2024-06-25 - [React Performance] Optimize bulk print container via top-level useMemo
**Learning:** In a monolith React architecture where a hidden component like a bulk print `#print-bulk-container` iterates over many expensive sub-components (`MarksheetTemplate`), simple input changes (like search queries) cause the entire map function to execute on every render. If inline object literals are passed as fallback props (e.g., `student={s.student_data || {}}`) to heavily-rendered components, it will bypass React's shallow prop comparison and force a re-render even if the child component is wrapped in `React.memo()`.

**Action:**
1. Use `useMemo` to memoize the entire bulk-print `MarksheetTemplate` component mapping process into a top-level variable (e.g. `bulkPrintMarksheets`).
2. Move purely functional helpers (e.g., `getGrade`) and static default prop objects entirely outside the component scope to preserve reference equality across renders.
