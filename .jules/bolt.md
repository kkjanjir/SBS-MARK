## 2024-10-18 - Optimizing React Re-renders for Bulk Data Components
**Learning:** In heavily rendered lists or bulk print containers, inline fallback objects (e.g., `student={data || {}}`) and complex operations without memoization cause severe O(N) re-renders, breaking `React.memo()` shallow equality checks and creating significant input lag.
**Action:** Always define static default objects outside the component scope, and wrap complex rendering maps with `useMemo` assigning them at the top level to prevent O(N) recalculations on unrelated state changes.
