## 2024-05-20 - [Performance] Hidden Print Containers Require Strong Memoization
**Learning:** In this application, elements hidden via CSS (like print containers with `display: none`) still execute full React render cycles. Heavy computations or loops inside them must be strongly memoized to prevent application-wide input lag on unrelated state changes (e.g. typing in search).
**Action:** Always wrap heavy hidden mapping operations in `useMemo` and extract helper functions using `useCallback` or move them outside the component scope entirely to prevent cache invalidation.
