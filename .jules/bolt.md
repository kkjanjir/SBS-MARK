## 2024-05-24 - [React.memo missing on heavy component]
**Learning:** `MarksheetTemplate` is a large component rendered in a `.map` loop for bulk printing (`#print-bulk-container`). Passing inline objects like `student={s.student_data || {}}` and recreating props causes it to re-render constantly.
**Action:** Wrap `MarksheetTemplate` in `React.memo`, move static default objects (like `{}`) outside the component to prevent referential inequality, and ensure the component is properly memoized to avoid severe UI lag during typing or state changes.
