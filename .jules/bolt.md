## 2026-06-14 - Expensive Bulk Print Rendering Unmemoized
**Learning:** Found an edge case where an unmemoized mapping of hundreds of students into complex print components (`#print-bulk-container`) triggered on every state update, leading to severe input lag elsewhere in the app. Elements hidden via CSS (`display: none`) still execute full React render cycles.
**Action:** Heavily memoized the entire hidden list output (`bulkPrintElements`) at the top level and correctly extracted helper functions to avoid unnecessary cache invalidation.
