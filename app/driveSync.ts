import type { StudentRecord } from './localDb';

declare global {
  interface Window {
    google?: any;
  }
}

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FILE_NAME = 'sbs-marks-backup.json';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureGoogleIdentityLoaded() {
  await loadScript('https://accounts.google.com/gsi/client');
}

export async function getAccessToken(clientId: string, prompt: '' | 'consent' = 'consent'): Promise<string> {
  await ensureGoogleIdentityLoaded();
  return new Promise((resolve, reject) => {
    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (response: { access_token?: string; error?: string }) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || 'Google auth failed'));
          return;
        }
        resolve(response.access_token);
      },
    });

    if (!tokenClient) {
      reject(new Error('Google Identity Services unavailable'));
      return;
    }

    tokenClient.requestAccessToken({ prompt });
  });
}

async function findBackupFile(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent(`name='${BACKUP_FILE_NAME}' and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to check existing backup file on Drive.');
  const data = await res.json();
  return data.files?.[0]?.id || null;
}

export async function backupToDrive(accessToken: string, records: StudentRecord[]): Promise<void> {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'sbs-mark-pro',
    version: 1,
    records,
  };

  const existingFileId = await findBackupFile(accessToken);
  const metadata = existingFileId
    ? { name: BACKUP_FILE_NAME }
    : { name: BACKUP_FILE_NAME, mimeType: 'application/json' };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));

  const method = existingFileId ? 'PATCH' : 'POST';
  const endpoint = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

  const res = await fetch(endpoint, {
    method,
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!res.ok) throw new Error('Drive backup upload failed.');
}

export async function restoreFromDrive(accessToken: string): Promise<StudentRecord[]> {
  const fileId = await findBackupFile(accessToken);
  if (!fileId) throw new Error('No backup file found on Drive.');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to download backup file from Drive.');

  const data = await res.json();
  const records = Array.isArray(data.records) ? data.records : [];
  return records as StudentRecord[];
}
