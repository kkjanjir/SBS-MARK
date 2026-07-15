import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# 1. Extract getDynamicSubjects
get_dynamic_subjects = """const getDynamicSubjects = (mObj: MarksState | null | undefined, fallback: string[]) => {
    const markKeys = Object.keys(mObj || {}).filter(Boolean);
    if (markKeys.length === 0) return fallback;
    return [...fallback.filter(sub => markKeys.includes(sub)), ...markKeys.filter(sub => !fallback.includes(sub))];
  };"""

new_get_dynamic_subjects = """// Extracted purely functional helper
const getDynamicSubjects = (mObj: MarksState | null | undefined, fallback: string[]) => {
  const markKeys = Object.keys(mObj || {}).filter(Boolean);
  if (markKeys.length === 0) return fallback;
  return [...fallback.filter(sub => markKeys.includes(sub)), ...markKeys.filter(sub => !fallback.includes(sub))];
};"""

content = content.replace("  " + get_dynamic_subjects + "\n\n", "")
if new_get_dynamic_subjects not in content:
  content = content.replace("type AiDraftRow = { student_name: string; roll_no?: string; subjects: Record<string, { t1?: string; t2?: string; t3?: string }> };", "type AiDraftRow = { student_name: string; roll_no?: string; subjects: Record<string, { t1?: string; t2?: string; t3?: string }> };\n\n" + new_get_dynamic_subjects)

# 2. Extract getGrade
get_grade_str = """  const getGrade = (marksObtained: number | string, maxMarks: number) => {
    if (marksObtained === '') return '';
    let p = (Number(marksObtained) / maxMarks) * 100;
    if (p >= 91) return 'A1'; if (p >= 81) return 'A2'; if (p >= 71) return 'B1'; if (p >= 61) return 'B2';
    if (p >= 51) return 'C1'; if (p >= 41) return 'C2'; if (p >= 33) return 'D';  return 'E';
  };"""

new_get_grade_str = """// Extracted purely functional helper
const getGrade = (marksObtained: number | string, maxMarks: number) => {
  if (marksObtained === '') return '';
  let p = (Number(marksObtained) / maxMarks) * 100;
  if (p >= 91) return 'A1'; if (p >= 81) return 'A2'; if (p >= 71) return 'B1'; if (p >= 61) return 'B2';
  if (p >= 51) return 'C1'; if (p >= 41) return 'C2'; if (p >= 33) return 'D';  return 'E';
};"""

content = content.replace(get_grade_str + "\n\n", "")
if new_get_grade_str not in content:
  content = content.replace(new_get_dynamic_subjects, new_get_dynamic_subjects + "\n\n" + new_get_grade_str)

get_grade_in_marksheet = """  const getGrade = (m: number | string, max: number) => {
    if (m === '') return '';
    let p = (Number(m) / max) * 100;
    if (p >= 91) return 'A1'; if (p >= 81) return 'A2'; if (p >= 71) return 'B1'; if (p >= 61) return 'B2';
    if (p >= 51) return 'C1'; if (p >= 41) return 'C2'; if (p >= 33) return 'D'; return 'E';
  };"""
content = content.replace(get_grade_in_marksheet + "\n\n", "")

default_objects = """
// Default static objects to preserve React.memo shallow equality
const defaultStudentData = { name: "", roll: "", mother: "", father: "", gender: "MALE" };
const defaultMarksData: MarksState = {};
const defaultExtraData = { attendance: "", remark: "", issueDate: defaultIssue };
const defaultCoScholasticData: CoScholasticState = { sports: "A", art: "A", music: "A", discipline: "A" };
"""

if "const defaultStudentData =" not in content:
  content = content.replace("export default function MarksheetApp() {", default_objects + "\nexport default function MarksheetApp() {")

old_get_class_subjects = "const getClassSubjects = (clsName: string, mObj?: MarksState) => getDynamicSubjects(mObj, subjectConfig[clsName] || DEFAULT_SUBJECTS);"
new_get_class_subjects = """const getClassSubjects = useCallback((clsName: string, mObj?: MarksState) =>
    getDynamicSubjects(mObj, subjectConfig[clsName] || DEFAULT_SUBJECTS),
  [subjectConfig]);"""
content = content.replace(old_get_class_subjects, new_get_class_subjects)

old_get_calculations = """  const getCalculations = (mObj: MarksState | undefined | null, clsName: string) => {
    const safeMObj = mObj || {};
    const subs = getClassSubjects(clsName, safeMObj);
    let gTotal = 0;
    subs.forEach(sub => { gTotal += (Number(safeMObj[sub]?.t1)||0) + (Number(safeMObj[sub]?.t2)||0) + (Number(safeMObj[sub]?.t3)||0); });
    const mMax = subs.length * 200;
    const perc = gTotal > 0 ? ((gTotal / mMax) * 100).toFixed(1) : "0";
    const fGrade = gTotal > 0 ? getGrade(gTotal, mMax) : "";
    return { grandTotal: gTotal, percentage: perc, finalGrade: fGrade, maxMarks: mMax };
  };"""
new_get_calculations = """  const getCalculations = useCallback((mObj: MarksState | undefined | null, clsName: string) => {
    const safeMObj = mObj || {};
    const subs = getClassSubjects(clsName, safeMObj);
    let gTotal = 0;
    subs.forEach(sub => { gTotal += (Number(safeMObj[sub]?.t1)||0) + (Number(safeMObj[sub]?.t2)||0) + (Number(safeMObj[sub]?.t3)||0); });
    const mMax = subs.length * 200;
    const perc = gTotal > 0 ? ((gTotal / mMax) * 100).toFixed(1) : "0";
    const fGrade = gTotal > 0 ? getGrade(gTotal, mMax) : "";
    return { grandTotal: gTotal, percentage: perc, finalGrade: fGrade, maxMarks: mMax };
  }, [getClassSubjects]);"""
