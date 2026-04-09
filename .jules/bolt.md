## 2024-04-09 - Memoizing large dataset filtering in React
**Learning:** In dashboard components with potentially large student databases, filtering records by class (`dbStudents.filter(s => s.class_name === activeClass)`) directly inside the render loop causes O(N) operations on every re-render (e.g. typing in search box, changing state).
**Action:** Use `useMemo` for filtering large arrays of data (like `dbStudents`) and dependent derived data (like `searchedStudents`) to prevent unnecessary operations on unrelated state changes, keeping the dashboard responsive.
