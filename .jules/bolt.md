## 2024-05-24 - Memoize hidden bulk print container

**Learning:** In this application, elements hidden via CSS (like print containers with `display: none`) still execute full React render cycles. Heavy computations or loops inside them must be strongly memoized (e.g., using `useMemo` and `useCallback`) to prevent application-wide input lag on unrelated state changes.

**Action:** Wrap the map function rendering the bulk print container inside a `useMemo` block with appropriate dependencies. Make sure helper functions used within the `useMemo` block are correctly wrapped with `useCallback` to prevent stale closures. Ensure the base array of the loop, like `classFilteredStudents`, is also memoized with `useMemo`.
