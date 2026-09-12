## 2024-05-24 - [Avoid breaking Hooks with early returns]
**Learning:** Placing `useMemo` hooks below early returns (like `if (!isUnlocked)`) violates the Rules of Hooks and causes React to crash. When refactoring legacy code to use memoization, it's critical to analyze the component's control flow and hoist all hooks to the top level.
**Action:** Always verify the position of early returns in the component before inserting new hooks.

## 2024-05-24 - [Memoizing mapping operations with inline props]
**Learning:** Wrapping a component like `MarksheetTemplate` in `React.memo` is ineffective if parent mapping operations pass inline objects or arrays (e.g., `student={s.student_data || {}}`). These inline objects fail the shallow equality check on every render.
**Action:** Define static default fallback objects (like `defaultStudent = useMemo(() => ({}), [])`) outside the mapping loop and pass them as props to preserve referential stability. Alternatively, wrap the entire mapping operation in a `useMemo` block.
