## 2024-05-01 - [Optimized hidden print container]
**Learning:** Hidden print containers (`display: none`) still execute full React render cycles. If they contain complex iterations (e.g. `classFilteredStudents.map`), it can cause O(N) re-renders, severe input lag, and cache invalidation if helper functions used inside the map are not wrapped in `useCallback`.
**Action:** Use `useMemo` to cache large lists and their corresponding mapped JSX components above any early returns, and ensure all inline helper functions utilized are wrapped in `useCallback` with complete dependency arrays.
