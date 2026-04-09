1. **Identify Performance Opportunity**: The application calculates `classFilteredStudents` on every render for the dashboard using `dbStudents.filter(s => s.class_name === activeClass)`. This list is then mapped over for rendering. Additionally, there's another identical filter logic right inside `triggerBulkPrint` function: `const classStudents = dbStudents.filter(s => s.class_name === activeClass);`. We can memoize this computation using `useMemo` so it's only recalculated when `dbStudents` or `activeClass` change. This prevents unnecessary array filtering on re-renders, especially typing in search box, changing other app states, etc.

2. **Implement Optimization**: Replace the raw `filter` calls with a `useMemo` block.
   ```typescript
   const classFilteredStudents = useMemo(() => {
     return dbStudents.filter(s => s.class_name === activeClass);
   }, [dbStudents, activeClass]);
   ```
   We can also replace `classStudents` in `triggerBulkPrint` to just use `classFilteredStudents`.

3. **Another Optimization: Search Filtering**: The search string filtering in the render function:
   `classFilteredStudents.filter(s => (s.student_name || '').toUpperCase().includes(searchQuery.toUpperCase()))`
   This is computed on *every* render. This should also be memoized to prevent re-filtering of large lists every time.

   ```typescript
   const searchedStudents = useMemo(() => {
     const query = searchQuery.toUpperCase();
     if (!query) return classFilteredStudents;
     return classFilteredStudents.filter(s => (s.student_name || '').toUpperCase().includes(query));
   }, [classFilteredStudents, searchQuery]);
   ```

4. **Complete pre commit steps**: Ensure proper testing, verification, review, and reflection are done by calling `pre_commit_instructions` and applying tests/lints.

5. **Submit Change**: Submit PR with title `⚡ Bolt: Memoize filtered students lists for faster search and rendering`.
