1. **Understand the problem**:
   - `app/page.tsx` is a large monolithic React component.
   - Elements hidden via CSS (like print containers with `display: none` such as `#print-bulk-container`) still execute full React render cycles.
   - `classFilteredStudents` is used to map over students and render `MarksheetTemplate` instances.
   - In `#print-bulk-container`, `classFilteredStudents.map(...)` renders a `MarksheetTemplate` for each student. This causes O(N) re-renders for every state change in `app/page.tsx` because React re-renders everything.
   - We need to strongly memoize heavy computations or loops inside hidden print containers to prevent application-wide input lag.

2. **Add `useMemo` imports**:
   - Update `import { useState, useEffect } from 'react';` to `import { useState, useEffect, useMemo, useCallback } from 'react';`

3. **Wrap helper functions with `useCallback`**:
   - `getCalculations`
   - `getClassSubjects`
   - `getDynamicSubjects`
   - `getGrade`
   - `getClassRank`
   - These are used in the mapping logic of `#print-bulk-container`. If they aren't memoized, `useMemo` caching inside the component will be invalidated, or we need to ensure they don't break rules of hooks by moving them up before early returns (`if (!isUnlocked)`).

4. **Memoize the mapped students**:
   - `const classFilteredStudents = useMemo(() => dbStudents.filter(s => s.class_name === activeClass), [dbStudents, activeClass]);`

5. **Memoize the bulk print UI**:
   - The bulk print mapping:
     ```tsx
     const bulkPrintContent = useMemo(() => {
       return classFilteredStudents.map((s, index) => {
         const safeMarks = s.marks_data || {};
         const calcs = getCalculations(safeMarks, s.class_name);
         return (
           <div key={s.id} className="marksheet-page" style={{ pageBreakAfter: index === classFilteredStudents.length - 1 ? 'auto' : 'always' }}>
             <MarksheetTemplate theme={THEMES[activeTheme]} student={s.student_data || {}} marks={safeMarks} subjectsList={getClassSubjects(s.class_name, safeMarks)} grandTotal={calcs.grandTotal} percentage={calcs.percentage} finalGrade={calcs.finalGrade} extra={s.extra_data || {}} coScholastic={s.extra_data?.coScholastic || {sports:'A',art:'A',music:'A',discipline:'A'}} photo={s.student_data?.photo} rank={getClassRank(calcs.grandTotal, s.class_name)} activeClass={s.class_name} showTableWatermark={showTableWatermark} />
           </div>
         )
       })
     }, [classFilteredStudents, activeTheme, showTableWatermark, getCalculations, getClassSubjects, getClassRank]);
     ```

6. **Refactor `app/page.tsx` to apply this**:
   - Use `useCallback` for helpers to avoid them changing on every render.
   - Replace `<div id="print-bulk-container" className="print-area">{classFilteredStudents.map(...)}</div>` with `<div id="print-bulk-container" className="print-area">{bulkPrintContent}</div>`

7. **Pre-commit**:
   - Run type checks and linters.

8. **Submit**.
