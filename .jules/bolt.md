## 2024-09-25 - React.memo Shallow Equality Trap with Inline Props
**Learning:** When using `React.memo` to optimize heavy components (like the `MarksheetTemplate` mapped in `#print-bulk-container`), passing inline default objects (e.g., `student={s.student_data || {}}`) bypasses shallow comparison. The inline `{}` creates a new object reference every render, causing the child to always re-render, completely defeating `React.memo`.
**Action:** Extract default objects like `defaultStudent = {}` outside the component scope and pass them as fallbacks instead of using inline objects.
