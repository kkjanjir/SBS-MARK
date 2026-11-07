## 2024-05-24 - React.memo with dynamic inline objects and arrays
**Learning:** React.memo's shallow comparison gets defeated if we pass dynamically generated arrays or inline objects (e.g. `s.student_data || {}`, `s.extra_data?.coScholastic || {sports:'A',...}`) from a parent's loop (like `map`).
**Action:** Extract inline default objects to static constants defined outside the component, and write a custom `arePropsEqual` if dynamically mapped arrays (like `subjectsList`) are being passed as props.
