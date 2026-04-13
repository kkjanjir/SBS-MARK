## 2024-04-13 - [O(N) hidden container re-renders in React]
**Learning:** Hidden print containers (`#print-bulk-container`) that map over large arrays of data (O(N) complexity) will re-render on every state change, causing severe input lag on the visible form elements. The DOM might be hidden, but React still reconciles it constantly.
**Action:** Always wrap large map operations for hidden print areas in `useMemo`, paying close attention to place them before any early returns to avoid breaking Rules of Hooks. Also remember to skip volatile inline functions in the dependency array.