content = content.replace(old_get_calculations, new_get_calculations)

old_get_class_rank = """  const getClassRank = (myTotal: number, clsName: string) => {
    if (myTotal === 0) return "";
    const classStudents = dbStudents.filter(s => s.class_name === clsName);
    let allTotals = classStudents.map(s => s.extra_data?.total || 0);
    if (!allTotals.includes(myTotal)) allTotals.push(myTotal);
    allTotals.sort((a, b) => b - a);
    const rank = allTotals.indexOf(myTotal) + 1;
    return rank > 0 ? `${rank}` : "";
  };"""
new_get_class_rank = """  const getClassRank = useCallback((myTotal: number, clsName: string) => {
    if (myTotal === 0) return "";
    const classStudents = dbStudents.filter(s => s.class_name === clsName);
    let allTotals = classStudents.map(s => s.extra_data?.total || 0);
    if (!allTotals.includes(myTotal)) allTotals.push(myTotal);
    allTotals.sort((a, b) => b - a);
    const rank = allTotals.indexOf(myTotal) + 1;
    return rank > 0 ? `${rank}` : "";
  }, [dbStudents]);"""
content = content.replace(old_get_class_rank, new_get_class_rank)

if "useCallback" not in content.split("\n")[1]:
  content = content.replace("import { useState, useEffect } from 'react';", "import React, { useState, useEffect, useCallback, useMemo } from 'react';")
elif "React, {" not in content.split("\n")[1]:
  content = content.replace("import { useState, useEffect, useCallback, useMemo } from 'react';", "import React, { useState, useEffect, useCallback, useMemo } from 'react';")

old_bulk_print = """      <div id="print-bulk-container" className="print-area">
        {classFilteredStudents.map((s, index) => {
          const safeMarks = s.marks_data || {};
          const calcs = getCalculations(safeMarks, s.class_name);
          return (
            <div key={s.id} className="marksheet-page" style={{ pageBreakAfter: index === classFilteredStudents.length - 1 ? 'auto' : 'always' }}>
              <MarksheetTemplate theme={THEMES[activeTheme]} student={s.student_data || {}} marks={safeMarks} subjectsList={getClassSubjects(s.class_name, safeMarks)} grandTotal={calcs.grandTotal} percentage={calcs.percentage} finalGrade={calcs.finalGrade} extra={s.extra_data || {}} coScholastic={s.extra_data?.coScholastic || {sports:'A',art:'A',music:'A',discipline:'A'}} photo={s.student_data?.photo} rank={getClassRank(calcs.grandTotal, s.class_name)} activeClass={s.class_name} showTableWatermark={showTableWatermark} />
            </div>
          )
        })}
      </div>"""
new_bulk_print = """      <div id="print-bulk-container" className="print-area">
        {bulkPrintContent}
      </div>"""
content = content.replace(old_bulk_print, new_bulk_print)

old_filtered_students = "const classFilteredStudents = dbStudents.filter(s => s.class_name === activeClass);"
new_filtered_students = """  const classFilteredStudents = useMemo(() => dbStudents.filter(s => s.class_name === activeClass), [dbStudents, activeClass]);

  const bulkPrintContent = useMemo(() => {
    return classFilteredStudents.map((s, index) => {
      const safeMarks = s.marks_data || defaultMarksData;
      const calcs = getCalculations(safeMarks, s.class_name);
      return (
        <div key={s.id} className="marksheet-page" style={{ pageBreakAfter: index === classFilteredStudents.length - 1 ? 'auto' : 'always' }}>
          <MarksheetTemplate
            theme={THEMES[activeTheme] || THEMES.classic}
            student={s.student_data || defaultStudentData}
            marks={safeMarks}
            subjectsList={getClassSubjects(s.class_name, safeMarks)}
            grandTotal={calcs.grandTotal}
            percentage={calcs.percentage}
            finalGrade={calcs.finalGrade}
            extra={s.extra_data || defaultExtraData}
            coScholastic={s.extra_data?.coScholastic || defaultCoScholasticData}
            photo={s.student_data?.photo}
            rank={getClassRank(calcs.grandTotal, s.class_name)}
            activeClass={s.class_name}
            showTableWatermark={showTableWatermark}
          />
        </div>
      )
    });
  }, [classFilteredStudents, activeTheme, getCalculations, getClassSubjects, getClassRank, showTableWatermark]);"""
content = content.replace(old_filtered_students, new_filtered_students)

old_template = "function MarksheetTemplate({ theme, student, marks, subjectsList, grandTotal, percentage, finalGrade, extra, coScholastic, photo, rank, activeClass, showTableWatermark }: any) {"
new_template = "const MarksheetTemplate = React.memo(({ theme, student, marks, subjectsList, grandTotal, percentage, finalGrade, extra, coScholastic, photo, rank, activeClass, showTableWatermark }: any) => {"
content = content.replace(old_template, new_template)

old_close = "  )\n}\n"
new_close = "  )\n});\n"
content = new_close.join(content.rsplit(old_close, 1))

with open('app/page.tsx', 'w') as f:
    f.write(content)
print("Applied edits!")
