1. Extract `getDynamicSubjects` and `getGrade` outside the React components.
2. Memoize `classFilteredStudents` to prevent recreating the array on every render.
3. Wrap `getClassSubjects`, `getCalculations`, and `getClassRank` in `useCallback`.
4. Create a top-level `bulkPrintContent` memoized with `useMemo` for `#print-bulk-container` elements.
5. Add learning to `.jules/bolt.md`.
6. Pre-commit check.
7. Submit the PR.
