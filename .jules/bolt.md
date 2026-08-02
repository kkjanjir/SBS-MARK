
## 2023-10-27 - [Memoizing filter outputs]
**Learning:** Using `useMemo` on a heavy operation (like mapping over a list of students to render marksheets) will completely fail if its dependency array contains variables that are recreated on every render (e.g., the array returned by `dbStudents.filter()`). The filter creates a new array reference every time, causing `useMemo` to always miss the cache.
**Action:** Always verify that every variable inside a `useMemo` dependency array is also properly memoized, especially if it's derived data like a filtered or mapped array.
