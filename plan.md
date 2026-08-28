1. **Extract Pure Functions**
   - Extract `getDynamicSubjects` and `getGrade` outside of `MarksheetApp` and `MarksheetTemplate`. Both are pure functions that don't need component state or props to be evaluated.
   - `getGrade` is defined twice (lines 417 and 1200); both can be replaced with a single external function.

2. **Memoize Helper Functions**
   - Wrap `getClassSubjects`, `getCalculations`, and `getClassRank` in `useCallback` since they depend on state (`subjectConfig`, `dbStudents`).
   - Extracting them prevents them from breaking dependencies in `useMemo` later.

3. **Wrap MarksheetTemplate in React.memo**
   - `export const MemoizedMarksheetTemplate = React.memo(MarksheetTemplate);`
   - Use `MemoizedMarksheetTemplate` in both `#print-single-container` and `#print-bulk-container`.

4. **Memoize Bulk Print Mapping**
   - The hidden `#print-bulk-container` mapping logic maps over `classFilteredStudents`.
   - We should wrap the whole mapping logic in a `useMemo` block that depends on `classFilteredStudents`, `THEMES[activeTheme]`, `showTableWatermark`, `getClassSubjects`, `getCalculations`, `getClassRank`.
   - `const bulkMarksheets = useMemo(() => classFilteredStudents.map(...), [classFilteredStudents, activeTheme, showTableWatermark, getClassSubjects, getCalculations, getClassRank]);`
   - Wait, `classFilteredStudents` is currently computed without `useMemo`. We should memoize `classFilteredStudents` as well: `const classFilteredStudents = useMemo(() => dbStudents.filter(s => s.class_name === activeClass), [dbStudents, activeClass]);`

5. **Type Checking and Validation**
   - Use a Python script via `run_in_bash_session` to perform the string replacements on `app/page.tsx` and run local typecheck (`npx tsc`) to ensure there are no compilation errors.

6. **Complete pre-commit steps**
   - Complete pre commit steps to ensure proper testing, verification, review, and reflection are done.

7. **Create a Pull Request**
   - Use the `submit` tool to create a PR titled "⚡ Bolt: [performance improvement]" detailing the optimization and its impact as per the instructions.
