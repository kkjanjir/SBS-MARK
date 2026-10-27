## 2024-05-24 - React.memo with inline prop fallbacks
**Learning:** Wrapping heavily-rendered components like MarksheetTemplate in React.memo is ineffective if parent mapping logic passes inline object fallbacks (e.g. `student={data || {}}`). These recreate references on every render, defeating shallow comparison.
**Action:** Define static default objects outside the component scope and pass them instead, combined with custom comparator functions that strictly check referential equality.
