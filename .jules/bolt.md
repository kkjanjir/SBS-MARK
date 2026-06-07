## 2024-05-24 - Hidden Elements Still Render in React
**Learning:** In this application, elements hidden via CSS (like print containers with `display: none`) still execute full React render cycles. Heavy computations or loops inside them must be strongly memoized (e.g., using `useMemo` and `useCallback`) to prevent application-wide input lag on unrelated state changes.
**Action:** Always extract static helper functions outside the main component scope and wrap expensive derived state operations inside `.map()` loops or hidden container content with `useMemo` and `useCallback` hook chains.
