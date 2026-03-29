# SBS-MARK

## Offline-first storage + one-time Supabase migration

Set these variables in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_GEMINI_API_KEY=...
```

### How it works

1. On startup, the app checks IndexedDB first.
2. If local DB already has records, Supabase is **not** called.
3. If local DB is empty and internet is available, it performs one-time import from Supabase `marks_records` into IndexedDB.
4. After initialization, reads/writes are local-only (offline-first), and editor changes are auto-saved.
5. A background Drive backup attempt runs silently after local updates (plus manual backup/restore buttons).
6. You can also import a Supabase CSV export from the dashboard via **Import CSV**.
7. Use **Scan Class Sheet** to upload handwritten class sheets; Gemini extracts batch student marks and the app upserts them into IndexedDB.

### Google Drive backup/restore setup

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create/select a project.
3. Enable **Google Drive API**.
4. Configure OAuth consent screen (External/Internal as needed).
5. Create **OAuth Client ID** for **Web application**.
6. Add authorized JavaScript origins for your app domains (e.g. `http://localhost:3000`).
7. Copy Client ID into `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
8. In app dashboard, use **Backup to Drive** / **Restore from Drive**.

The backup file name is `sbs-marks-backup.json` in user Drive.
