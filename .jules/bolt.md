## 2024-05-14 - [React.memo missing in heavy loops]
**Learning:** `MarksheetTemplate` is heavily used within `.map()` loops inside the `#print-bulk-container`, leading to massive re-renders whenever state changes, which causes UI sluggishness. This is a common React anti-pattern when rendering lists of expensive components.
**Action:** Wrap `MarksheetTemplate` with `React.memo` to prevent unnecessary re-renders. Also wrap functions passed to it, or ensure primitive variables are used, and arrays/objects passed don't get recreated on every render if possible.
