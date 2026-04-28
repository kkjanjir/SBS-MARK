## 2024-05-19 - React Performance with Heavy Loops in Hidden Elements
**Learning:** In React, if a component is hidden with CSS (e.g., `display: none` for `#print-bulk-container` until printing), its children will STILL render and execute heavy loops if they aren't memoized. In `app/page.tsx`, a massive map function inside a hidden print container was processing `getCalculations`, `getClassSubjects`, and `<MarksheetTemplate/>` components for every single student *on every state change*.

**Action:**
1. Always wrap heavy helper functions (`getCalculations`, `getClassSubjects`, `getGrade`, `getClassRank`) that are called inside loops in `useCallback` to maintain their reference and prevent unnecessary child re-renders.
2. Use `useMemo` for derived arrays (e.g., `classFilteredStudents`) so array reference does not change on unrelated updates.
3. When mapping over large arrays to return components, especially hidden components like print views, wrap the entire `array.map(...)` in `useMemo` with proper dependencies (`[classFilteredStudents, THEMES, showTableWatermark]`) so it's not recalculating O(N) operations unless necessary.
