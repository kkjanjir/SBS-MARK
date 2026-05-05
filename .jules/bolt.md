## 2024-05-24 - [Memoizing Hidden Print Containers]
**Learning:** Elements hidden via CSS (like print containers with `display: none`) still execute full React render cycles. In this monolithic app, the '#print-bulk-container' mapped over all students and subjects on every unrelated state change, causing severe O(N) input lag.
**Action:** Strongly memoize heavy computations and loops inside hidden containers (e.g., using `useMemo` for mapped elements and `useCallback` for the helper functions they depend on) to prevent application-wide input lag.
