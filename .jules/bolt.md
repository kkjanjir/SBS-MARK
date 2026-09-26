
## 2024-05-18 - [Optimizing Hidden Bulk Print]
**Learning:** Elements hidden via CSS (like print containers with `display: none`) still execute full React render cycles. In this app, mapping over all students for the bulk print container causes severe input lag because the heavy `MarksheetTemplate` renders for every student on any state change.
**Action:** Heavily memoize these hidden components using `useMemo` assigned to variables at the top level of the component scope to prevent O(N) re-renders, and extract pure utility functions completely outside the component scope where possible.
