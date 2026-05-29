## 2024-11-20 - Memoization of Hidden Print Nodes
**Learning:** In this application, elements hidden via CSS (like print containers with `display: none` such as `#print-bulk-container`) still execute full React render cycles.
**Action:** Any heavy computations or loops mapping children inside hidden UI elements must be heavily memoized (e.g., assigning a mapped variable via `useMemo` at the top level of the component scope) to prevent application-wide input lag on unrelated state changes like pin entry.
