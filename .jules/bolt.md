
## 2025-01-20 - React.memo on heavily mapped component
**Learning:** In applications where a component is heavily mapped inside a loop, like the bulk print container, wrapping it in `React.memo()` is a crucial optimization to prevent massive O(N) re-renders when parent states change, preventing input lag and browser lockups.
**Action:** Use `React.memo` on complex functional components that render inside large arrays/lists, particularly when they receive mostly static or referentially stable props. Ensure `import React` is correctly added if it's missing.
