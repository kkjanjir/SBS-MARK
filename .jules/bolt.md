## 2024-05-18 - [Hidden Print Areas Need Memoization]
**Learning:** Elements hidden via CSS (like `display: none` in media print rules) still execute full React render cycles. In monolithic files with large lists, this leads to massive O(N) re-renders causing severe input lag on unrelated local state changes.
**Action:** Always wrap heavy computations and large loops inside hidden print containers with `useMemo`, ensuring all inline helper functions are stabilized with `useCallback` to prevent cache invalidation.
