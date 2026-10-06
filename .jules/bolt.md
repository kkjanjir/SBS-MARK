## 2023-10-24 - [Optimize Hidden Print Containers]
**Learning:** Elements hidden via CSS (like print containers with display: none) still execute full React render cycles. Inline object fallbacks defeat React.memo shallow equality, causing O(N) re-renders.
**Action:** Heavily memoize these components, externalize static fallback objects, and use custom comparators for array props to prevent application-wide input lag.
