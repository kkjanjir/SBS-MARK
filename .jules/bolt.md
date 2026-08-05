## 2024-08-05 - Heavy calculation in React component during iteration
**Learning:** Elements hidden via CSS (like print containers) still execute full React render cycles. Functions like `getClassRank` which map, filter and sort over large arrays within an iteration in a React component cause massive performance lag.
**Action:** Memoize large array computations or move them outside the loop. Memoize the `MarksheetTemplate` component.
