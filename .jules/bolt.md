## 2025-02-24 - Hidden CSS Elements Trigger Full Render Cycles
**Learning:** In this application, elements hidden via CSS (like print containers with display: none) still execute full React render cycles. Heavy computations or mappings inside them cause severe application-wide input lag on unrelated state changes.
**Action:** Heavily memoize print containers using useMemo (assigned to variables at the top level of the component scope) and React.memo() for the template components.
