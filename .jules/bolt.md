## 2024-05-24 - React.memo on MarksheetTemplate Component
**Learning:** `MarksheetTemplate` is heavily used inside `#print-bulk-container` without `React.memo()`. This means any state change in `MarksheetApp` triggers a full re-render of all templates, causing extreme input lag since they're rendered despite `display: none` in CSS.
**Action:** Wrap `MarksheetTemplate` with `React.memo` and define pure utility functions outside of it to optimize rendering.
