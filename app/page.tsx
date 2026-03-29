'use client'
import { useState, useEffect, useRef } from 'react';
import { Search, Plus, ChevronRight, ChevronLeft, Printer, Home, Save, Loader2, Folder, Image as ImageIcon, Settings, X, Trash2, LogOut, Download, Upload, FileUp, ScanLine } from 'lucide-react';
import { clearAllRecords, deleteRecord, findRecordByNameAndClass, getAllRecords, putManyRecords, putRecord, type CoScholasticState, type MarksState, type StudentRecord } from './localDb';
import { extractStudentsFromClassSheet, fileToBase64, type GeminiScannedStudent } from './geminiBatchScan';
import AiChatWidget from './AiChatWidget';

// ❌ Computer removed from default subjects
const DEFAULT_SUBJECTS = ['HINDI', 'ENGLISH', 'MATHEMATICS', 'SCIENCE', 'SOCIAL SCIENCE', 'ART AND DRAWING', 'G.K.'];
const remarksList = ["Excellent performance, keep it up!", "Good effort, can do better in Science.", "Needs to focus more on studies.", "Outstanding participation in class."];

// 🎨 5 PREMIUM THEMES
const THEMES = {
  classic: { id: 'classic', name: 'Classic Red', border: 'border-red-700', text: 'text-red-700', bg: 'bg-red-700', textSecondary: 'text-blue-900', bgHeader: 'bg-orange-100', bgHighlight: 'bg-cyan-50', ring: 'ring-red-700' },
  emerald: { id: 'emerald', name: 'Emerald Green', border: 'border-emerald-700', text: 'text-emerald-700', bg: 'bg-emerald-700', textSecondary: 'text-slate-800', bgHeader: 'bg-emerald-100', bgHighlight: 'bg-slate-100', ring: 'ring-emerald-700' },
  royal: { id: 'royal', name: 'Royal Purple', border: 'border-purple-800', text: 'text-purple-800', bg: 'bg-purple-800', textSecondary: 'text-amber-800', bgHeader: 'bg-purple-100', bgHighlight: 'bg-amber-50', ring: 'ring-purple-800' },
  ocean: { id: 'ocean', name: 'Ocean Blue', border: 'border-blue-700', text: 'text-blue-700', bg: 'bg-blue-700', textSecondary: 'text-gray-800', bgHeader: 'bg-blue-100', bgHighlight: 'bg-indigo-50', ring: 'ring-blue-700' },
  sunset: { id: 'sunset', name: 'Sunset Orange', border: 'border-orange-600', text: 'text-orange-600', bg: 'bg-orange-600', textSecondary: 'text-stone-800', bgHeader: 'bg-orange-100', bgHighlight: 'bg-yellow-50', ring: 'ring-orange-600' }
};

const currentYear = new Date().getFullYear();
const defaultIssue = new Date().getMonth() > 3 ? `${currentYear + 1}-03-31` : `${currentYear}-03-31`;

