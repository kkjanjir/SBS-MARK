import { createClient } from '@supabase/supabase-js';
import { backupToDrive, getAccessToken } from './driveSync';
import { getAllRecords, getRecordCount, putManyRecords, type StudentRecord } from './localDb';

export async function fetchOnceFromSupabaseToIndexedDb(): Promise<{ migrated: boolean; message: string }> {
  const localCount = await getRecordCount();
  if (localCount > 0) {
    return { migrated: false, message: `Local database already initialized (${localCount} records).` };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { migrated: false, message: 'Supabase env vars missing. Skipping one-time import.' };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('marks_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return { migrated: false, message: `One-time import failed: ${error.message}` };
  }

  const rows = (data || []) as StudentRecord[];
  await putManyRecords(rows);
  return { migrated: true, message: `Imported ${rows.length} records from Supabase into IndexedDB.` };
}

export async function tryBackgroundDriveBackup(): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return;

  try {
    const token = await getAccessToken(clientId, '');
    const records = await getAllRecords();
    await backupToDrive(token, records);
  } catch {
    // Silent by design: background backup should not interrupt local-first UX.
  }
}
