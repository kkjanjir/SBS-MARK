## 2024-05-15 - Unnecessary Computations in Hidden Print Containers
**Learning:** Elements hidden via CSS (like print containers with `display: none`) still execute full React render cycles. In monolithic components, heavy loops inside them must be strongly memoized to prevent application-wide input lag on unrelated state changes.
**Action:** Extract purely functional helpers outside components, use `useCallback` for functions, and `useMemo` for derived states and heavy JSX elements, ensuring hooks are placed above early returns.
