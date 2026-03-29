import type { StudentRecord } from './localDb';

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function splitCsvRows(text: string): string[] {
  const rows: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '""';
        i += 1;
      } else {
        inQuotes = !inQuotes;
        current += char;
      }
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (current.trim()) rows.push(current);
      current = '';
      if (char === '\r' && next === '\n') i += 1;
      continue;
    }

    current += char;
  }

  if (current.trim()) rows.push(current);
  return rows;
}

function parseJsonField<T>(value: string, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function parseSupabaseCsv(text: string): StudentRecord[] {
  const rows = splitCsvRows(text);
  if (rows.length < 2) return [];

  const headers = parseCsvLine(rows[0]).map((h) => h.trim());
  const index = (name: string) => headers.indexOf(name);

  const result: StudentRecord[] = [];

  for (let i = 1; i < rows.length; i += 1) {
    const values = parseCsvLine(rows[i]);
    const get = (name: string) => values[index(name)] ?? '';

    const studentName = get('student_name');
    const rollNo = get('roll_no');
    const className = get('class_name');
    if (!studentName || !rollNo || !className) continue;

    const id = get('id') || crypto.randomUUID();
    const studentData = parseJsonField(get('student_data'), {
      name: studentName,
      roll: rollNo,
      mother: '',
      father: '',
      gender: 'MALE',
      photo: null,
    });

    const marksData = parseJsonField(get('marks_data'), {});
    const extraData = parseJsonField(get('extra_data'), {});

    result.push({
      id,
      student_name: studentName,
      roll_no: rollNo,
      class_name: className,
      student_data: studentData,
      marks_data: marksData,
      extra_data: extraData,
      created_at: get('created_at') || new Date().toISOString(),
      updated_at: get('updated_at') || new Date().toISOString(),
    });
  }

  return result;
}
