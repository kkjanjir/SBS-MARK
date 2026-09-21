'use client'
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Plus, ChevronRight, ChevronLeft, Printer, Home, Save, Loader2, Folder, Image as ImageIcon, Settings, X, Trash2, DownloadCloud, Palette, User as UserIcon, LogOut, WifiOff, ArrowUp, ArrowDown, Bot, Send, Mic, MicOff } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// 🚀 SUPABASE CONNECTION
const supabaseUrl = 'https://jrvsjjzmkpkwmhbcohyq.supabase.co/';
const supabaseKey = 'sb_publishable_7jwgTYdDmbbCUJK52IHNMw_JoZF-OYD';
const supabase = createClient(supabaseUrl, supabaseKey);
const OFFLINE_MARKS_QUEUE_KEY = 'sbsOfflineMarksQueue';
const LOCAL_BACKUP_RECORDS_KEY = 'sbsLocalBackupRecords';
const OFFLINE_ONLY_MODE_KEY = 'sbsOfflineOnlyMode';
const GEMINI_MODEL = 'gemini-2.5-flash';

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

type MarksState = Record<string, { t1: string; t2: string; t3: string }>;
type CoScholasticState = { sports: string; art: string; music: string; discipline: string };
type BackupRecord = {
  id: string;
  student_name: string;
  roll_no: string;
  class_name: string;
  student_data: any;
  marks_data: MarksState;
  extra_data: any;
  source: 'cloud' | 'local';
  created_at?: string;
};
type AiDraftRow = { student_name: string; roll_no?: string; subjects: Record<string, { t1?: string; t2?: string; t3?: string }> };


const defaultStudent = { name: "", roll: "", mother: "", father: "", gender: "MALE" };
const defaultExtra = { attendance: "", remark: "", issueDate: "" };
const defaultCoScholastic = { sports: "A", art: "A", music: "A", discipline: "A" };

const getGrade = (marksObtained: number | string, maxMarks: number) => {
  if (marksObtained === '') return '';
  let p = (Number(marksObtained) / maxMarks) * 100;
  if (p >= 91) return 'A1'; if (p >= 81) return 'A2'; if (p >= 71) return 'B1'; if (p >= 61) return 'B2';
  if (p >= 51) return 'C1'; if (p >= 41) return 'C2'; if (p >= 33) return 'D';  return 'E';
};

const getDynamicSubjects = (mObj: any, fallback: string[]) => {
  const markKeys = Object.keys(mObj || {}).filter(Boolean);
  if (markKeys.length === 0) return fallback;
  return [...fallback.filter(sub => markKeys.includes(sub)), ...markKeys.filter(sub => !fallback.includes(sub))];
};

