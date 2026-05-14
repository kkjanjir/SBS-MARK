## 2024-05-18 - Hidden Elements Cause Full Re-renders
**Learning:** Elements hidden via CSS (like `display: none` for `#print-bulk-container`) still execute full React render cycles. Mapping over large un-memoized arrays inside these hidden elements causes O(N) rendering on every state change, leading to severe input lag.
**Action:** Always wrap heavy computations and mapping inside hidden print containers with `useMemo`, and ensure all helper functions referenced within the `useMemo` are wrapped in `useCallback` to maintain stable references.
