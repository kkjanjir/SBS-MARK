## 2025-02-15 - React.memo Arrays and Referentially Stable Defaults
**Learning:** In list rendering where child components receive newly created arrays or inline object fallbacks, standard React.memo fails completely. Deep equality checks in comparators are too slow.
**Action:** Use a custom arePropsEqual comparator to manually iterate array props, and extract inline default objects to static constants outside the component scope to preserve referential stability.
