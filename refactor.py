import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# 1. Add useCallback and useMemo imports if not exist
if 'useCallback' not in content:
    content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect, useMemo, useCallback } from 'react';")
if 'React' not in content:
    content = content.replace("import { useState, useEffect, useMemo, useCallback } from 'react';", "import React, { useState, useEffect, useMemo, useCallback } from 'react';")


# 2. Extract getGrade and getDynamicSubjects out of components
get_grade_func = """const getGrade = (m: number | string, max: number) => {
  if (m === '') return '';
  let p = (Number(m) / max) * 100;
  if (p >= 91) return 'A1'; if (p >= 81) return 'A2'; if (p >= 71) return 'B1'; if (p >= 61) return 'B2';
  if (p >= 51) return 'C1'; if (p >= 41) return 'C2'; if (p >= 33) return 'D'; return 'E';
};"""

get_dyn_sub_func = """const getDynamicSubjects = (mObj: MarksState | null | undefined, fallback: string[]) => {
  const markKeys = Object.keys(mObj || {}).filter(Boolean);
  if (markKeys.length === 0) return fallback;
  return [...fallback.filter(sub => markKeys.includes(sub)), ...markKeys.filter(sub => !fallback.includes(sub))];
};"""

default_objs = """
const defaultStudent = { name: "", roll: "", mother: "", father: "", gender: "MALE" };
const defaultMarksData: MarksState = {};
const defaultExtraData = { attendance: "", remark: "", issueDate: "" };
const defaultCoScholastic: CoScholasticState = { sports: "A", art: "A", music: "A", discipline: "A" };
"""

# Find where to put extracted stuff (before MarksheetApp)
content = content.replace("export default function MarksheetApp() {", f"{get_grade_func}\n\n{get_dyn_sub_func}\n{default_objs}\nexport default function MarksheetApp() {{")

# Remove internal getDynamicSubjects
content = re.sub(r"const getDynamicSubjects = \(mObj: MarksState \| null \| undefined, fallback: string\[]\) => \{\s*const markKeys = Object\.keys\(mObj \|\| \{\}\)\.filter\(Boolean\);\s*if \(markKeys\.length === 0\) return fallback;\s*return \[\.\.\.fallback\.filter\(sub => markKeys\.includes\(sub\)\), \.\.\.markKeys\.filter\(sub => !fallback\.includes\(sub\)\)\];\s*\};\s*", "", content)


# Remove internal getGrade from MarksheetTemplate and MarksheetApp (if any)
content = re.sub(r"const getGrade = \(m: number \| string, max: number\) => \{\s*if \(m === ''\) return '';\s*let p = \(Number\(m\) / max\) \* 100;\s*if \(p >= 91\) return 'A1'; if \(p >= 81\) return 'A2'; if \(p >= 71\) return 'B1'; if \(p >= 61\) return 'B2';\s*if \(p >= 51\) return 'C1'; if \(p >= 41\) return 'C2'; if \(p >= 33\) return 'D'; return 'E';\s*\};\s*", "", content)
content = re.sub(r"const getGrade = \(marksObtained: number \| string, maxMarks: number\) => \{\s*if \(marksObtained === ''\) return '';\s*let p = \(Number\(marksObtained\) / maxMarks\) \* 100;\s*if \(p >= 91\) return 'A1'; if \(p >= 81\) return 'A2'; if \(p >= 71\) return 'B1'; if \(p >= 61\) return 'B2';\s*if \(p >= 51\) return 'C1'; if \(p >= 41\) return 'C2'; if \(p >= 33\) return 'D';  return 'E';\s*\};\s*", "", content)


# 3. Wrap helpers in useCallback
content = re.sub(
    r"const getClassSubjects = \(clsName: string, mObj\?: MarksState\) => getDynamicSubjects\(mObj, subjectConfig\[clsName\] \|\| DEFAULT_SUBJECTS\);",
    r"const getClassSubjects = useCallback((clsName: string, mObj?: MarksState) => getDynamicSubjects(mObj, subjectConfig[clsName] || DEFAULT_SUBJECTS), [subjectConfig]);",
    content
)

content = re.sub(
    r"const getCalculations = \(mObj: MarksState \| undefined \| null, clsName: string\) => \{\s*const safeMObj = mObj \|\| \{\};\s*const subs = getClassSubjects\(clsName, safeMObj\);\s*let gTotal = 0;\s*subs\.forEach\(sub => \{ gTotal \+= \(Number\(safeMObj\[sub\]\?\.t1\)\|\|0\) \+ \(Number\(safeMObj\[sub\]\?\.t2\)\|\|0\) \+ \(Number\(safeMObj\[sub\]\?\.t3\)\|\|0\); \}\);\s*const mMax = subs\.length \* 200;\s*const perc = gTotal > 0 \? \(\(gTotal / mMax\) \* 100\)\.toFixed\(1\) : \"0\";\s*const fGrade = gTotal > 0 \? getGrade\(gTotal, mMax\) : \"\";\s*return \{ grandTotal: gTotal, percentage: perc, finalGrade: fGrade, maxMarks: mMax \};\s*\};",
    r"""const getCalculations = useCallback((mObj: MarksState | undefined | null, clsName: string) => {
    const safeMObj = mObj || {};
    const subs = getClassSubjects(clsName, safeMObj);
    let gTotal = 0;
    subs.forEach(sub => { gTotal += (Number(safeMObj[sub]?.t1)||0) + (Number(safeMObj[sub]?.t2)||0) + (Number(safeMObj[sub]?.t3)||0); });
    const mMax = subs.length * 200;
    const perc = gTotal > 0 ? ((gTotal / mMax) * 100).toFixed(1) : "0";
    const fGrade = gTotal > 0 ? getGrade(gTotal, mMax) : "";
    return { grandTotal: gTotal, percentage: perc, finalGrade: fGrade, maxMarks: mMax };
  }, [getClassSubjects]);""",
    content
)


