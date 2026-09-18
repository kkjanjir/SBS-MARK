## 2024-05-24 - [React Memoization for Hidden Print Elements]
**Learning:** In this architecture, elements visually hidden via CSS for printing still execute full React render cycles. Un-memoized complex mapping operations cause severe, application-wide input lag on every unrelated state change.
**Action:** Extract pure helper functions outside component scope entirely. Utilize `useMemo` to cache derived arrays and UI blocks prior to rendering, and apply `useCallback` to prevent stale closures and cache invalidation.
