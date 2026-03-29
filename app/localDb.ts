export type MarksState = Record<string, { t1: string; t2: string; t3: string }>;
export type CoScholasticState = { sports: string; art: string; music: string; discipline: string };

export type StudentRecord = {
  id: string;
  student_name: string;
  roll_no: string;
  class_name: string;
  student_data: {
    name: string;
    roll: string;
    mother: string;
    father: string;
    gender: string;
    photo?: string | null;
  };
  marks_data: MarksState;
  extra_data: {
    attendance?: string;
    remark?: string;
    issueDate?: string;
    total?: number;
    coScholastic?: CoScholasticState;
  };
  created_at: string;
  updated_at: string;
};

const DB_NAME = 'sbs_offline_db';
const STORE_NAME = 'marks_records';
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('class_name', 'class_name', { unique: false });
        store.createIndex('student_name', 'student_name', { unique: false });
        store.createIndex('roll_no', 'roll_no', { unique: false });
        store.createIndex('updated_at', 'updated_at', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getAllRecords(): Promise<StudentRecord[]> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const req = store.getAll();
  const rows = await new Promise<StudentRecord[]>((resolve, reject) => {
    req.onsuccess = () => resolve((req.result || []) as StudentRecord[]);
    req.onerror = () => reject(req.error);
  });
  await txComplete(tx);
  return rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getRecordCount(): Promise<number> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const req = tx.objectStore(STORE_NAME).count();
  const count = await new Promise<number>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => reject(req.error);
  });
  await txComplete(tx);
  return count;
}

export async function putRecord(record: StudentRecord): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(record);
  await txComplete(tx);
}

export async function putManyRecords(records: StudentRecord[]): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  records.forEach((record) => store.put(record));
  await txComplete(tx);
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  await txComplete(tx);
}

export async function clearAllRecords(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).clear();
  await txComplete(tx);
}

export async function findRecordByNameAndClass(studentName: string, className: string): Promise<StudentRecord | null> {
  const all = await getAllRecords();
  const normalizedName = studentName.trim().toLowerCase();
  const normalizedClass = className.trim().toLowerCase();
  return all.find(
    (row) => row.student_name.trim().toLowerCase() === normalizedName && row.class_name.trim().toLowerCase() === normalizedClass
  ) || null;
}
