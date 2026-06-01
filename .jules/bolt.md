
## 2024-05-18 - Hidden Print Containers Cause Input Lag
**Learning:** In this application, elements hidden via CSS (like print containers with `display: none`) still execute full React render cycles. The bulk print container renders a `MarksheetTemplate` for every single student in the class, meaning a single state update (like typing in a search box or changing an input) caused hundreds of off-screen components to re-render, leading to severe input lag.
**Action:** Always memoize the complex rendering logic (e.g. mapping over arrays to generate components) of hidden print containers using `useMemo` at the top level of the component. Ensure all dependencies of that `useMemo` (like helper functions) are also properly memoized with `useCallback` to prevent breaking the cache.