content = re.sub(
    r"const getClassRank = \(myTotal: number, clsName: string\) => \{\s*if \(myTotal === 0\) return \"\";\s*const classStudents = dbStudents\.filter\(s => s\.class_name === clsName\);\s*let allTotals = classStudents\.map\(s => s\.extra_data\?\.total \|\| 0\);\s*if \(!allTotals\.includes\(myTotal\)\) allTotals\.push\(myTotal\);\s*allTotals\.sort\(\(a, b\) => b - a\);\s*const rank = allTotals\.indexOf\(myTotal\) \+ 1;\s*return rank > 0 \? `\$\{rank\}` : \"\";\s*\};",
    r"""const getClassRank = useCallback((myTotal: number, clsName: string) => {
    if (myTotal === 0) return "";
    const classStudents = dbStudents.filter(s => s.class_name === clsName);
    let allTotals = classStudents.map(s => s.extra_data?.total || 0);
    if (!allTotals.includes(myTotal)) allTotals.push(myTotal);
    allTotals.sort((a, b) => b - a);
    const rank = allTotals.indexOf(myTotal) + 1;
    return rank > 0 ? `${rank}` : "";
  }, [dbStudents]);""",
    content
)


# 4. classFilteredStudents useMemo
content = content.replace(
    "const classFilteredStudents = dbStudents.filter(s => s.class_name === activeClass);",
    "const classFilteredStudents = useMemo(() => dbStudents.filter(s => s.class_name === activeClass), [dbStudents, activeClass]);"
)


# 5. Memoize bulk print mapping
bulk_print_orig = """{classFilteredStudents.map((s, index) => {
          const safeMarks = s.marks_data || {};
          const calcs = getCalculations(safeMarks, s.class_name);
          return (
            <div key={s.id} className="marksheet-page" style={{ pageBreakAfter: index === classFilteredStudents.length - 1 ? 'auto' : 'always' }}>
              <MarksheetTemplate theme={THEMES[activeTheme]} student={s.student_data || {}} marks={safeMarks} subjectsList={getClassSubjects(s.class_name, safeMarks)} grandTotal={calcs.grandTotal} percentage={calcs.percentage} finalGrade={calcs.finalGrade} extra={s.extra_data || {}} coScholastic={s.extra_data?.coScholastic || {sports:'A',art:'A',music:'A',discipline:'A'}} photo={s.student_data?.photo} rank={getClassRank(calcs.grandTotal, s.class_name)} activeClass={s.class_name} showTableWatermark={showTableWatermark} />
            </div>
          )
        })}"""

bulk_print_new_var = """const bulkPrintElements = useMemo(() => {
    return classFilteredStudents.map((s, index) => {
      const safeMarks = s.marks_data || defaultMarksData;
      const calcs = getCalculations(safeMarks, s.class_name);
      return (
        <div key={s.id} className="marksheet-page" style={{ pageBreakAfter: index === classFilteredStudents.length - 1 ? 'auto' : 'always' }}>
          <MarksheetTemplate
             theme={THEMES[activeTheme]}
             student={s.student_data || defaultStudent}
             marks={safeMarks}
             subjectsList={getClassSubjects(s.class_name, safeMarks)}
             grandTotal={calcs.grandTotal}
             percentage={calcs.percentage}
             finalGrade={calcs.finalGrade}
             extra={s.extra_data || defaultExtraData}
             coScholastic={s.extra_data?.coScholastic || defaultCoScholastic}
             photo={s.student_data?.photo}
             rank={getClassRank(calcs.grandTotal, s.class_name)}
             activeClass={s.class_name}
             showTableWatermark={showTableWatermark}
          />
        </div>
      )
    });
  }, [classFilteredStudents, activeTheme, getClassSubjects, getCalculations, getClassRank, showTableWatermark]);"""


content = content.replace("const classFilteredStudents = useMemo(() => dbStudents.filter(s => s.class_name === activeClass), [dbStudents, activeClass]);", f"const classFilteredStudents = useMemo(() => dbStudents.filter(s => s.class_name === activeClass), [dbStudents, activeClass]);\n\n  {bulk_print_new_var}\n")

content = content.replace(bulk_print_orig, "{bulkPrintElements}")


# 6. React.memo for MarksheetTemplate
content = content.replace(
    "function MarksheetTemplate({ theme, student, marks, subjectsList, grandTotal, percentage, finalGrade, extra, coScholastic, photo, rank, activeClass, showTableWatermark }: any) {",
    "const MarksheetTemplate = React.memo(function MarksheetTemplate({ theme, student, marks, subjectsList, grandTotal, percentage, finalGrade, extra, coScholastic, photo, rank, activeClass, showTableWatermark }: any) {"
)

# And close the function bracket properly at the end
# find the end of MarksheetTemplate and add `);`

# the end of MarksheetTemplate looks like:
#         </div>
#       </div>
#     </div>
#   )
# }
content = content.replace("""        </div>
      </div>
    </div>
  )
}""", """        </div>
      </div>
    </div>
  )
});""")


# also update inline usages for single prints (not bulk)

content = content.replace(
    "student={student} marks={marks}",
    "student={student || defaultStudent} marks={marks || defaultMarksData}"
)
content = content.replace(
    "extra={extraDetails} coScholastic={coScholastic}",
    "extra={extraDetails || defaultExtraData} coScholastic={coScholastic || defaultCoScholastic}"
)


with open('app/page.tsx', 'w') as f:
    f.write(content)

print("done")
