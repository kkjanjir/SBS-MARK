## 2026-05-28 - [Memoize Hidden DOM Elements]
**Learning:** In React applications with large hidden DOM structures (like bulk print containers using `display: none`), the hidden components still execute full render cycles on every state change, causing severe application-wide input lag.
**Action:** Always wrap heavy hidden UI rendering operations in `useMemo` with minimal dependencies to prevent O(N) re-renders blocking the main thread during unrelated state updates.
