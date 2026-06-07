1.  **Analyze current performance bottlenecks:**
    -   `getDynamicSubjects`, `getGrade`, `getClassSubjects` and `getCalculations` functions are re-created inside the React render cycle or inline in the `MarksheetApp` and `MarksheetTemplate` components, and inside the `.map()` block for `print-bulk-container`.
    -   `classFilteredStudents` is calculated directly on every render.
    -   The `print-bulk-container` (`display: none` for screen but executes render cycles) iterates over `classFilteredStudents` and calls `getCalculations`, `getClassSubjects`, `getClassRank` repeatedly for every row on *every single render* of `MarksheetApp`. This causes massive O(N) recalculations on any state change.

2.  **Implementation steps:**
    -   Extract `getGrade` outside of the components.
    -   Extract `getDynamicSubjects` outside of the components.
    -   Add `useMemo` and `useCallback` to `import { useState, useEffect, useMemo, useCallback } from 'react';`
    -   Memoize `classFilteredStudents` using `useMemo` in `MarksheetApp`.
    -   Memoize the entire `print-bulk-container` inner content (the `.map` over `classFilteredStudents`) using `useMemo` assigning it to a variable, e.g., `bulkPrintContent`. This ensures this extremely expensive rendering block is only computed when `classFilteredStudents`, `dbStudents` or related configuration state changes, rather than on every single input stroke.
    -   Extract `getClassRank` to be more efficient, maybe wrapping it in `useCallback` or making sure it doesn't do an O(N^2) operation every time. Wait, `getClassRank` is called inside `.map` and inside the preview render.

3.  **Specific code changes:**
    -   Move `getGrade`, `getDynamicSubjects`, `getClassSubjects`, `getCalculations` outside `MarksheetApp` or use `useCallback` for them if they depend on state. Wait, `getGrade` is purely functional. Let's move it outside. `getDynamicSubjects` is also purely functional. Let's move it outside.
    -   `getClassSubjects` depends on `subjectConfig`, so it needs to stay inside, but wrap it in `useCallback`.
    -   `getCalculations` depends on `getClassSubjects`.
    -   Memoize `classFilteredStudents`: `const classFilteredStudents = useMemo(() => dbStudents.filter(s => s.class_name === activeClass), [dbStudents, activeClass]);`
    -   Memoize the print container loop:
        ```javascript
        const bulkPrintContent = useMemo(() => {
          return classFilteredStudents.map((s, index) => {
            const safeMarks = s.marks_data || {};
            const calcs = getCalculations(safeMarks, s.class_name);
            return (
              <div key={s.id} className="marksheet-page" style={{ pageBreakAfter: index === classFilteredStudents.length - 1 ? 'auto' : 'always' }}>
                <MarksheetTemplate theme={THEMES[activeTheme]} student={s.student_data || {}} marks={safeMarks} subjectsList={getClassSubjects(s.class_name, safeMarks)} grandTotal={calcs.grandTotal} percentage={calcs.percentage} finalGrade={calcs.finalGrade} extra={s.extra_data || {}} coScholastic={s.extra_data?.coScholastic || {sports:'A',art:'A',music:'A',discipline:'A'}} photo={s.student_data?.photo} rank={getClassRank(calcs.grandTotal, s.class_name)} activeClass={s.class_name} showTableWatermark={showTableWatermark} />
              </div>
            );
          });
        }, [classFilteredStudents, activeTheme, showTableWatermark, getCalculations, getClassSubjects, getClassRank]);
        ```
    -   To do the above, `getCalculations`, `getClassSubjects`, and `getClassRank` must be stable, meaning wrapped in `useCallback`.

4.  **Journal Entry:**
    -   Add learning to `.jules/bolt.md` about `display: none` print containers in React still rendering fully on every state change and needing intense memoization.

5.  **Pre-commit steps:**
    -   Run `pre_commit_instructions`.

6.  **Submit PR:**
    -   Submit with descriptive PR title and performance metrics.