export default function MarksheetApp() {

  // 🔒 LOCAL ACCESS PIN
  const [accessPin, setAccessPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // APP STATES
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClass, setActiveClass] = useState<string>('5'); 
  const [showPrePrimary, setShowPrePrimary] = useState(false);
  const [activeTheme, setActiveTheme] = useState<'classic'|'emerald'|'royal'|'ocean'|'sunset'>('classic');
  const [showTableWatermark, setShowTableWatermark] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [subjectConfig, setSubjectConfig] = useState<Record<string, string[]>>({});
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [tempSubjects, setTempSubjects] = useState<string[]>([]);
  const [newSubInput, setNewSubInput] = useState('');

  const [dbStudents, setDbStudents] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [lastSaved, setLastSaved] = useState('');
  const [notice, setNotice] = useState('');
  const [offlineOnlyMode, setOfflineOnlyMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiImageName, setAiImageName] = useState('');
  const [aiDraftRows, setAiDraftRows] = useState<AiDraftRow[]>([]);
  const [isListening, setIsListening] = useState(false);

  // 📝 Single Subject Entry Tracker
  const [activeSubjectIdx, setActiveSubjectIdx] = useState(0);

  const [student, setStudent] = useState({ name: "", roll: "", mother: "", father: "", gender: "MALE" });
  const [extraDetails, setExtraDetails] = useState({ attendance: "", remark: "", issueDate: defaultIssue });
  const [coScholastic, setCoScholastic] = useState<CoScholasticState>({ sports: "A", art: "A", music: "A", discipline: "A" });
  const [studentPhoto, setStudentPhoto] = useState<string | null>(null);
  const [marks, setMarks] = useState<MarksState>({});

  const parseCsvLine = (line: string) => {
    const out: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        out.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    out.push(current.trim());
    return out.map(val => val.replace(/^"|"$/g, '').trim());
  };

  const moveSubject = (from: number, to: number) => {
    if (to < 0 || to >= tempSubjects.length || from === to) return;
    const updated = [...tempSubjects];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    setTempSubjects(updated);
  };

  const renameSubjectEverywhere = (oldName: string, newName: string) => {
    const cleanNew = newName.trim().toUpperCase();
    if (!cleanNew || oldName === cleanNew || marks[cleanNew]) return;
    setMarks(prev => {
      const copy = { ...prev };
      const currentData = copy[oldName] || { t1: '', t2: '', t3: '' };
      delete copy[oldName];
      copy[cleanNew] = currentData;
      return copy;
    });
    setSubjectConfig(prev => {
      const updated = { ...prev };
      const list = [...(updated[activeClass] || DEFAULT_SUBJECTS)];
      const idx = list.indexOf(oldName);
      if (idx >= 0) list[idx] = cleanNew;
      updated[activeClass] = list;
      localStorage.setItem('sbsSubjects', JSON.stringify(updated));
      return updated;
    });
  };

  const getClassSubjects = useCallback((clsName: string, mObj?: MarksState) => getDynamicSubjects(mObj, subjectConfig[clsName] || DEFAULT_SUBJECTS), [subjectConfig]);
  const currentSubjectsList = getClassSubjects(activeClass, marks);

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(''), 4000);
  };

  const savePayloadOffline = (entry: { mode: 'insert' | 'update'; id?: string; payload: any }) => {
    const queued = JSON.parse(localStorage.getItem(OFFLINE_MARKS_QUEUE_KEY) || '[]');
    queued.push({ ...entry, queuedAt: new Date().toISOString() });
    localStorage.setItem(OFFLINE_MARKS_QUEUE_KEY, JSON.stringify(queued));
  };

  const syncOfflineQueue = async () => {
    if (!navigator.onLine) return;
    try {
      const queued = JSON.parse(localStorage.getItem(OFFLINE_MARKS_QUEUE_KEY) || '[]');
      if (!queued.length) return;

      for (const item of queued) {
        if (item.mode === 'update' && item.id) {
          await supabase.from('marks_records').update(item.payload).eq('id', item.id);
        } else {
          await supabase.from('marks_records').insert([item.payload]);
        }
      }

      localStorage.removeItem(OFFLINE_MARKS_QUEUE_KEY);
      showNotice('Offline data synced successfully.');
      fetchStudentsFromCloud();
    } catch (err) {
      console.error("Offline Sync Error:", err);
    }
  };

  // 🌐 OFFLINE ENGINE (Service Worker & Network Status)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW Registration failed: ', err));
    }
    setIsOnline(navigator.onLine);
    const handleOnline = () => { setIsOnline(true); syncOfflineQueue(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  }, []);

  useEffect(() => {
    const savedConfig = localStorage.getItem('sbsSubjects');
    if (savedConfig) setSubjectConfig(JSON.parse(savedConfig));
    const savedOfflineMode = localStorage.getItem(OFFLINE_ONLY_MODE_KEY);
    setOfflineOnlyMode(savedOfflineMode === 'true');
    const localBackups = JSON.parse(localStorage.getItem(LOCAL_BACKUP_RECORDS_KEY) || '[]');
    if (Array.isArray(localBackups) && localBackups.length) {
      setDbStudents(prev => [...localBackups, ...prev.filter(s => s.source !== 'local')]);
    }
    const savedTheme = localStorage.getItem('sbsTheme') as any;
    if (savedTheme && THEMES[savedTheme]) setActiveTheme(savedTheme);
    const savedTableWatermark = localStorage.getItem('sbsTableWatermark');
    setShowTableWatermark(savedTableWatermark === 'true');
    resetMarks();
  }, [activeClass]);

  useEffect(() => {
    if (isOnline) syncOfflineQueue();
  }, [isOnline]);

  useEffect(() => { setActiveSubjectIdx(0); }, [step]);

  // ✅ Simple, Crash-Proof Fetch Function
  const fetchStudentsFromCloud = async () => {
    const localBackups = JSON.parse(localStorage.getItem(LOCAL_BACKUP_RECORDS_KEY) || '[]');
    if (!isOnline) {
      setDbStudents(Array.isArray(localBackups) ? localBackups : []);
      setIsLoadingList(false);
      return;
    }
    setIsLoadingList(true); // Normal loading shuru
    try {
      const { data, error } = await supabase.from('marks_records').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error("Fetch Error:", error.message);
      } else if (data) {
        setDbStudents([...(Array.isArray(localBackups) ? localBackups : []), ...data.map(d => ({ ...d, source: 'cloud' }))]);
      }
    } catch (err) {
      console.error("Unexpected fetch error:", err);
    } finally {
      setIsLoadingList(false); // Ye line ab 100% chalegi, spinner kabhi nahi atakega
    }
  };

  useEffect(() => { if (isUnlocked && view === 'dashboard') fetchStudentsFromCloud(); }, [isUnlocked, view, isOnline]);

  const handleUnlock = (e: any) => {
    e.preventDefault();
    if (/^\d{4}$/.test(accessPin)) {
      setIsUnlocked(true);
      showNotice('Portal unlocked.');
      return;
    }
    alert('4 digit PIN डालो.');
  };

  const handleLogout = async () => { setIsUnlocked(false); setAccessPin(''); setView('dashboard'); };
  const handleDetailChange = (e: any) => { setStudent({ ...student, [e.target.name]: e.target.value.toUpperCase() }); };

  const handleMarkChange = (sub: string, term: 't1' | 't2' | 't3', value: string) => {
    let max = term === 't1' ? 40 : term === 't2' ? 60 : 100;
    if (value !== '') { let numVal = Number(value); if (numVal < 0 || numVal > max) return; }
    setMarks(prev => ({ ...prev, [sub]: { ...(prev[sub] || {t1:'', t2:'', t3:''}), [term]: value } }));
  };

  const handleNextSubject = () => {
    if (activeSubjectIdx < currentSubjectsList.length - 1) setActiveSubjectIdx(prev => prev + 1);
    else setStep(s => Math.min(5, s + 1));
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
    const target = dbStudents.find(s => s.id === id);
    if (target?.source === 'local') {
      const localBackups = JSON.parse(localStorage.getItem(LOCAL_BACKUP_RECORDS_KEY) || '[]');
      const updated = (Array.isArray(localBackups) ? localBackups : []).filter((s: any) => s.id !== id);
      localStorage.setItem(LOCAL_BACKUP_RECORDS_KEY, JSON.stringify(updated));
      setDbStudents(prev => prev.filter(s => s.id !== id));
      showNotice('Local backup record deleted.');
      return;
    }
    if(!isOnline) return alert("You must be online to delete records.");
    if (window.confirm(`WARNING: Are you sure you want to permanently delete the marksheet for ${name || 'Unknown'}?`)) {
      setIsLoadingList(true);
      try {
        const { error } = await supabase.from('marks_records').delete().eq('id', id);
        if (error) { alert("Failed to delete: " + error.message); } 
        else { setDbStudents(prev => prev.filter(s => s.id !== id)); }
      } catch(err) {
        alert("Unexpected error during delete.");
      } finally {
        setIsLoadingList(false);
      }
    }
  };

  const saveToLocalBackup = (payload: any, addNext: boolean) => {
    const currentLocal = JSON.parse(localStorage.getItem(LOCAL_BACKUP_RECORDS_KEY) || '[]');
    const localRecords: BackupRecord[] = Array.isArray(currentLocal) ? currentLocal : [];
    const duplicate = localRecords.some(
      s => s.class_name === activeClass && s.roll_no === student.roll && (s.student_name || '').toUpperCase() === student.name.toUpperCase() && s.id !== editingId
    );
    if (duplicate) {
      alert(`Duplicate Entry: ${student.name} (Roll ${student.roll}) already exists in local backup for Class ${activeClass}.`);
      return;
    }

    let updatedLocal = [...localRecords];
    if (editingId) {
      updatedLocal = updatedLocal.map(item => item.id === editingId ? { ...item, ...payload, source: 'local' } : item);
    } else {
      updatedLocal.unshift({
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...payload,
        source: 'local',
        created_at: new Date().toISOString()
      });
    }
    localStorage.setItem(LOCAL_BACKUP_RECORDS_KEY, JSON.stringify(updatedLocal));
    setDbStudents(prev => {
      const cloud = prev.filter((s: any) => s.source !== 'local');
      return [...updatedLocal, ...cloud];
    });
    showNotice('Saved in local backup only (offline safe mode).');
    proceedAfterSave(addNext);
  };

  const saveToCloud = async (addNext: boolean = false) => {
    if (!student.name || !student.roll) { alert("Student Name and Roll No required!"); return; }
    
    let myTotal = getCalculations(marks, activeClass).grandTotal;
    const payload = { student_name: student.name, roll_no: student.roll, class_name: activeClass, student_data: { ...student, photo: studentPhoto }, marks_data: marks, extra_data: { ...extraDetails, coScholastic, total: myTotal } };

    if (offlineOnlyMode) {
      saveToLocalBackup(payload, addNext);
      return;
    }

    if (!navigator.onLine) {
      savePayloadOffline({ mode: editingId ? 'update' : 'insert', id: editingId || undefined, payload });
      showNotice('Saved offline. Will sync automatically when internet is restored.');
      proceedAfterSave(addNext);
      return;
    }

    setIsSaving(true);
    let error = null;

    try {
      if (editingId) {
        const { error: updateError } = await supabase.from('marks_records').update(payload).eq('id', editingId);
        error = updateError;
      } else {
        const isDuplicate = dbStudents.some(s => s.class_name === activeClass && s.roll_no === student.roll && (s.student_name || '').toUpperCase() === student.name.toUpperCase());
        if (isDuplicate) {
          setIsSaving(false);
          alert(`Duplicate Entry: ${student.name} (Roll ${student.roll}) is already saved in Class ${activeClass}!`);
          return;
        }
        const { error: insertError } = await supabase.from('marks_records').insert([payload]);
        error = insertError;
      }
    } catch(err) {
      console.error(err);
      error = { message: "Network or Server issue occurred." };
    }

    setIsSaving(false);
    if (error) { alert("Save failed! " + error.message); } 
    else {
      setLastSaved(`Saved: ${student.name} (Roll: ${student.roll})`);
      fetchStudentsFromCloud();
      proceedAfterSave(addNext);
    }
  };

  const proceedAfterSave = (addNext: boolean) => {
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
  }

  const resetMarks = (preserveAttendance: boolean = false) => {
    setEditingId(null);
    const initial: MarksState = {};
    const subList = subjectConfig[activeClass] || DEFAULT_SUBJECTS;
    subList.forEach(sub => { initial[sub] = { t1: '', t2: '', t3: '' }; });
    setMarks(initial);
    setExtraDetails(prev => ({ attendance: preserveAttendance ? prev.attendance : "", remark: "", issueDate: defaultIssue }));
    setCoScholastic({ sports: "A", art: "A", music: "A", discipline: "A" });
    setStudentPhoto(null);
    setActiveSubjectIdx(0);
  };

  const getCalculations = useCallback((mObj: MarksState | undefined | null, clsName: string) => {
    const safeMObj = mObj || {};
    const subs = getClassSubjects(clsName, safeMObj);
    let gTotal = 0;
    subs.forEach(sub => { gTotal += (Number(safeMObj[sub]?.t1)||0) + (Number(safeMObj[sub]?.t2)||0) + (Number(safeMObj[sub]?.t3)||0); });
    const mMax = subs.length * 200;
    const perc = gTotal > 0 ? ((gTotal / mMax) * 100).toFixed(1) : "0";
    const fGrade = gTotal > 0 ? getGrade(gTotal, mMax) : "";
    return { grandTotal: gTotal, percentage: perc, finalGrade: fGrade, maxMarks: mMax };
  }, [getClassSubjects]);

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

  const getClassRank = useCallback((myTotal: number, clsName: string) => {
    if (myTotal === 0) return "";
    const classStudents = dbStudents.filter(s => s.class_name === clsName);
    let allTotals = classStudents.map(s => s.extra_data?.total || 0);
    if (!allTotals.includes(myTotal)) allTotals.push(myTotal); 
    allTotals.sort((a, b) => b - a); 
    const rank = allTotals.indexOf(myTotal) + 1;
    return rank > 0 ? `${rank}` : "";
  }, [dbStudents]);

  const handleBackupImport = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        alert('CSV me valid data nahi mila.');
        return;
      }

      const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => parseCsvLine(line));
      const metaKeys = ['name', 'student_name', 'roll', 'roll_no', 'class', 'class_name', 'father', 'mother', 'gender', 'attendance', 'remark', 'issue_date'];
      const subjectHeaders = headers
        .map((h, idx) => ({ h, idx }))
        .filter(({ h }) => !metaKeys.some(k => h.includes(k)) && !/(t1|t2|t3|term)/i.test(h))
        .map(({ h }) => h.toUpperCase())
        .filter(Boolean);
      const importedSubjects = Array.from(new Set(subjectHeaders)).slice(0, 8);
      const finalSubjects = importedSubjects.length ? importedSubjects : [...currentSubjectsList].slice(0, 8);

      if (finalSubjects.length) {
        setSubjectConfig(prev => {
          const updated = { ...prev, [activeClass]: finalSubjects };
          localStorage.setItem('sbsSubjects', JSON.stringify(updated));
          return updated;
        });
        setTempSubjects(finalSubjects);
      }

      const newLocalRecords: BackupRecord[] = rows.map((cols, rowIndex) => {
        const getCell = (...keys: string[]) => {
          const idx = headers.findIndex(h => keys.some(k => h === k || h.includes(k)));
          return idx >= 0 ? (cols[idx] || '') : '';
        };
        const marksData: MarksState = {};
        finalSubjects.forEach((sub, idx) => {
          const n1 = cols[idx * 3] || '';
          const n2 = cols[idx * 3 + 1] || '';
          const n3 = cols[idx * 3 + 2] || '';
          marksData[sub] = { t1: `${Number(n1) || ''}`, t2: `${Number(n2) || ''}`, t3: `${Number(n3) || ''}` };
        });
        const recClass = (getCell('class_name', 'class') || activeClass).toUpperCase();
        const recName = (getCell('student_name', 'name') || `IMPORTED ${rowIndex + 1}`).toUpperCase();
        const recRoll = getCell('roll_no', 'roll');
        return {
          id: `local-import-${Date.now()}-${rowIndex}`,
          student_name: recName,
          roll_no: recRoll,
          class_name: recClass,
          student_data: {
            name: recName,
            roll: recRoll,
            mother: getCell('mother'),
            father: getCell('father'),
            gender: (getCell('gender') || 'MALE').toUpperCase(),
            photo: null
          },
          marks_data: marksData,
          extra_data: {
            attendance: getCell('attendance'),
            remark: getCell('remark'),
            issueDate: getCell('issue_date') || defaultIssue,
            coScholastic: { sports: 'A', art: 'A', music: 'A', discipline: 'A' },
            total: getCalculations(marksData, recClass).grandTotal
          },
          source: 'local',
          created_at: new Date().toISOString()
        };
      });

      const existing = JSON.parse(localStorage.getItem(LOCAL_BACKUP_RECORDS_KEY) || '[]');
      const merged = [...newLocalRecords, ...(Array.isArray(existing) ? existing : [])];
      localStorage.setItem(LOCAL_BACKUP_RECORDS_KEY, JSON.stringify(merged));
      setDbStudents(prev => [...merged, ...prev.filter(s => s.source !== 'local')]);
      showNotice(`Backup imported: ${newLocalRecords.length} records (local only).`);
      setShowSubjectModal(true);
    } catch (err) {
      console.error(err);
      alert('CSV import failed. File format check karo.');
    } finally {
      e.target.value = '';
    }
  };

  const callGemini = async (prompt: string, imageBase64?: string) => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      alert('Please set NEXT_PUBLIC_GEMINI_API_KEY in .env.local');
      return null;
    }
    const body: any = {
      contents: [{
        parts: [
          { text: prompt },
          ...(imageBase64 ? [{ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }] : [])
        ]
      }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
    };
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text;
  };

  const handleAiChat = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const response = await callGemini(JSON.stringify({
        task: "Answer user's school admin prompt safely and briefly. Return JSON with keys: reply and actions.",
        user_prompt: aiPrompt
      }));
      if (!response) return;
      const parsed = JSON.parse(response);
      setAiReply(parsed.reply || response);
    } catch (err) {
      console.error(err);
      alert('AI chat failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiImageUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      setAiImage(result.split(',')[1] || null);
      setAiImageName(file.name || 'image');
    };
    reader.readAsDataURL(file);
  };

  const scanImageToDraft = async () => {
    if (!aiImage) return alert('Image upload karo pehle.');
    setIsAiLoading(true);
    try {
      const scanPrompt = JSON.stringify({
        task: "Extract marks table from image and return strict JSON only",
        schema: {
          rows: [{ student_name: "string", roll_no: "string", subjects: { "SUBJECT": { t1: "number|string", t2: "number|string", t3: "number|string" } } }]
        }
      });
      const response = await callGemini(scanPrompt, aiImage);
      if (!response) return;
      const parsed = JSON.parse(response);
      const rows = Array.isArray(parsed.rows) ? parsed.rows : [];
      setAiDraftRows(rows);
      showNotice(`${rows.length} AI rows scanned. Preview edit karke upload karo.`);
    } catch (err) {
      console.error(err);
      alert('Image scan failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const applyAiDraftRow = (idx: number) => {
    const row = aiDraftRows[idx];
    if (!row) return;
    const allStudents = [...dbStudents];
    const matched = allStudents.find(s =>
      (s.student_name || '').toUpperCase() === (row.student_name || '').toUpperCase() ||
      (row.roll_no && `${s.roll_no}` === `${row.roll_no}`)
    );
    const rowSubjects = Object.keys(row.subjects || {}).slice(0, 8);
    if (rowSubjects.length) {
      setSubjectConfig(prev => {
        const updated = { ...prev, [activeClass]: rowSubjects };
        localStorage.setItem('sbsSubjects', JSON.stringify(updated));
        return updated;
      });
    }
    const normalizedMarks: MarksState = {};
    rowSubjects.forEach(sub => {
      const r = row.subjects[sub] || {};
      normalizedMarks[sub.toUpperCase()] = { t1: `${r.t1 || ''}`, t2: `${r.t2 || ''}`, t3: `${r.t3 || ''}` };
    });
    setMarks(normalizedMarks);
    setStudent({
      name: matched?.student_name || (row.student_name || '').toUpperCase(),
      roll: `${matched?.roll_no || row.roll_no || ''}`,
      mother: matched?.student_data?.mother || '',
      father: matched?.student_data?.father || '',
      gender: matched?.student_data?.gender || 'MALE'
    });
    setEditingId(matched?.id || null);
    setView('editor');
    setStep(2);
  };

  const handleVoiceFill = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert('Voice feature browser me available nahi hai.');
    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setIsListening(true);
    recognition.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript?.toUpperCase() || '';
      const parts = text.match(/([A-Z .]+)\s+(\d{1,3})/);
      if (!parts) return showNotice('Voice format: SUBJECT 78');
      const sub = parts[1].trim();
      const mark = parts[2].trim();
      if (!marks[sub]) {
        setSubjectConfig(prev => {
          const existing = [...(prev[activeClass] || DEFAULT_SUBJECTS)];
          if (!existing.includes(sub) && existing.length < 8) existing.push(sub);
          const updated = { ...prev, [activeClass]: existing };
          localStorage.setItem('sbsSubjects', JSON.stringify(updated));
          return updated;
        });
      }
      handleMarkChange(sub, activeTerm, mark);
      showNotice(`Voice filled: ${sub} ${mark}`);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const saveSubjects = () => {
    const cleaned = Array.from(new Set(tempSubjects.map(s => s.trim().toUpperCase()).filter(Boolean))).slice(0, 8);
    if (!cleaned.length) {
      alert('At least 1 subject required.');
      return;
    }
    const newConfig = { ...subjectConfig, [activeClass]: cleaned };
    setSubjectConfig(newConfig);
    localStorage.setItem('sbsSubjects', JSON.stringify(newConfig));
    setShowSubjectModal(false);
    resetMarks(false);
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

  const activeTerm: 't1' | 't2' | 't3' = step === 2 ? 't1' : step === 3 ? 't2' : 't3';
  const activeMaxVal = step === 2 ? 40 : step === 3 ? 60 : 100;
  const currentSub = currentSubjectsList[activeSubjectIdx] || '';

  // ==========================================
  // VIEW 1: SIMPLE PIN SCREEN 🔒
  // ==========================================
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full max-w-md relative z-10 border border-white">
          <div className="text-center mb-8">
            <div className="bg-white w-24 h-24 rounded-full mx-auto flex items-center justify-center shadow-lg mb-4 p-2 border-4 border-schoolRed/10">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-extrabold text-schoolRed" style={{ fontFamily: 'Georgia, serif' }}>S.B.S. Shiksha Niketan</h1>
            <p className="text-gray-500 font-bold text-sm mt-1">Enter Any 4 Digit PIN</p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-5">
            <div className="relative">
              <UserIcon className="absolute left-4 top-3.5 text-gray-400" size={20}/>
              <input type="password" required placeholder="4 Digit PIN" maxLength={4} value={accessPin} onChange={(e) => setAccessPin(e.target.value.replace(/\D/g, ''))} className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-schoolBlue transition-all font-semibold text-center tracking-[8px]" />
            </div>
            <button type="submit" className="w-full text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 bg-schoolBlue hover:bg-blue-800">
              Open Portal
            </button>
          </form>
          <div className="mt-8 text-center text-xs text-gray-400 font-semibold">
            No authentication required. Any 4 digits work.
          </div>
        </div>
      </div>
    );
  }

  const classFilteredStudents = dbStudents.filter(s => s.class_name === activeClass);

  const bulkPrintElements = useMemo(() => {
    return classFilteredStudents.map((s, index) => {
      const safeMarks = s.marks_data || {};
      const calcs = getCalculations(safeMarks, s.class_name);
      return (
        <div key={s.id} className="marksheet-page" style={{ pageBreakAfter: index === classFilteredStudents.length - 1 ? 'auto' : 'always' }}>
          <MemoizedMarksheetTemplate theme={THEMES[activeTheme]} student={s.student_data || defaultStudent} marks={safeMarks} subjectsList={getClassSubjects(s.class_name, safeMarks)} grandTotal={calcs.grandTotal} percentage={calcs.percentage} finalGrade={calcs.finalGrade} extra={s.extra_data || defaultExtra} coScholastic={s.extra_data?.coScholastic || defaultCoScholastic} photo={s.student_data?.photo} rank={getClassRank(calcs.grandTotal, s.class_name)} activeClass={s.class_name} showTableWatermark={showTableWatermark} />
        </div>
      )
    });
  }, [classFilteredStudents, activeTheme, getClassSubjects, getCalculations, getClassRank, showTableWatermark]);

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
        {!isOnline && (
          <div className="bg-red-600 text-white text-center py-1.5 font-bold flex items-center justify-center gap-2 text-sm">
            <WifiOff size={16}/> Offline Mode: Data cannot be saved until internet is restored.
          </div>
        )}

        {view === 'dashboard' ? (
          <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 relative">
            <div className="w-full max-w-5xl">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div className="flex items-center gap-4">
                  <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain drop-shadow-md bg-white rounded-full p-1" />
                  <div>
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

                <div className="flex gap-2">
                  <label className={`px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${offlineOnlyMode ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={offlineOnlyMode}
                      onChange={(e) => {
                        setOfflineOnlyMode(e.target.checked);
                        localStorage.setItem(OFFLINE_ONLY_MODE_KEY, String(e.target.checked));
                        showNotice(e.target.checked ? 'Offline-only save enabled. Supabase par save nahi hoga.' : 'Cloud save enabled.');
                      }}
                    />
                    <WifiOff size={18} /> Offline Save
                  </label>
                  <label className="bg-white text-gray-700 border-2 border-gray-200 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 cursor-pointer">
                    <DownloadCloud size={18} /> Import Backup CSV
                    <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleBackupImport} />
                  </label>
                  <button
                    onClick={() => {
                      const nextValue = !showTableWatermark;
                      setShowTableWatermark(nextValue);
                      localStorage.setItem('sbsTableWatermark', String(nextValue));
                    }}
                    className={`px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${showTableWatermark ? 'bg-schoolBlue text-white border-schoolBlue' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >
                    <Palette size={18} /> Table Logo
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

              <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Bot size={18} className="text-purple-600" />
                  <h3 className="font-bold text-purple-700">Gemini 2.5 Flash Assistant</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="AI se bolo: class 5 ka summary do, ya marks clean karo..." className="w-full border-2 border-gray-200 rounded-xl p-3 min-h-[100px] outline-none focus:border-purple-400" />
                    <div className="flex gap-2">
                      <button onClick={handleAiChat} disabled={isAiLoading} className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
                        {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Ask AI
                      </button>
                      <button onClick={handleVoiceFill} className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${isListening ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        {isListening ? <MicOff size={16} /> : <Mic size={16} />} Voice Fill
                      </button>
                    </div>
                    {aiReply && <div className="text-sm bg-purple-50 border border-purple-100 p-3 rounded-xl">{aiReply}</div>}
                  </div>
                  <div className="space-y-2">
                    <label className="w-full border-2 border-dashed border-gray-300 rounded-xl px-3 py-5 text-center font-semibold text-gray-600 cursor-pointer block hover:border-purple-400">
                      {aiImageName ? `Image selected: ${aiImageName}` : 'Upload Marksheet Image for AI Scan'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleAiImageUpload} />
                    </label>
                    <button onClick={scanImageToDraft} disabled={isAiLoading || !aiImage} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50">Scan to Table Preview</button>
                  </div>
                </div>
                {!!aiDraftRows.length && (
                  <div className="mt-4 overflow-auto">
                    <table className="w-full text-xs border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border p-2">Name</th>
                          <th className="border p-2">Roll</th>
                          <th className="border p-2">Subjects JSON (editable)</th>
                          <th className="border p-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aiDraftRows.map((row, idx) => (
                          <tr key={idx}>
                            <td className="border p-1"><input value={row.student_name || ''} onChange={(e) => setAiDraftRows(prev => prev.map((r,i) => i===idx ? { ...r, student_name: e.target.value.toUpperCase() } : r))} className="w-full p-1 border rounded" /></td>
                            <td className="border p-1"><input value={row.roll_no || ''} onChange={(e) => setAiDraftRows(prev => prev.map((r,i) => i===idx ? { ...r, roll_no: e.target.value } : r))} className="w-full p-1 border rounded" /></td>
                            <td className="border p-1">
                              <textarea value={JSON.stringify(row.subjects || {}, null, 0)} onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value || '{}');
                                  setAiDraftRows(prev => prev.map((r, i) => i===idx ? { ...r, subjects: parsed } : r));
                                } catch {}
                              }} className="w-full p-1 border rounded min-h-[70px]" />
                            </td>
                            <td className="border p-1">
                              <button onClick={() => applyAiDraftRow(idx)} className="px-3 py-1 bg-schoolBlue text-white rounded font-bold">Apply + Preview</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-bold">Database: {activeClass}</h3>
                </div>
                <div className="divide-y divide-gray-100 min-h-[200px]">
                  {/* ✅ Original Clean Loading Screen restored here */}
                  {isLoadingList ? <div className="p-10 text-center text-gray-400"><Loader2 className="animate-spin mx-auto mb-2" size={30}/>Loading...</div> : 
                    classFilteredStudents.length === 0 ? <div className="p-10 text-center text-gray-400">Folder is empty. Add new marksheet.</div> :
                    classFilteredStudents.filter(s => (s.student_name || '').toUpperCase().includes(searchQuery.toUpperCase())).map((s) => (
                      <div key={s.id} className="p-4 flex items-center justify-between hover:bg-blue-50 cursor-pointer group transition-colors" onClick={() => {
                        setEditingId(s.id); 
                        setStudent(s.student_data || { name: s.student_name || "", roll: s.roll_no || "", mother: "", father: "", gender: "MALE" }); 
                        setMarks(s.marks_data || {}); 
                        setExtraDetails(s.extra_data || extraDetails); 
                        setCoScholastic(s.extra_data?.coScholastic || coScholastic); 
                        setStudentPhoto(s.student_data?.photo || null); 
                        setView('editor');
                      }}>
                        <div className="flex items-center gap-4">
                          {s.student_data?.photo ? <img src={s.student_data.photo} className="w-10 h-10 rounded-full object-cover object-top border" /> : <div className="h-10 w-10 bg-[#e0f7fa] rounded-full flex items-center justify-center text-schoolBlue font-bold">{(s.student_name || 'S').charAt(0)}</div>}
                          <div><h4 className="font-bold">{s.student_name || 'Unknown'}</h4><p className="text-xs text-gray-500">Roll: {s.roll_no || '-'}</p></div>
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
                        <input
                          value={sub}
                          onChange={(e) => {
                            const updated = [...tempSubjects];
                            updated[idx] = e.target.value.toUpperCase();
                            setTempSubjects(updated.slice(0, 8));
                          }}
                          className="font-bold bg-white border rounded px-2 py-1 flex-1 mr-2 outline-none focus:border-schoolBlue"
                        />
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveSubject(idx, idx - 1)} className="text-gray-500 hover:bg-gray-200 p-1 rounded"><ArrowUp size={16}/></button>
                          <button onClick={() => moveSubject(idx, idx + 1)} className="text-gray-500 hover:bg-gray-200 p-1 rounded"><ArrowDown size={16}/></button>
                          <button onClick={() => setTempSubjects(tempSubjects.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-6">
                    <input type="text" value={newSubInput} onChange={e=>setNewSubInput(e.target.value.toUpperCase())} placeholder="New Subject Name" className="flex-1 border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-schoolBlue" />
                    <button onClick={() => { if(newSubInput && !tempSubjects.includes(newSubInput) && tempSubjects.length < 8){ setTempSubjects([...tempSubjects, newSubInput]); setNewSubInput(''); } }} className="bg-gray-800 text-white px-6 font-bold rounded-xl active:scale-95">Add</button>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Maximum 8 subjects. Order yahin se preview aur marks entry dono me same rahega.</p>
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
                {notice && <div className="mb-4 bg-blue-100 text-blue-800 p-2 rounded-lg text-sm font-bold text-center">{notice}</div>}

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
                            {studentPhoto && (
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setStudentPhoto(null); }}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                                aria-label="Remove photo"
                              >
                                <X size={12} />
                              </button>
                            )}
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

                  {[2, 3, 4].includes(step) && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-schoolBlue">Term {step-1} Marks</h2>
                        <span className="text-sm font-bold text-gray-400">Sub {activeSubjectIdx + 1}/{currentSubjectsList.length}</span>
                      </div>
                      
                      <div className="bg-blue-50/50 p-8 rounded-2xl border-2 border-blue-100 flex flex-col items-center justify-center text-center shadow-inner mb-6 transition-all duration-300">
                        <input
                          value={currentSub}
                          onChange={(e) => renameSubjectEverywhere(currentSub, e.target.value)}
                          className="text-2xl font-extrabold text-gray-800 mb-6 uppercase tracking-wider bg-white border-2 border-blue-100 rounded-xl px-4 py-2 text-center w-full max-w-md outline-none focus:border-schoolBlue"
                        />
                        
                        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                          <input 
                            autoFocus
                            key={`input-${step}-${currentSub}`} 
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
                        <button onClick={() => saveToCloud(true)} disabled={isSaving} className={`w-full text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg active:scale-95 transition-all ${isOnline ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'}`}>
                          {isSaving ? <Loader2 className="animate-spin"/> : <Save/>} Save & Add Next
                        </button>
                        <button onClick={()=>saveToCloud(false)} className={`w-full text-white p-3 rounded-xl font-bold transition-colors shadow-md ${isOnline ? 'bg-schoolBlue hover:bg-blue-800' : 'bg-schoolBlue hover:bg-blue-700'}`}>Save & Close</button>
                        
                        <div className="pt-2 border-t mt-4">
                          <button onClick={triggerSinglePrint} className="w-full bg-gray-800 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-900 shadow-lg active:scale-95 transition-all"><Printer size={20}/> Print / Save PDF (HD)</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-between pt-4 border-t border-gray-200">
                  <button onClick={() => setStep(s => Math.max(1, s - 1))} className={`px-6 py-2 rounded-xl font-bold transition-all ${step === 1 ? 'text-gray-300' : 'bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-600'}`}>Back</button>
                  {step < 5 && step === 1 && <button onClick={() => setStep(s => Math.min(5, s + 1))} className="px-8 py-2 bg-schoolBlue text-white rounded-xl font-bold shadow-md hover:bg-blue-800 active:scale-95 transition-all">Next</button>}
                  {step > 1 && step < 5 && <button onClick={() => setStep(s => Math.min(5, s + 1))} className="px-8 py-2 bg-gray-800 text-white rounded-xl font-bold shadow-md hover:bg-gray-900 active:scale-95 transition-all">Skip to Term {step}</button>}
                </div>
              </div>

              <div className="w-full lg:w-[55%] bg-gray-800 lg:p-6 flex justify-center overflow-auto relative">
                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">Live Preview</div>
                <div className="lg:origin-top lg:scale-[0.70] xl:scale-[0.80] transition-transform">
                  <MemoizedMarksheetTemplate templateId="marksheet-preview" theme={THEMES[activeTheme]} student={student} marks={marks} subjectsList={currentSubjectsList} grandTotal={grandTotal} percentage={percentage} finalGrade={finalGrade} extra={extraDetails} coScholastic={coScholastic} photo={studentPhoto} rank={getClassRank(grandTotal, activeClass)} activeClass={activeClass} showTableWatermark={showTableWatermark} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div id="print-single-container" className="print-area">
        <div className="marksheet-page">
          <MemoizedMarksheetTemplate theme={THEMES[activeTheme]} student={student} marks={marks} subjectsList={currentSubjectsList} grandTotal={grandTotal} percentage={percentage} finalGrade={finalGrade} extra={extraDetails} coScholastic={coScholastic} photo={studentPhoto} rank={getClassRank(grandTotal, activeClass)} activeClass={activeClass} showTableWatermark={showTableWatermark} />
        </div>
      </div>

      <div id="print-bulk-container" className="print-area">
        {bulkPrintElements}
      </div>
    </>
  )
}

const MarksheetTemplate = ({ theme, student, marks, subjectsList, grandTotal, percentage, finalGrade, extra, coScholastic, photo, rank, activeClass, showTableWatermark }: any) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const t = theme || THEMES.classic; 
  const resolvedSubjects = (subjectsList && subjectsList.length > 0) ? subjectsList : Object.keys(marks || {});

  return (
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
            {photo ? (
              <div className="w-28 h-36 border-[2px] border-gray-400 flex items-center justify-center bg-gray-50 overflow-hidden">
                <img src={photo} className="w-full h-full object-cover object-top"/>
              </div>
            ) : <div className="w-28 h-36" />}
          </div>

          <div className={`${t.bgHighlight} border ${t.border} p-3 grid grid-cols-2 gap-x-6 gap-y-2 font-bold text-[13px] mb-3 uppercase`}>
            <div className="flex items-center"><span className="w-[130px] text-left">STUDENT'S NAME</span><span className="w-[20px] text-center">:</span><span className="flex-1 text-left">{student?.name || ''}</span></div>
            <div className="flex items-center"><span className="w-[80px] text-left">ROLL NO.</span><span className="w-[20px] text-center">:</span><span className="flex-1 text-left">{student?.roll || ''}</span></div>
            <div className="flex items-center"><span className="w-[130px] text-left">MOTHER'S NAME</span><span className="w-[20px] text-center">:</span><span className="flex-1 text-left">{student?.mother || ''}</span></div>
            <div className="flex items-center"><span className="w-[80px] text-left">GENDER</span><span className="w-[20px] text-center">:</span><span className="flex-1 text-left">{student?.gender || ''}</span></div>
            <div className="flex items-center col-span-2"><span className="w-[130px] text-left">FATHER'S NAME</span><span className="w-[20px] text-center">:</span><span className="flex-1 text-left">{student?.father || ''}</span></div>
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
                {resolvedSubjects.map((sub: string, i: number) => {
                  let subData = (marks || {})[sub] || {}; let tot = (Number(subData.t1)||0) + (Number(subData.t2)||0) + (Number(subData.t3)||0);
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
            <div className="flex gap-2">TOTAL MAXIMUM MARKS : <span className={`${t.text} text-[15px]`}>{resolvedSubjects.length * 200}</span></div>
            <div className="flex gap-2">TOTAL OBTAINED : <span className={`${t.text} text-[15px]`}>{grandTotal}</span></div>
            <div className="flex gap-2">PERCENTAGE : <span className={`${t.text} text-[15px]`}>{percentage}%</span></div>
          </div>

          {showTableWatermark && (
            <div className="relative h-0 flex justify-center pointer-events-none">
              <img src="/logo.png" alt="" className="w-[480px] h-[480px] object-contain opacity-[0.07] -translate-y-[260px]" />
            </div>
          )}

          <div className="w-full flex flex-col mt-auto mb-5">
            <table className="w-full text-[10px] border-[2px] border-black text-center mb-2 font-bold">
              <tbody>
                <tr className={`${t.bgHeader} border-b-[2px] border-black`}>
                  <td colSpan={2} className="text-left p-1.5 border-r-[2px] border-black text-black">Co-Scholastic Area</td>
                  <td colSpan={6} className={`text-right p-1.5 text-[10px] font-normal ${t.textSecondary}`}>A+: Outstanding | A: Excellent | B+: Very Good | B: Good | C: Average</td>
                </tr>
                <tr>
                  <td className="p-1 border-r border-black text-left w-24">Sports & Games</td><td className={`p-1 border-r-[2px] border-black w-10 ${t.text} text-xs`}>{coScholastic?.sports || ''}</td>
                  <td className="p-1 border-r border-black text-left w-24">Art & Craft</td><td className={`p-1 border-r-[2px] border-black w-10 ${t.text} text-xs`}>{coScholastic?.art || ''}</td>
                  <td className="p-1 border-r border-black text-left w-24">Music & Dance</td><td className={`p-1 border-r-[2px] border-black w-10 ${t.text} text-xs`}>{coScholastic?.music || ''}</td>
                  <td className="p-1 border-r border-black text-left w-24">Discipline</td><td className={`p-1 border-black w-10 ${t.text} text-xs`}>{coScholastic?.discipline || ''}</td>
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
              <div>Remark : <span className={`border-b border-black inline-block min-w-[200px] ${t.text} uppercase px-2`}>{extra?.remark || ''}</span></div>
              <div>Attendance : <span className={`border-b border-black inline-block min-w-[60px] text-center ${t.text} px-2`}>{extra?.attendance || ''}</span></div>
              <div>Class Rank : <span className={`border-b border-black inline-block min-w-[60px] text-center ${t.text} px-2 text-sm`}>{rank}</span></div>
            </div>
          </div>

          <div className="flex justify-between items-end px-8 pt-1 pb-1 font-semibold text-sm mt-auto">
            <div className="flex flex-col items-center pt-1 w-32">
              <span className="font-bold mb-1">{formatDate(extra?.issueDate)}</span>
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

const MemoizedMarksheetTemplate = React.memo(MarksheetTemplate);
