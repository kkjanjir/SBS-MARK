export const calculateClassRank = (myTotal: number, clsName: string, dbStudents: any[]) => {
  if (myTotal === 0) return "";
  const classStudents = dbStudents.filter(s => s.class_name === clsName);
  let allTotals = classStudents.map(s => s.extra_data?.total || 0);
  if (!allTotals.includes(myTotal)) allTotals.push(myTotal);
  allTotals.sort((a, b) => b - a);
  const rank = allTotals.indexOf(myTotal) + 1;
  return rank > 0 ? `${rank}` : "";
};
