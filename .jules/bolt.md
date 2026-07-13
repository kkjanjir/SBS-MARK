## 2024-07-13 - Memoizing Bulk Components with React.memo
**Learning:** In bulk rendering operations (like mapping out dozens of `MarksheetTemplate`s), inline fallbacks in props (e.g., `student={s.student_data || {}}`) break `React.memo`'s shallow equality check on every render.
**Action:** Always extract stable, static fallbacks outside the component scope (e.g., `const DEFAULT_STUDENT = {}`) to ensure `React.memo` actually prevents unnecessary re-renders when mapping.
