## 2026-06-10 - Memoization of Hidden Print Containers
**Learning:** In this application, elements hidden via CSS (like print containers with `display: none`) still execute full React render cycles. Heavy computations or loops inside them must be strongly memoized (e.g., using `useMemo` and `useCallback`) to prevent application-wide input lag on unrelated state changes. Pure functions should be extracted entirely outside the component to prevent recreating.
**Action:** Always extract helper functions (e.g., `getCalculations`, `getClassSubjects`) out of large component functions to prevent re-creation and wrap heavy iterations that output JSX in `useMemo` when they shouldn't update on every state change.
## 2026-06-10 - Derived State Dependency Gotcha
**Learning:** When using `useMemo` for complex rendering, derived arrays (like `.filter()` results) defined without memoization directly above the hook will return a new reference on every render, invalidating the `useMemo` cache entirely.
**Action:** Always ensure any variable listed in a dependency array is also stable or properly memoized to avoid defeating the purpose of the optimization.
