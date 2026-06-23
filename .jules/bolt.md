## 2024-05-24 - React.memo Bypass via Inline Props
**Learning:** Wrapping a component in `React.memo` might not prevent re-renders if props are passed as inline objects/arrays (e.g., `student={s.student_data || {}}`). Shallow comparison will fail because a new reference is created on every render.
**Action:** When `React.memo` is defeated by inline prop creation that is too complex to refactor, wrapping the entire mapping operation that generates those components in a `useMemo` (e.g., `bulkPrintContent`) can effectively halt the reconciliation before it even reaches the prop comparison stage.
