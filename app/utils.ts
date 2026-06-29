export type MarksState = Record<string, { t1: string; t2: string; t3: string }>;

export const getGrade = (marksObtained: number | string, maxMarks: number) => {
  if (marksObtained === '' || marksObtained === undefined || marksObtained === null) return '';
  const obtained = Number(marksObtained);
  if (isNaN(obtained)) return '';
  const p = (obtained / maxMarks) * 100;
  if (p >= 91) return 'A1';
  if (p >= 81) return 'A2';
  if (p >= 71) return 'B1';
  if (p >= 61) return 'B2';
  if (p >= 51) return 'C1';
  if (p >= 41) return 'C2';
  if (p >= 33) return 'D';
  return 'E';
};

export const getDynamicSubjects = (mObj: MarksState | null | undefined, fallback: string[]) => {
  const markKeys = Object.keys(mObj || {}).filter(Boolean);
  if (markKeys.length === 0) return fallback;
  return [...fallback.filter(sub => markKeys.includes(sub)), ...markKeys.filter(sub => !fallback.includes(sub))];
};

export const getCalculations = (mObj: MarksState | undefined | null, subjects: string[]) => {
  const safeMObj = mObj || {};
  let gTotal = 0;
  subjects.forEach(sub => {
    gTotal += (Number(safeMObj[sub]?.t1) || 0) + (Number(safeMObj[sub]?.t2) || 0) + (Number(safeMObj[sub]?.t3) || 0);
  });
  const mMax = subjects.length * 200;
  const perc = gTotal > 0 ? ((gTotal / mMax) * 100).toFixed(1) : "0";
  const fGrade = gTotal > 0 ? getGrade(gTotal, mMax) : "";
  return { grandTotal: gTotal, percentage: perc, finalGrade: fGrade, maxMarks: mMax };
};
