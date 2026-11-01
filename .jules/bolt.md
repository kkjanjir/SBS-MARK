## 2024-03-24 - Initializing Bolt Journal
**Learning:** Initializing journal to track codebase-specific insights.
**Action:** Update with performance learnings when identified.
## 2024-03-24 - React.memo with Array Map Rendering Optimization
**Learning:** Returning default inline objects/arrays like `s.student_data || {}` or derived array returns defeats `React.memo`'s default shallow equality, causing entire lists of complex DOM elements (like `MarksheetTemplate`) to continually re-render.
**Action:** Always implement a custom `arePropsEqual` comparator when wrapping such components in `React.memo` and define static default objects outside the component to pass as props.
