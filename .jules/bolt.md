## 2025-02-12 - [Component Prop Defaults]
**Learning:** Supplying inline empty objects `{}` as defaults to component props (e.g. `student={s.student_data || {}}`) in heavily mapped components bypasses `React.memo`'s shallow comparison, triggering expensive re-renders on the entire list during non-related state changes.
**Action:** Extract static defaults (e.g. `const defaultStudent = {}`) outside the component scope and pass those to ensure strict referential stability of fallback props.
## 2025-02-12 - [Array derived from props in React.memo]
**Learning:** If a component derives an array from props (e.g. `getClassSubjects` generating an array dynamically), passing it down to a `React.memo` component will break memoization because the array reference is new on every render.
**Action:** Use a memoized Map (e.g. `subjectsCache = useMemo(() => new Map(), [])`) to cache and return the exact same array reference for identical inputs, preserving `React.memo`'s shallow equality check.
