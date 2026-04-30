## 2024-04-30 - [Memoizing Print Containers]
**Learning:** In this application, elements hidden via CSS (like print containers with `display: none`) still execute full React render cycles. Heavy computations or loops inside them must be strongly memoized (e.g., using `useMemo` and `useCallback`) to prevent application-wide input lag on unrelated state changes.
**Action:** Ensure complex helper functions used within these elements are wrapped in `useCallback`, and the rendering loops within hidden elements use `useMemo`.
