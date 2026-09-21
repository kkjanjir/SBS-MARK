## 2025-05-16 - Memoizing hidden React DOM elements to fix input lag
**Learning:** In this application, elements hidden via CSS (like print containers with `display: none`) still execute full React render cycles. Heavy computations or loops inside them must be strongly memoized (e.g., using `useMemo` and `useCallback`) to prevent application-wide input lag on unrelated state changes.
**Action:** Always wrap heavy DOM mappings in `useMemo` and use `React.memo` for heavily mapped child components, even if they are visually hidden.