export default function MarksheetApp() {
  // APP STATES
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClass, setActiveClass] = useState<string>('5'); 
  const [showPrePrimary, setShowPrePrimary] = useState(false);
  const [activeTheme, setActiveTheme] = useState<'classic'|'emerald'|'royal'|'ocean'|'sunset'>('classic');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [subjectConfig, setSubjectConfig] = useState<Record<string, string[]>>({});
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [tempSubjects, setTempSubjects] = useState<string[]>([]);
  const [newSubInput, setNewSubInput] = useState('');

  const [dbStudents, setDbStudents] = useState<StudentRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [lastSaved, setLastSaved] = useState('');
  const [migrationStatus, setMigrationStatus] = useState('');
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [isScanningSheet, setIsScanningSheet] = useState(false);
  const [isApplyingScan, setIsApplyingScan] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [scanDraftRows, setScanDraftRows] = useState<GeminiScannedStudent[]>([]);
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const jsonImportRef = useRef<HTMLInputElement | null>(null);
  const scanInputRef = useRef<HTMLInputElement | null>(null);

  // 📝 NEW STATE: Single Subject Entry Tracker
  const [activeSubjectIdx, setActiveSubjectIdx] = useState(0);

  // Removed admission and address
  const [student, setStudent] = useState({ name: "", roll: "", mother: "", father: "", gender: "MALE" });
  const [extraDetails, setExtraDetails] = useState({ attendance: "", remark: "", issueDate: defaultIssue });
  const [coScholastic, setCoScholastic] = useState<CoScholasticState>({ sports: "A", art: "A", music: "A", discipline: "A" });
  const [studentPhoto, setStudentPhoto] = useState<string | null>(null);
  const [marks, setMarks] = useState<MarksState>({});

  function getSubjectsFromMarks(marksData: MarksState | undefined) {
    return Object.keys(marksData || {}).map((s) => s.trim()).filter(Boolean);
  }

  function getSubjectsForClass(clsName: string, marksData?: MarksState) {
    const configured = subjectConfig[clsName] || [];
    const classSubjects = dbStudents
      .filter((row) => row.class_name === clsName)
      .flatMap((row) => getSubjectsFromMarks(row.marks_data));
    const adHoc = getSubjectsFromMarks(marksData);
    const merged = Array.from(new Set([...configured, ...classSubjects, ...adHoc]));
    return merged.length ? merged : DEFAULT_SUBJECTS;
  }

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
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
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
          current += '"';
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

  function normalizeHeader(header: string) {
    return header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  const standardHeaderMap: Record<string, 'name' | 'roll' | 'class' | 'mother' | 'father' | 'gender'> = {
    name: 'name',
    studentname: 'name',
    roll: 'roll',
    rollno: 'roll',
    rollnumber: 'roll',
    class: 'class',
    classname: 'class',
    mother: 'mother',
    mothersname: 'mother',
    father: 'father',
    fathersname: 'father',
    gender: 'gender',
  };

  const currentSubjectsList = getSubjectsForClass(activeClass, marks);

  // 🌐 OFFLINE ENGINE (Service Worker)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW Registration failed: ', err));
    }
  }, []);

  useEffect(() => {
    const savedConfig = localStorage.getItem('sbsSubjects');
    if (savedConfig) setSubjectConfig(JSON.parse(savedConfig));
    const savedTheme = localStorage.getItem('sbsTheme') as any;
    if (savedTheme && THEMES[savedTheme]) setActiveTheme(savedTheme);
    resetMarks();
  }, [activeClass]);

  // Reset Active Subject Index when switching steps
  useEffect(() => {
    setActiveSubjectIdx(0);
  }, [step]);

  const loadStudentsFromLocal = async () => {
    setIsLoadingList(true);
    const data = await getAllRecords();
    setDbStudents(data);
    setIsLoadingList(false);
  };

  useEffect(() => {
    const bootstrap = async () => {
      setMigrationStatus('Loading local IndexedDB data...');
      await loadStudentsFromLocal();
      setMigrationStatus('Local IndexedDB ready.');
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (view === 'dashboard') loadStudentsFromLocal();
  }, [view]);

  const handleLogout = async () => { setView('dashboard'); };
  const handleDetailChange = (e: any) => { setStudent({ ...student, [e.target.name]: e.target.value.toUpperCase() }); };

  const handleMarkChange = (sub: string, term: 't1' | 't2' | 't3', value: string) => {
    let max = term === 't1' ? 40 : term === 't2' ? 60 : 100;
    if (value !== '') { let numVal = Number(value); if (numVal < 0 || numVal > max) return; }
    setMarks(prev => ({ ...prev, [sub]: { ...(prev[sub] || {t1:'', t2:'', t3:''}), [term]: value } }));
  };

  const handleNextSubject = () => {
    if (activeSubjectIdx < currentSubjectsList.length - 1) {
      setActiveSubjectIdx(prev => prev + 1);
    } else {
      setStep(s => Math.min(5, s + 1));
    }
  };

  const handlePrevSubject = () => {
    if (activeSubjectIdx > 0) setActiveSubjectIdx(prev => prev - 1);
  };

  const handlePhotoUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setStudentPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const deleteStudent = async (id: string, name: string, e: any) => {
    e.stopPropagation(); 
    if (window.confirm(`WARNING: Are you sure you want to permanently delete the marksheet for ${name}?`)) {
      setIsLoadingList(true);
      await deleteRecord(id);
      setDbStudents(prev => prev.filter(s => s.id !== id));
      setIsLoadingList(false);
    }
  };

  const saveToCloud = async (addNext: boolean = false) => {
    if (!student.name || !student.roll) { alert("Student Name and Roll No required!"); return; }
    
    let myTotal = getCalculations(marks, activeClass).grandTotal;
    const now = new Date().toISOString();
    const payload: StudentRecord = {
      id: editingId || crypto.randomUUID(),
      student_name: student.name,
      roll_no: student.roll,
      class_name: activeClass,
      student_data: { ...student, photo: studentPhoto },
      marks_data: marks,
      extra_data: { ...extraDetails, coScholastic, total: myTotal },
      created_at: editingId ? (dbStudents.find(s => s.id === editingId)?.created_at || now) : now,
      updated_at: now,
    };

    setIsSaving(true);
    if (!editingId) {
      const isDuplicate = dbStudents.some(s => s.class_name === activeClass && s.roll_no === student.roll && s.student_name.toUpperCase() === student.name.toUpperCase());
      if (isDuplicate) {
        setIsSaving(false);
        alert(`Duplicate Entry: ${student.name} (Roll ${student.roll}) is already saved in Class ${activeClass}!`);
        return;
      }
    }
    await putRecord(payload);

    setIsSaving(false);
    await loadStudentsFromLocal();
    setLastSaved(`Saved locally: ${student.name} (Roll: ${student.roll})`);
    if (addNext) {
      const nextRoll = isNaN(Number(student.roll)) ? "" : (Number(student.roll) + 1).toString();
      setStudent({ name: "", roll: nextRoll, mother: "", father: "", gender: "MALE" });
      resetMarks(true);
      setStep(1);
      setTimeout(() => setLastSaved(''), 4000);
    } else {
      setView('dashboard');
      resetMarks(false);
    }
  };

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (view !== 'editor') return;
    if (!student.name || !student.roll) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      const now = new Date().toISOString();
      const total = getCalculations(marks, activeClass).grandTotal;
      const draftId = editingId || `draft-${activeClass}-${student.roll}-${student.name}`.replace(/\s+/g, '-');
      const existing = dbStudents.find((s) => s.id === draftId);
      const payload: StudentRecord = {
        id: draftId,
        student_name: student.name,
        roll_no: student.roll,
        class_name: activeClass,
        student_data: { ...student, photo: studentPhoto },
        marks_data: marks,
        extra_data: { ...extraDetails, coScholastic, total },
        created_at: existing?.created_at || now,
        updated_at: now,
      };
      await putRecord(payload);
      if (!editingId) setEditingId(draftId);
      await loadStudentsFromLocal();
    }, 180);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [marks, student, extraDetails, coScholastic, studentPhoto, activeClass, view]);

  // Accepts a parameter to keep attendance intact
  const resetMarks = (preserveAttendance: boolean = false) => {
    setEditingId(null);
    const initial: MarksState = {};
    const subList = getSubjectsForClass(activeClass);
    subList.forEach(sub => { initial[sub] = { t1: '', t2: '', t3: '' }; });
    setMarks(initial);
    setExtraDetails(prev => ({ 
      attendance: preserveAttendance ? prev.attendance : "", 
      remark: "", 
      issueDate: defaultIssue 
    }));
    setCoScholastic({ sports: "A", art: "A", music: "A", discipline: "A" });
    setStudentPhoto(null);
    setActiveSubjectIdx(0);
  };

  const getGrade = (marksObtained: number | string, maxMarks: number) => {
    if (marksObtained === '') return '';
    let p = (Number(marksObtained) / maxMarks) * 100;
    if (p >= 91) return 'A1'; if (p >= 81) return 'A2'; if (p >= 71) return 'B1'; if (p >= 61) return 'B2';
    if (p >= 51) return 'C1'; if (p >= 41) return 'C2'; if (p >= 33) return 'D';  return 'E';
  };

  const getCalculations = (mObj: MarksState, clsName: string) => {
    const subs = getSubjectsForClass(clsName, mObj);
    let gTotal = 0;
    subs.forEach(sub => { gTotal += (Number(mObj[sub]?.t1)||0) + (Number(mObj[sub]?.t2)||0) + (Number(mObj[sub]?.t3)||0); });
    const mMax = subs.length * 200;
    const perc = gTotal > 0 ? ((gTotal / mMax) * 100).toFixed(1) : "0";
    const fGrade = gTotal > 0 ? getGrade(gTotal, mMax) : "";
    return { grandTotal: gTotal, percentage: perc, finalGrade: fGrade, maxMarks: mMax };
  };

  const { grandTotal, percentage, finalGrade } = getCalculations(marks, activeClass);

  useEffect(() => {
    if (step === 5 && !extraDetails.remark && finalGrade) {
      let autoRemark = "Good effort.";
      if (finalGrade === 'A1') autoRemark = "Outstanding performance! Keep it up.";
      else if (finalGrade === 'A2') autoRemark = "Excellent work. Very proud of you.";
      else if (finalGrade === 'B1' || finalGrade === 'B2') autoRemark = "Good performance. Can do even better.";
      else if (finalGrade === 'C1' || finalGrade === 'C2') autoRemark = "Average performance. Needs more focus.";
      else if (finalGrade === 'D' || finalGrade === 'E') autoRemark = "Needs serious attention and hard work.";
      setExtraDetails(prev => ({ ...prev, remark: autoRemark }));
    }
  }, [step, finalGrade]);

  const getClassRank = (myTotal: number, clsName: string) => {
    if (myTotal === 0) return "";
    const classStudents = dbStudents.filter(s => s.class_name === clsName);
    let allTotals = classStudents.map(s => s.extra_data?.total || 0);
    if (!allTotals.includes(myTotal)) allTotals.push(myTotal); 
    allTotals.sort((a, b) => b - a); 
    const rank = allTotals.indexOf(myTotal) + 1;
    return rank > 0 ? `${rank}` : "";
  };

  const saveSubjects = () => {
    const newConfig = { ...subjectConfig, [activeClass]: tempSubjects };
    setSubjectConfig(newConfig);
    localStorage.setItem('sbsSubjects', JSON.stringify(newConfig));
    setShowSubjectModal(false);
    resetMarks(false);
  };


  const handleCsvFileImport = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImportingCsv(true);
      const text = await file.text();
      const rows = splitCsvRows(text);
      if (rows.length < 2) {
        alert('No valid CSV rows found.');
        return;
      }

      const headers = parseCsvLine(rows[0]);
      const normalizedHeaders = headers.map(normalizeHeader);
      const records: StudentRecord[] = [];
      const classSubjectBucket: Record<string, Set<string>> = {};

      for (let i = 1; i < rows.length; i += 1) {
        const values = parseCsvLine(rows[i]);
        if (!values.some((value) => value.trim())) continue;

        const standardValues: Record<string, string> = {};
        const marksData: MarksState = {};

        headers.forEach((header, idx) => {
          const rawHeader = (header || '').trim();
          const normalized = normalizedHeaders[idx];
          const value = (values[idx] || '').trim();
          if (!rawHeader) return;

          const mapped = standardHeaderMap[normalized];
          if (mapped) {
            standardValues[mapped] = value;
            return;
          }

          if (!value) return;
          marksData[rawHeader] = { t1: '', t2: '', t3: value };
        });

        const studentName = (standardValues.name || '').toUpperCase();
        const rollNo = standardValues.roll || '';
        const className = normalizeClassName(standardValues.class || activeClass || '');

        if (!studentName || !className) continue;

        Object.keys(marksData).forEach((subject) => {
          if (!classSubjectBucket[className]) classSubjectBucket[className] = new Set();
          classSubjectBucket[className].add(subject);
        });

        const now = new Date().toISOString();
        records.push({
          id: crypto.randomUUID(),
          student_name: studentName,
          roll_no: rollNo,
          class_name: className,
          student_data: {
            name: studentName,
            roll: rollNo,
            mother: (standardValues.mother || '').toUpperCase(),
            father: (standardValues.father || '').toUpperCase(),
            gender: (standardValues.gender || 'MALE').toUpperCase(),
            photo: null,
          },
          marks_data: marksData,
          extra_data: { attendance: '', remark: '', issueDate: defaultIssue, coScholastic },
          created_at: now,
          updated_at: now,
        });
      }

      if (!records.length) {
        alert('No valid student records found in CSV.');
        return;
      }

      await putManyRecords(records);
      const nextConfig = { ...subjectConfig };
      Object.entries(classSubjectBucket).forEach(([className, subjects]) => {
        const merged = Array.from(new Set([...(nextConfig[className] || []), ...Array.from(subjects)]));
        if (merged.length) nextConfig[className] = merged;
      });
      setSubjectConfig(nextConfig);
      localStorage.setItem('sbsSubjects', JSON.stringify(nextConfig));

      await loadStudentsFromLocal();
      setMigrationStatus(`CSV import complete: ${records.length} records loaded into IndexedDB.`);
      alert(`Imported ${records.length} records from CSV.`);
    } catch (error: any) {
      alert(error.message || 'CSV import failed.');
    } finally {
      setIsImportingCsv(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  const handleExportLocalBackup = async () => {
    const records = await getAllRecords();
    const payload = JSON.stringify(records, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `sbs-local-backup-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportLocalBackup = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        alert('Invalid backup file: expected an array of records.');
        return;
      }

      const validated = data.filter((row) => row && row.id && row.student_name && row.class_name);
      if (!validated.length) {
        alert('No valid records found in backup file.');
        return;
      }

      await clearAllRecords();
      await putManyRecords(validated);
      await loadStudentsFromLocal();
      setMigrationStatus(`Local backup restored: ${validated.length} records loaded.`);
      alert(`Imported ${validated.length} records from local backup.`);
    } catch (error: any) {
      alert(error.message || 'Local backup import failed.');
    } finally {
      if (jsonImportRef.current) jsonImportRef.current.value = '';
    }
  };

  const normalizeClassName = (value: string) => value.replace(/^class\s*/i, '').trim().toUpperCase();

  const mergeScannedMarks = (existing: MarksState, incoming: Record<string, number | string>): MarksState => {
    const merged: MarksState = { ...existing };
    Object.entries(incoming).forEach(([subject, rawMark]) => {
      const markText = String(rawMark).trim();
      const prev = merged[subject] || { t1: '', t2: '', t3: '' };
      merged[subject] = { ...prev, t3: markText };
    });
    return merged;
  };

  const upsertScannedStudent = async (row: GeminiScannedStudent) => {
    const normalizedClass = normalizeClassName(row.className);
    const existing = await findRecordByNameAndClass(row.studentName, normalizedClass);
    const now = new Date().toISOString();

    if (existing) {
      const updatedRecord: StudentRecord = {
        ...existing,
        marks_data: mergeScannedMarks(existing.marks_data || {}, row.marks || {}),
        updated_at: now,
      };
      await putRecord(updatedRecord);
      return 'updated' as const;
    }

    const newRecord: StudentRecord = {
      id: crypto.randomUUID(),
      student_name: row.studentName,
      roll_no: '',
      class_name: normalizedClass,
      student_data: {
        name: row.studentName,
        roll: '',
        mother: '',
        father: '',
        gender: 'MALE',
        photo: null,
      },
      marks_data: mergeScannedMarks({}, row.marks || {}),
      extra_data: { attendance: '', remark: '', issueDate: defaultIssue, coScholastic },
      created_at: now,
      updated_at: now,
    };
    await putRecord(newRecord);
    return 'inserted' as const;
  };

  const handleScanClassSheet = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanningSheet(true);
      setScanProgress('Uploading image to Gemini...');
      const base64 = await fileToBase64(file);
      const scannedRows = await extractStudentsFromClassSheet(base64, file.type || 'image/jpeg');
      if (!scannedRows.length) {
        alert('No students detected in scanned sheet.');
        return;
      }
      setScanDraftRows(scannedRows);
      setScanProgress(`Review ${scannedRows.length} scanned students before saving.`);
    } catch (error: any) {
      setScanProgress('');
      alert(error.message || 'Failed to scan class sheet.');
    } finally {
      setIsScanningSheet(false);
      if (scanInputRef.current) scanInputRef.current.value = '';
    }
  };

  const updateScanDraftStudent = (idx: number, patch: Partial<GeminiScannedStudent>) => {
    setScanDraftRows((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const updateScanDraftMark = (idx: number, subject: string, value: string) => {
    setScanDraftRows((prev) =>
      prev.map((row, i) =>
        i === idx
          ? { ...row, marks: { ...row.marks, [subject]: value } }
          : row
      )
    );
  };

  const addSubjectToScannedRow = (idx: number) => {
    const subject = window.prompt('Enter subject name');
    if (!subject) return;
    const normalized = subject.trim();
    if (!normalized) return;
    setScanDraftRows((prev) =>
      prev.map((row, i) =>
        i === idx && !Object.keys(row.marks).includes(normalized)
          ? { ...row, marks: { ...row.marks, [normalized]: '' } }
          : row
      )
    );
  };

  const confirmSaveScannedRows = async () => {
    if (!scanDraftRows.length) return;
    try {
      setIsApplyingScan(true);
      let updated = 0;
      let inserted = 0;
      for (let i = 0; i < scanDraftRows.length; i += 1) {
        setScanProgress(`Processing student ${i + 1} of ${scanDraftRows.length}...`);
        const action = await upsertScannedStudent(scanDraftRows[i]);
        if (action === 'updated') updated += 1;
        else inserted += 1;
      }
      await loadStudentsFromLocal();
      const total = updated + inserted;
      setScanProgress(`Successfully processed ${total} students (${updated} updated, ${inserted} new).`);
      alert(`Successfully processed ${total} students (${updated} updated, ${inserted} new).`);
      setScanDraftRows([]);
    } catch (error: any) {
      alert(error.message || 'Failed to save scanned rows.');
    } finally {
      setIsApplyingScan(false);
    }
  };

  const triggerSinglePrint = () => {
    document.body.classList.add('printing-single');
    document.title = `${student.name || 'Student'}_Class_${activeClass}`;
    window.print();
    setTimeout(() => { document.body.classList.remove('printing-single'); }, 1000);
  };

  const triggerBulkPrint = () => {
    const classStudents = dbStudents.filter(s => s.class_name === activeClass);
    if (classStudents.length === 0) return alert("No students in this class to print!");
    document.body.classList.add('printing-bulk');
    document.title = `Class_${activeClass}_All_Marksheets`;
    window.print();
    setTimeout(() => { document.body.classList.remove('printing-bulk'); }, 1000);
  };

  // ✅ Clean Variables for the UI to prevent TypeScript Errors in JSX
  const activeTerm: 't1' | 't2' | 't3' = step === 2 ? 't1' : step === 3 ? 't2' : 't3';
  const activeMaxVal = step === 2 ? 40 : step === 3 ? 60 : 100;
  const currentSub = currentSubjectsList[activeSubjectIdx] || '';

  const classFilteredStudents = dbStudents.filter(s => s.class_name === activeClass);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media screen { .print-area { position: absolute; left: -9999px; top: -9999px; width: 0; height: 0; overflow: hidden; opacity: 0; pointer-events: none; z-index: -9999; } }
        @media print {
          @page { size: A4 portrait; margin: 0 !important; }
          body, html { margin: 0 !important; padding: 0 !important; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          #app-ui { display: none !important; }
          .print-area { position: relative !important; left: 0 !important; top: 0 !important; width: 100% !important; height: auto !important; overflow: visible !important; opacity: 1 !important; display: none !important; }
          body.printing-single #print-single-container { display: block !important; }
          body.printing-bulk #print-bulk-container { display: block !important; }
          .marksheet-page { width: 210mm !important; height: 295mm !important; overflow: hidden !important; page-break-after: always !important; page-break-inside: avoid !important; margin: 0 auto !important; padding: 0 !important; box-sizing: border-box !important; background: white !important; }
          .marksheet-page:last-child { page-break-after: auto !important; }
        }
      `}} />

      <div id="app-ui">
        {view === 'dashboard' ? (
          <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 relative">
            <div className="w-full max-w-5xl">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div className="flex items-center gap-4">
                  <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain drop-shadow-md bg-white rounded-full p-1" />
                  <div>
                    {/* Added dots S.B.S. */}
                    <h1 className="text-3xl md:text-4xl font-extrabold text-schoolRed tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>S.B.S. Shiksha Niketan</h1>
                    <p className="text-gray-600 font-bold tracking-wide mt-1">EduPrime SMS <span className="text-schoolBlue ml-2 px-2 py-0.5 bg-blue-100 rounded text-xs font-bold">Admin Portal</span></p>
                  </div>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-100">
                  <LogOut size={18} /> Logout
                </button>
              </div>

              <div className="mb-6 flex flex-wrap gap-3">
                <button onClick={() => setShowPrePrimary(!showPrePrimary)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${['NURSERY', 'LKG', 'UKG'].includes(activeClass) ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}>
                  <Folder size={18} className={['NURSERY', 'LKG', 'UKG'].includes(activeClass) ? "text-yellow-200" : "text-gray-400"}/> Pre-Primary
                </button>
                {['1', '2', '3', '4', '5'].map(cls => (
                  <button key={cls} onClick={() => {setActiveClass(cls); setShowPrePrimary(false);}} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${activeClass === cls ? 'bg-schoolBlue text-white scale-105 shadow-md' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}>
                    <Folder size={18} className={activeClass === cls ? "text-yellow-300" : "text-gray-400"}/> Class {cls}
                  </button>
                ))}
              </div>

              {showPrePrimary && (
                <div className="mb-8 flex gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100 animate-in fade-in slide-in-from-top-2">
                  <span className="text-orange-800 font-bold self-center mr-2 text-sm">Select Sub-Class:</span>
                  {['NURSERY', 'LKG', 'UKG'].map(cls => (
                    <button key={cls} onClick={() => setActiveClass(cls)} className={`px-5 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${activeClass === cls ? 'bg-orange-600 text-white scale-105' : 'bg-white text-orange-800 border border-orange-200 hover:bg-orange-100'}`}>{cls}</button>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input type="text" placeholder={`Search in ${activeClass}...`} className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-schoolBlue" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                
                <div className="bg-white border-2 border-gray-200 rounded-xl flex items-center px-4 py-2 shadow-sm gap-3">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Theme</span>
                  <div className="flex gap-2">
                    {Object.values(THEMES).map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => { setActiveTheme(t.id as any); localStorage.setItem('sbsTheme', t.id); }}
                        className={`w-6 h-6 rounded-full transition-all duration-300 border-2 ${activeTheme === t.id ? 'scale-125 shadow-md border-gray-800' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-110'} ${t.bg}`}
                        title={t.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center justify-start">
                  <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvFileImport} />
                  <input ref={scanInputRef} type="file" accept="image/*" className="hidden" onChange={handleScanClassSheet} />
                  <input ref={jsonImportRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImportLocalBackup} />
                  <button onClick={() => scanInputRef.current?.click()} disabled={isScanningSheet} className="bg-white text-violet-700 border-2 border-violet-200 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-violet-50 disabled:opacity-60">
                    {isScanningSheet ? <Loader2 className="animate-spin" size={18} /> : <ScanLine size={20} />} Scan Class Sheet
                  </button>
                  <button onClick={() => csvInputRef.current?.click()} disabled={isImportingCsv} className="bg-white text-sky-700 border-2 border-sky-200 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-sky-50 disabled:opacity-60">
                    {isImportingCsv ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={20} />} Import CSV
                  </button>
                  <button onClick={handleExportLocalBackup} className="bg-white text-emerald-700 border-2 border-emerald-200 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 flex-1 sm:flex-none">
                    <Download size={20} /> Export Local Backup
                  </button>
                  <button onClick={() => jsonImportRef.current?.click()} className="bg-white text-indigo-700 border-2 border-indigo-200 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 flex-1 sm:flex-none">
                    <Upload size={20} /> Import Local Backup
                  </button>
                  <button onClick={() => { setTempSubjects([...currentSubjectsList]); setShowSubjectModal(true); }} className="bg-white text-gray-700 border-2 border-gray-200 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 flex-1 sm:flex-none">
                    <Settings size={20} /> Subjects
                  </button>
                  <button onClick={triggerBulkPrint} className="bg-gray-800 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-gray-900 flex-1 sm:flex-none active:scale-95 transition-all">
                    <Printer size={20} /> Bulk Print
                  </button>
                  <button onClick={() => { resetMarks(false); setStep(1); setView('editor'); }} className="bg-schoolBlue text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-800 flex-1 sm:flex-none active:scale-95 transition-all">
                    <Plus size={20} /> Add
                  </button>
                </div>
              </div>
              {scanProgress && <div className="mb-4 text-sm font-bold text-violet-700 bg-violet-50 border border-violet-100 px-4 py-2 rounded-xl">{scanProgress}</div>}
              {scanDraftRows.length > 0 && (
                <div className="mb-6 bg-white border border-violet-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-extrabold text-violet-700">Review & Edit Scanned Students ({scanDraftRows.length})</h3>
                    <div className="flex gap-2">
                      <button onClick={() => setScanDraftRows([])} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 font-bold">Discard</button>
                      <button onClick={confirmSaveScannedRows} disabled={isApplyingScan} className="px-4 py-2 rounded-lg bg-violet-700 text-white font-bold disabled:opacity-60">
                        {isApplyingScan ? 'Saving...' : 'Confirm & Save to Database'}
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
                    {scanDraftRows.map((row, idx) => (
                      <div key={`${row.studentName}-${idx}`} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                        <div className="grid md:grid-cols-2 gap-3 mb-3">
                          <input value={row.studentName} onChange={(e) => updateScanDraftStudent(idx, { studentName: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 font-bold" placeholder="Student Name" />
                          <input value={row.className} onChange={(e) => updateScanDraftStudent(idx, { className: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 font-bold" placeholder="Class Name" />
                        </div>
                        <div className="space-y-2">
                          {Object.entries(row.marks || {}).map(([subject, value]) => (
                            <div key={subject} className="grid grid-cols-[1fr_100px] gap-2 items-center">
                              <input value={subject} readOnly className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm font-semibold" />
                              <input value={String(value ?? '')} onChange={(e) => updateScanDraftMark(idx, subject, e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-center font-bold" />
                            </div>
                          ))}
                          <button onClick={() => addSubjectToScannedRow(idx)} className="text-xs font-bold text-violet-700 hover:underline">+ Add Subject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50/50 flex justify-between items-center"><h3 className="font-bold">Database: {activeClass}</h3><span className="text-xs text-gray-500 font-semibold">{migrationStatus}</span></div>
                <div className="divide-y divide-gray-100 min-h-[200px]">
                  {isLoadingList ? <div className="p-10 text-center text-gray-400"><Loader2 className="animate-spin mx-auto mb-2" size={30}/>Loading...</div> : 
                    classFilteredStudents.length === 0 ? <div className="p-10 text-center text-gray-400">Folder is empty. Add new marksheet.</div> :
                    classFilteredStudents.filter(s => s.student_name.includes(searchQuery.toUpperCase())).map((s) => (
                      <div key={s.id} className="p-4 flex items-center justify-between hover:bg-blue-50 cursor-pointer group transition-colors" onClick={() => {
                        setEditingId(s.id);
                        setStudent(s.student_data);
                        setMarks(s.marks_data);
                        setExtraDetails({
                          attendance: s.extra_data?.attendance || "",
                          remark: s.extra_data?.remark || "",
                          issueDate: s.extra_data?.issueDate || defaultIssue,
                        });
                        setCoScholastic(s.extra_data?.coScholastic || coScholastic);
                        setStudentPhoto(s.student_data.photo || null);
                        setView('editor');
                      }}>
                        <div className="flex items-center gap-4">
                          {s.student_data?.photo ? <img src={s.student_data.photo} className="w-10 h-10 rounded-full object-cover object-top border" /> : <div className="h-10 w-10 bg-[#e0f7fa] rounded-full flex items-center justify-center text-schoolBlue font-bold">{s.student_name.charAt(0)}</div>}
                          <div><h4 className="font-bold">{s.student_name}</h4><p className="text-xs text-gray-500">Roll: {s.roll_no}</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => deleteStudent(s.id, s.student_name, e)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                            <Trash2 size={18}/>
                          </button>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold group-hover:bg-blue-100 group-hover:text-schoolBlue transition-colors">Edit</span>
                          <ChevronRight className="text-gray-400 group-hover:text-schoolBlue" size={16}/>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            {showSubjectModal && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Manage Subjects for {activeClass}</h2>
                    <button onClick={() => setShowSubjectModal(false)} className="text-gray-500 hover:text-red-500"><X size={24}/></button>
                  </div>
                  <div className="space-y-2 mb-6 max-h-[40vh] overflow-y-auto">
                    {tempSubjects.map((sub, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 border p-3 rounded-lg">
                        <span className="font-bold">{sub}</span>
                        <button onClick={() => setTempSubjects(tempSubjects.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={18}/></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-6">
                    <input type="text" value={newSubInput} onChange={e=>setNewSubInput(e.target.value)} placeholder="New Subject Name" className="flex-1 border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-schoolBlue" />
                    <button onClick={() => {
                      const normalized = newSubInput.trim();
                      const exists = tempSubjects.some((sub) => sub.trim().toLowerCase() === normalized.toLowerCase());
                      if(normalized && !exists){ setTempSubjects([...tempSubjects, normalized]); setNewSubInput(''); }
                    }} className="bg-gray-800 text-white px-6 font-bold rounded-xl active:scale-95">Add</button>
                  </div>
                  <button onClick={saveSubjects} className="w-full bg-schoolBlue text-white py-4 rounded-xl font-bold hover:bg-blue-800 active:scale-95 transition-all">Save Subject List</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-screen bg-gray-100 flex flex-col font-sans overflow-x-hidden">
            <div className="bg-white shadow-sm border-b px-6 py-3 flex justify-between items-center">
              <button onClick={() => {setView('dashboard'); resetMarks(false);}} className="font-bold flex items-center gap-2 hover:text-schoolBlue transition-colors"><Home size={20}/> Back</button>
              <span className="font-bold text-schoolBlue">{editingId ? 'Editing Student' : 'New Student'} • {activeClass}</span>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row w-full">
              <div className="w-full lg:w-[45%] bg-white p-6 border-r overflow-y-auto h-[calc(100vh-60px)]">
                
                {lastSaved && <div className="mb-4 bg-green-100 text-green-800 p-2 rounded-lg text-sm font-bold text-center animate-pulse">{lastSaved}</div>}

                <div className="flex justify-between items-center mb-6 relative">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-0 h-1 bg-schoolBlue -z-10 -translate-y-1/2 transition-all duration-300" style={{ width: `${((step - 1) / 4) * 100}%` }}></div>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} onClick={() => setStep(s)} className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${step === s ? 'bg-schoolBlue text-white ring-4 ring-blue-100 scale-110' : step > s ? 'bg-schoolBlue text-white' : 'bg-white text-gray-400 border-2 hover:border-schoolBlue'}`}>{s}</div>
                  ))}
                </div>

                <div className="space-y-4">
                  {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <h2 className="text-xl font-bold mb-4">1. Details & Photo</h2>
                      <div className="flex items-center gap-4 mb-4">
                        <label className="cursor-pointer">
                          <div className="w-20 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-schoolBlue bg-gray-50 overflow-hidden relative transition-colors">
                            {studentPhoto ? <img src={studentPhoto} className="w-full h-full object-cover object-top" /> : <><ImageIcon size={24} className="text-gray-400 mb-1"/><span className="text-[10px] font-bold text-gray-500">Upload</span></>}
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                          </div>
                        </label>
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div><label className="text-xs font-bold text-gray-500">NAME</label><input type="text" name="name" value={student.name} onChange={handleDetailChange} className="w-full border-2 border-gray-200 p-2 rounded-xl focus:border-schoolBlue outline-none font-bold transition-all" /></div>
                          <div><label className="text-xs font-bold text-gray-500">ROLL NO</label><input type="text" name="roll" value={student.roll} onChange={(e)=>setStudent({...student, roll: e.target.value})} className="w-full border-2 border-gray-200 p-2 rounded-xl focus:border-schoolBlue outline-none font-bold transition-all" /></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-bold text-gray-500">GENDER</label><select name="gender" value={student.gender} onChange={(e)=>setStudent({...student, gender: e.target.value})} className="w-full border-2 border-gray-200 p-2 rounded-xl outline-none font-bold"><option>MALE</option><option>FEMALE</option></select></div>
                        <div><label className="text-xs font-bold text-gray-500">FATHER</label><input type="text" name="father" value={student.father} onChange={handleDetailChange} className="w-full border-2 border-gray-200 p-2 rounded-xl outline-none font-bold transition-all" /></div>
                        <div className="col-span-2"><label className="text-xs font-bold text-gray-500">MOTHER</label><input type="text" name="mother" value={student.mother} onChange={handleDetailChange} className="w-full border-2 border-gray-200 p-2 rounded-xl outline-none font-bold transition-all" /></div>
                      </div>
                    </div>
                  )}

                  {/* ✅ Fixed TypeScript Error Logic */}
                  {[2, 3, 4].includes(step) && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-schoolBlue">Term {step-1} Marks</h2>
                        <span className="text-sm font-bold text-gray-400">Sub {activeSubjectIdx + 1}/{currentSubjectsList.length}</span>
                      </div>
                      
                      {/* 🔥 Smart Single Subject Entry Card */}
                      <div className="bg-blue-50/50 p-8 rounded-2xl border-2 border-blue-100 flex flex-col items-center justify-center text-center shadow-inner mb-6 transition-all duration-300">
                        <h3 className="text-3xl font-extrabold text-gray-800 mb-6 uppercase tracking-wider">{currentSub}</h3>
                        
                        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                          <input 
                            autoFocus
                            key={`input-${step}-${currentSub}`} // Ensures it re-focuses on change
                            type="number" 
                            value={marks[currentSub]?.[activeTerm] || ''} 
                            onChange={(e) => handleMarkChange(currentSub, activeTerm, e.target.value)} 
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleNextSubject(); } }}
                            placeholder="0" 
                            className="w-32 h-16 text-center text-4xl font-black rounded-xl border-2 border-gray-200 outline-none focus:border-schoolBlue focus:ring-4 focus:ring-blue-100 transition-all text-schoolBlue placeholder-gray-300" 
                          />
                          <span className="text-3xl font-bold text-gray-300">/ {activeMaxVal}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-400 mt-4 tracking-wide"><kbd className="bg-gray-200 px-2 py-1 rounded text-gray-600">Enter ↵</kbd> to save & next</p>

                        <div className="flex w-full justify-between mt-8">
                          <button onClick={handlePrevSubject} disabled={activeSubjectIdx === 0} className={`px-5 py-2 rounded-xl font-bold transition-all ${activeSubjectIdx === 0 ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'}`}>
                            <ChevronLeft size={20} className="inline mr-1"/> Prev
                          </button>
                          <button onClick={handleNextSubject} className="bg-schoolBlue text-white px-5 py-2 rounded-xl font-bold hover:bg-blue-800 shadow-md transition-all active:scale-95">
                            Next <ChevronRight size={20} className="inline ml-1"/>
                          </button>
                        </div>
                      </div>

                      {/* Mini List for Review */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Quick Review</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {currentSubjectsList.map((sub, idx) => (
                            <div key={sub} onClick={() => setActiveSubjectIdx(idx)} className={`p-2 rounded-lg text-center cursor-pointer border transition-all ${idx === activeSubjectIdx ? 'border-schoolBlue bg-schoolBlue text-white shadow-md scale-105' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                              <div className={`text-[9px] font-bold truncate mb-1 ${idx === activeSubjectIdx ? 'text-blue-200' : 'text-gray-400'}`}>{sub}</div>
                              <div className="font-extrabold">{marks[sub]?.[activeTerm] || '-'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                      <h2 className="text-xl font-bold mb-4">Final Touches & Export</h2>
                      <div className="grid grid-cols-2 gap-3 mb-4 border border-blue-100 p-4 rounded-2xl bg-blue-50/50">
                        {['sports', 'art', 'music', 'discipline'].map(item => (
                          <div key={item}>
                            <label className="text-[10px] font-bold uppercase text-gray-500">{item}</label>
                            <select value={coScholastic[item as keyof CoScholasticState]} onChange={(e)=>setCoScholastic({...coScholastic, [item]: e.target.value})} className="w-full border-2 border-white p-2 rounded-xl font-bold bg-white outline-none focus:border-schoolBlue shadow-sm transition-all">
                              <option value="A+">A+ (Outstanding)</option><option value="A">A (Excellent)</option>
                              <option value="B+">B+ (Very Good)</option><option value="B">B (Good)</option><option value="C">C (Average)</option>
                            </select>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-bold text-gray-500">ATTENDANCE</label><input type="text" value={extraDetails.attendance} onChange={(e)=>setExtraDetails({...extraDetails, attendance: e.target.value})} className="w-full border-2 border-gray-200 p-2 rounded-xl outline-none font-bold focus:border-schoolBlue transition-all" /></div>
                        <div><label className="text-xs font-bold text-gray-500">ISSUE DATE</label><input type="date" value={extraDetails.issueDate} onChange={(e)=>setExtraDetails({...extraDetails, issueDate: e.target.value})} className="w-full border-2 border-gray-200 p-2 rounded-xl outline-none font-bold focus:border-schoolBlue transition-all" /></div>
                        <div className="col-span-2">
                          <label className="text-xs font-bold text-gray-500">REMARKS</label>
                          <input list="remarks-list" type="text" value={extraDetails.remark} onChange={(e)=>setExtraDetails({...extraDetails, remark: e.target.value})} className="w-full border-2 border-gray-200 p-2 rounded-xl outline-none font-bold focus:border-schoolBlue transition-all" />
                          <datalist id="remarks-list">{remarksList.map((r,i)=><option key={i} value={r}/>)}</datalist>
                        </div>
                      </div>

                      <div className="mt-8 space-y-3">
                        <button onClick={() => saveToCloud(true)} disabled={isSaving} className="w-full text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg active:scale-95 transition-all bg-green-600 hover:bg-green-700 disabled:bg-gray-400">
                          {isSaving ? <Loader2 className="animate-spin"/> : <Save/>} Save & Add Next
                        </button>
                        <button onClick={()=>saveToCloud(false)} className="w-full text-white p-3 rounded-xl font-bold transition-colors shadow-md bg-schoolBlue hover:bg-blue-800">Save & Close</button>
                        
                        <div className="pt-2 border-t mt-4">
                          <button onClick={triggerSinglePrint} className="w-full bg-gray-800 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-900 shadow-lg active:scale-95 transition-all"><Printer size={20}/> Print / Save PDF (HD)</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-between pt-4 border-t border-gray-200">
                  <button onClick={() => setStep(s => Math.max(1, s - 1))} className={`px-6 py-2 rounded-xl font-bold transition-all ${step === 1 ? 'text-gray-300' : 'bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-600'}`}>Back</button>
                  {/* Next Button logic slightly changed to accommodate smart entry block */}
                  {step < 5 && step === 1 && <button onClick={() => setStep(s => Math.min(5, s + 1))} className="px-8 py-2 bg-schoolBlue text-white rounded-xl font-bold shadow-md hover:bg-blue-800 active:scale-95 transition-all">Next</button>}
                  {step > 1 && step < 5 && <button onClick={() => setStep(s => Math.min(5, s + 1))} className="px-8 py-2 bg-gray-800 text-white rounded-xl font-bold shadow-md hover:bg-gray-900 active:scale-95 transition-all">Skip to Term {step}</button>}
                </div>
              </div>

              <div className="w-full lg:w-[55%] bg-gray-800 lg:p-6 flex justify-center overflow-auto relative">
                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">Live Preview</div>
                <div className="lg:origin-top lg:scale-[0.70] xl:scale-[0.80] transition-transform">
                  <MarksheetTemplate templateId="marksheet-preview" theme={THEMES[activeTheme]} student={student} marks={marks} subjectsList={currentSubjectsList} grandTotal={grandTotal} percentage={percentage} finalGrade={finalGrade} extra={extraDetails} coScholastic={coScholastic} photo={studentPhoto} rank={getClassRank(grandTotal, activeClass)} activeClass={activeClass} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div id="print-single-container" className="print-area">
        <div className="marksheet-page">
          <MarksheetTemplate theme={THEMES[activeTheme]} student={student} marks={marks} subjectsList={currentSubjectsList} grandTotal={grandTotal} percentage={percentage} finalGrade={finalGrade} extra={extraDetails} coScholastic={coScholastic} photo={studentPhoto} rank={getClassRank(grandTotal, activeClass)} activeClass={activeClass} />
        </div>
      </div>

      <div id="print-bulk-container" className="print-area">
        {classFilteredStudents.map((s, index) => {
          const calcs = getCalculations(s.marks_data, s.class_name);
          return (
            <div key={s.id} className="marksheet-page" style={{ pageBreakAfter: index === classFilteredStudents.length - 1 ? 'auto' : 'always' }}>
              <MarksheetTemplate theme={THEMES[activeTheme]} student={s.student_data} marks={s.marks_data} subjectsList={getSubjectsForClass(s.class_name, s.marks_data)} grandTotal={calcs.grandTotal} percentage={calcs.percentage} finalGrade={calcs.finalGrade} extra={s.extra_data} coScholastic={s.extra_data?.coScholastic || {sports:'A',art:'A',music:'A',discipline:'A'}} photo={s.student_data.photo} rank={getClassRank(calcs.grandTotal, s.class_name)} activeClass={s.class_name} />
            </div>
          )
        })}
      </div>
      <AiChatWidget />
    </>
  )
}

// ==========================================
// MARKSHEET TEMPLATE
// ==========================================
function MarksheetTemplate({ theme, student, marks, subjectsList, grandTotal, percentage, finalGrade, extra, coScholastic, photo, rank, activeClass }: any) {
  const getGrade = (m: number | string, max: number) => {
    if (m === '') return '';
    let p = (Number(m) / max) * 100;
    if (p >= 91) return 'A1'; if (p >= 81) return 'A2'; if (p >= 71) return 'B1'; if (p >= 61) return 'B2';
    if (p >= 51) return 'C1'; if (p >= 41) return 'C2'; if (p >= 33) return 'D'; return 'E';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const t = theme || THEMES.classic; 

  return (
    // ✅ Restored old print settings: h-[295mm], p-2
    <div className={`w-[210mm] h-[295mm] bg-white relative overflow-hidden text-black text-sm box-border mx-auto p-2 ${t.ring} shadow-2xl print:shadow-none`}>
      <div className="absolute inset-0 flex justify-center items-center z-0 opacity-[0.05] pointer-events-none"><img src="/logo.png" className="w-[450px] h-[450px]" /></div>
      <div className={`relative z-10 h-full w-full border-[6px] ${t.border} p-[3px] flex flex-col box-border bg-white`}>
        <div className={`border-[2px] ${t.border} h-full w-full p-4 flex flex-col box-border`}>
          
          <div className="flex justify-between items-start mb-3">
            <div className="w-36 h-36 p-1"><img src="/logo.png" className="w-full h-full object-contain" /></div>
            <div className="text-center flex-1 px-2 pt-2">
              <h1 className={`text-[2.8rem] leading-none font-extrabold ${t.text} uppercase tracking-widest drop-shadow-sm`} style={{ fontFamily: 'Georgia, serif' }}>S.B.S. Shiksha Niketan</h1>
              <p className="font-semibold mt-1.5 text-[16px] text-gray-800">Karaspur Prithvipur, Ghazipur, Uttar Pradesh – 233226</p>
              <div className="mt-3 mb-2 flex justify-center"><span className={`${t.bg} text-white px-5 py-1.5 rounded-full ring-2 ring-offset-2 ${t.ring} font-bold uppercase text-[11px]`}>PROGRESS EVALUATION REPORT</span></div>
              <p className={`${t.textSecondary} font-extrabold mt-3 text-sm tracking-wide`}>ACADEMIC SESSION : 2025-26</p>
              <p className="font-extrabold text-[15px] mt-1 mb-2">CLASS : {activeClass}</p>
            </div>
            <div className="w-28 h-36 border-[2px] border-gray-400 flex items-center justify-center bg-gray-50 overflow-hidden">
              {photo ? <img src={photo} className="w-full h-full object-cover object-top"/> : <span className="text-gray-400 text-xs text-center font-bold px-2">Upload Photo</span>}
            </div>
          </div>

          {/* ✅ PERFECT ALIGNMENT FOR DETAILS: Fixed width labels, explicit center colons */}
          <div className={`${t.bgHighlight} border ${t.border} p-3 grid grid-cols-2 gap-x-6 gap-y-2 font-bold text-[13px] mb-3 uppercase`}>
            <div className="flex items-center"><span className="w-[130px] text-left">STUDENT'S NAME</span><span className="w-[20px] text-center">:</span><span className="flex-1 text-left">{student.name}</span></div>
            <div className="flex items-center"><span className="w-[80px] text-left">ROLL NO.</span><span className="w-[20px] text-center">:</span><span className="flex-1 text-left">{student.roll}</span></div>
            <div className="flex items-center"><span className="w-[130px] text-left">MOTHER'S NAME</span><span className="w-[20px] text-center">:</span><span className="flex-1 text-left">{student.mother}</span></div>
            <div className="flex items-center"><span className="w-[80px] text-left">GENDER</span><span className="w-[20px] text-center">:</span><span className="flex-1 text-left">{student.gender}</span></div>
            <div className="flex items-center col-span-2"><span className="w-[130px] text-left">FATHER'S NAME</span><span className="w-[20px] text-center">:</span><span className="flex-1 text-left">{student.father}</span></div>
          </div>

          <div className="w-full mb-1 flex flex-col">
            <table className={`w-full text-center border-collapse text-[11px] font-bold border-[2px] ${t.border}`}>
              <thead>
                <tr className={`${t.bgHeader} ${t.text} border-b-[2px] ${t.border}`}>
                  <th rowSpan={2} className={`border-r-[2px] ${t.border} p-1 text-left uppercase`}>Subjects</th>
                  <th colSpan={2} className={`border-r-[2px] ${t.border} p-1 uppercase`}>Term 1 (40)</th>
                  <th colSpan={2} className={`border-r-[2px] ${t.border} p-1 uppercase`}>Term 2 (60)</th>
                  <th colSpan={2} className={`border-r-[2px] ${t.border} p-1 uppercase`}>Term 3 (100)</th>
                  <th colSpan={2} className={`border-r-[2px] ${t.border} p-1 uppercase`}>Grand Total</th>
                  <th rowSpan={2} className="p-1 uppercase">Grade</th>
                </tr>
                <tr className={`${t.bgHeader} ${t.textSecondary} text-[10px] border-b-[2px] ${t.border}`}>
                  <th className={`border-r-[2px] border-t-[2px] ${t.border} p-1`}>MM</th><th className={`border-r-[2px] border-t-[2px] ${t.border} p-1`}>OBT</th>
                  <th className={`border-r-[2px] border-t-[2px] ${t.border} p-1`}>MM</th><th className={`border-r-[2px] border-t-[2px] ${t.border} p-1`}>OBT</th>
                  <th className={`border-r-[2px] border-t-[2px] ${t.border} p-1`}>MM</th><th className={`border-r-[2px] border-t-[2px] ${t.border} p-1`}>OBT</th>
                  <th className={`border-r-[2px] border-t-[2px] ${t.border} p-1`}>MM</th><th className={`border-r-[2px] border-t-[2px] ${t.border} p-1`}>TOT</th>
                </tr>
              </thead>
              <tbody className={t.textSecondary}>
                {subjectsList.map((sub: string, i: number) => {
                  let subData = marks[sub] || {}; let tot = (Number(subData.t1)||0) + (Number(subData.t2)||0) + (Number(subData.t3)||0);
                  return (
                    <tr key={i} className={`border-b-[2px] ${t.border}`}>
                      <td className={`border-r-[2px] ${t.border} p-1.5 text-left text-black`}>{sub}</td>
                      <td className={`border-r-[2px] ${t.border} p-1.5`}>40</td><td className={`border-r-[2px] ${t.border} p-1.5`}>{subData.t1}</td>
                      <td className={`border-r-[2px] ${t.border} p-1.5`}>60</td><td className={`border-r-[2px] ${t.border} p-1.5`}>{subData.t2}</td>
                      <td className={`border-r-[2px] ${t.border} p-1.5`}>100</td><td className={`border-r-[2px] ${t.border} p-1.5`}>{subData.t3}</td>
                      <td className={`border-r-[2px] ${t.border} p-1.5`}>200</td><td className={`border-r-[2px] ${t.border} p-1.5 text-black`}>{tot > 0 ? tot : ''}</td>
                      <td className={`p-1.5 ${t.text}`}>{tot > 0 ? getGrade(tot, 200) : ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className={`flex justify-between items-center px-4 py-2 mb-4 border-[2px] ${t.border} ${t.bgHighlight} font-bold text-[13px] uppercase`}>
            <div className="flex gap-2">TOTAL MAXIMUM MARKS : <span className={`${t.text} text-[15px]`}>{subjectsList.length * 200}</span></div>
            <div className="flex gap-2">TOTAL OBTAINED : <span className={`${t.text} text-[15px]`}>{grandTotal}</span></div>
            <div className="flex gap-2">PERCENTAGE : <span className={`${t.text} text-[15px]`}>{percentage}%</span></div>
          </div>

          <div className="w-full flex flex-col mt-auto mb-5">
            <table className="w-full text-[10px] border-[2px] border-black text-center mb-2 font-bold">
              <tbody>
                <tr className={`${t.bgHeader} border-b-[2px] border-black`}>
                  <td colSpan={2} className="text-left p-1.5 border-r-[2px] border-black text-black">Co-Scholastic Area</td>
                  <td colSpan={6} className={`text-right p-1.5 text-[10px] font-normal ${t.textSecondary}`}>A+: Outstanding | A: Excellent | B+: Very Good | B: Good | C: Average</td>
                </tr>
                <tr>
                  <td className="p-1 border-r border-black text-left w-24">Sports & Games</td><td className={`p-1 border-r-[2px] border-black w-10 ${t.text} text-xs`}>{coScholastic.sports}</td>
                  <td className="p-1 border-r border-black text-left w-24">Art & Craft</td><td className={`p-1 border-r-[2px] border-black w-10 ${t.text} text-xs`}>{coScholastic.art}</td>
                  <td className="p-1 border-r border-black text-left w-24">Music & Dance</td><td className={`p-1 border-r-[2px] border-black w-10 ${t.text} text-xs`}>{coScholastic.music}</td>
                  <td className="p-1 border-r border-black text-left w-24">Discipline</td><td className={`p-1 border-black w-10 ${t.text} text-xs`}>{coScholastic.discipline}</td>
                </tr>
              </tbody>
            </table>
            
            <table className="w-full text-[10px] border-[2px] border-black text-center font-bold">
              <tbody>
                <tr>
                  <td className="bg-black text-white p-1 border-r border-white w-20 leading-tight">GRADE<br/>SCALE</td>
                  <td className={`p-1 border-r border-white leading-tight transition-colors ${finalGrade==='A1'?'bg-green-600 text-white':'bg-gray-200 text-black'}`}>91-100<br/>A1</td>
                  <td className={`p-1 border-r border-white leading-tight transition-colors ${finalGrade==='A2'?'bg-green-500 text-white':'bg-gray-100 text-black'}`}>81-90<br/>A2</td>
                  <td className={`p-1 border-r border-white leading-tight transition-colors ${finalGrade==='B1'?'bg-blue-500 text-white':'bg-gray-200 text-black'}`}>71-80<br/>B1</td>
                  <td className={`p-1 border-r border-white leading-tight transition-colors ${finalGrade==='B2'?'bg-blue-400 text-white':'bg-gray-100 text-black'}`}>61-70<br/>B2</td>
                  <td className={`p-1 border-r border-white leading-tight transition-colors ${finalGrade==='C1'?'bg-yellow-500 text-white':'bg-gray-200 text-black'}`}>51-60<br/>C1</td>
                  <td className={`p-1 border-r border-white leading-tight transition-colors ${finalGrade==='C2'?'bg-yellow-400 text-white':'bg-gray-100 text-black'}`}>41-50<br/>C2</td>
                  <td className={`p-1 border-r border-white leading-tight transition-colors ${finalGrade==='D'?'bg-orange-500 text-white':'bg-gray-200 text-black'}`}>33-40<br/>D</td>
                  <td className={`p-1 leading-tight transition-colors ${finalGrade==='E'?'bg-red-600 text-white':'bg-gray-100 text-black'}`}>00-32<br/>E</td>
                </tr>
              </tbody>
            </table>
            
            <div className={`flex justify-between text-[11px] font-bold mt-5 ${t.textSecondary}`}>
              <div>Remark : <span className={`border-b border-black inline-block min-w-[200px] ${t.text} uppercase px-2`}>{extra.remark}</span></div>
              <div>Attendance : <span className={`border-b border-black inline-block min-w-[60px] text-center ${t.text} px-2`}>{extra.attendance}</span></div>
              <div>Class Rank : <span className={`border-b border-black inline-block min-w-[60px] text-center ${t.text} px-2 text-sm`}>{rank}</span></div>
            </div>
          </div>

          <div className="flex justify-between items-end px-8 pt-1 pb-1 font-semibold text-sm mt-auto">
            <div className="flex flex-col items-center pt-1 w-32">
              <span className="font-bold mb-1">{formatDate(extra.issueDate)}</span>
              <div className="border-t border-dashed border-black w-full text-center pt-1">Date of Issue</div>
            </div>
            <div className="flex flex-col items-center">
              <img src="/class_teacher_sign.png" alt="" className="h-[40px] mb-1 object-contain" onError={(e)=>e.currentTarget.style.display='none'}/>
              <div className="border-t border-black w-32 text-center pt-1">Class Teacher</div>
            </div>
            <div className="flex flex-col items-center">
              <img src="/principal_sign.png" alt="" className="h-[70px] mb-1 object-contain" />
              <div className="border-t border-black w-32 text-center pt-1">Principal</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
