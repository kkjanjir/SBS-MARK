'use client'
import { useState, useEffect } from 'react';
import { Search, Plus, FileText, ChevronRight, ChevronLeft, Printer, Download, Home, Edit, CheckCircle, Save, Loader2, Folder, Image as ImageIcon, Settings, X, Trash2, DownloadCloud, Palette, Lock, User as UserIcon, LogOut } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// 🚀 SUPABASE CONNECTION
const supabaseUrl = 'https://jrvsjjzmkpkwmhbcohyq.supabase.co/';
const supabaseKey = 'sb_publishable_7jwgTYdDmbbCUJK52IHNMw_JoZF-OYD';
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_SUBJECTS = ['HINDI', 'ENGLISH', 'MATHEMATICS', 'SCIENCE', 'SOCIAL SCIENCE', 'ART AND DRAWING', 'COMPUTER', 'G.K.'];
const remarksList = ["Excellent performance, keep it up!", "Good effort, can do better in Science.", "Needs to focus more on studies.", "Outstanding participation in class."];

// 🎨 THEME CONFIGURATION
const THEMES = {
  classic: { id: 'classic', name: '🔴 Classic Red', border: 'border-red-700', text: 'text-red-700', bg: 'bg-red-700', textSecondary: 'text-blue-900', bgHeader: 'bg-orange-100', bgHighlight: 'bg-cyan-50', ring: 'ring-red-700' },
  emerald: { id: 'emerald', name: '🟢 Emerald Green', border: 'border-emerald-700', text: 'text-emerald-700', bg: 'bg-emerald-700', textSecondary: 'text-slate-800', bgHeader: 'bg-emerald-100', bgHighlight: 'bg-slate-100', ring: 'ring-emerald-700' },
  royal: { id: 'royal', name: '🟣 Royal Purple', border: 'border-purple-800', text: 'text-purple-800', bg: 'bg-purple-800', textSecondary: 'text-amber-800', bgHeader: 'bg-purple-100', bgHighlight: 'bg-amber-50', ring: 'ring-purple-800' }
};

type MarksState = Record<string, { t1: string; t2: string; t3: string }>;
type CoScholasticState = { sports: string; art: string; music: string; discipline: string };

export default function MarksheetApp() {
  // 🔒 AUTH STATES
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // APP STATES
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClass, setActiveClass] = useState<string>('5'); 
  const [showPrePrimary, setShowPrePrimary] = useState(false);
  const [activeTheme, setActiveTheme] = useState<'classic'|'emerald'|'royal'>('classic');
  
  const [subjectConfig, setSubjectConfig] = useState<Record<string, string[]>>({});
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [tempSubjects, setTempSubjects] = useState<string[]>([]);
  const [newSubInput, setNewSubInput] = useState('');

  const [dbStudents, setDbStudents] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [lastSaved, setLastSaved] = useState('');
  
  // 🖨️ PRINT STATES
  const [isPreparingBulk, setIsPreparingBulk] = useState(false);
  const [printMode, setPrintMode] = useState<'single' | 'bulk'>('single');

  const currentYear = new Date().getFullYear();
  const defaultIssue = new Date().getMonth() > 3 ? `${currentYear + 1}-03-31` : `${currentYear}-03-31`;
  const maxDobDate = new Date(); maxDobDate.setFullYear(maxDobDate.getFullYear() - 2);
  const maxDobStr = maxDobDate.toISOString().split('T')[0];

  const [student, setStudent] = useState({ name: "", roll: "", mother: "", father: "", dob: "", admission: "", gender: "MALE", address: "" });
  const [extraDetails, setExtraDetails] = useState({ attendance: "", remark: "", issueDate: defaultIssue });
  const [coScholastic, setCoScholastic] = useState<CoScholasticState>({ sports: "A", art: "A", music: "A", discipline: "A" });
  const [studentPhoto, setStudentPhoto] = useState<string | null>(null);
  const [marks, setMarks] = useState<MarksState>({});

  const uniqueAddresses = Array.from(new Set(dbStudents.map(s => s.student_data?.address).filter(Boolean)));
  const currentSubjectsList = subjectConfig[activeClass] || DEFAULT_SUBJECTS;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setIsCheckingAuth(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const savedConfig = localStorage.getItem('sbsSubjects');
    if (savedConfig) setSubjectConfig(JSON.parse(savedConfig));
    const savedTheme = localStorage.getItem('sbsTheme') as any;
    if (savedTheme && THEMES[savedTheme]) setActiveTheme(savedTheme);
    resetMarks();
  }, [activeClass]);

  const fetchStudentsFromCloud = async () => {
    if (!session) return;
    setIsLoadingList(true);
    const { data, error } = await supabase.from('marks_records').select('*').order('created_at', { ascending: false });
    if (data) setDbStudents(data);
    setIsLoadingList(false);
  };

  useEffect(() => { if (session && view === 'dashboard') fetchStudentsFromCloud(); }, [session, view]);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setIsLoggingIn(true); setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError(error.message);
    setIsLoggingIn(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setView('dashboard'); };
  const handleDetailChange = (e: any) => { setStudent({ ...student, [e.target.name]: e.target.value.toUpperCase() }); };

  const handleMarkChange = (sub: string, term: 't1' | 't2' | 't3', value: string) => {
    let max = term === 't1' ? 40 : term === 't2' ? 60 : 100;
    if (value !== '') { let numVal = Number(value); if (numVal < 0 || numVal > max) return; }
    setMarks(prev => ({ ...prev, [sub]: { ...(prev[sub] || {t1:'', t2:'', t3:''}), [term]: value } }));
  };

  const handlePhotoUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setStudentPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const saveToCloud = async (addNext: boolean = false) => {
    if (!student.name || !student.roll) { alert("Student Name and Roll No required!"); return; }
    setIsSaving(true);
    let myTotal = getCalculations(marks, activeClass).grandTotal;
    
    const { data, error } = await supabase.from('marks_records').insert([
      { student_name: student.name, roll_no: student.roll, class_name: activeClass, student_data: { ...student, photo: studentPhoto }, marks_data: marks, extra_data: { ...extraDetails, coScholastic, total: myTotal } }
    ]);

    setIsSaving(false);
    if (error) { alert("Save failed! " + error.message); } 
    else {
      setLastSaved(`Saved: ${student.name} (Roll: ${student.roll})`);
      if (addNext) {
        const nextRoll = isNaN(Number(student.roll)) ? "" : (Number(student.roll) + 1).toString();
        setStudent({ name: "", roll: nextRoll, mother: "", father: "", dob: "", admission: "", gender: "MALE", address: student.address });
        resetMarks();
        setStep(1);
        setTimeout(() => setLastSaved(''), 4000);
      } else {
        setView('dashboard');
        resetMarks();
      }
    }
  };

  const resetMarks = () => {
    const initial: MarksState = {};
    const subList = subjectConfig[activeClass] || DEFAULT_SUBJECTS;
    subList.forEach(sub => { initial[sub] = { t1: '', t2: '', t3: '' }; });
    setMarks(initial);
    setExtraDetails({ attendance: "", remark: "", issueDate: defaultIssue });
    setCoScholastic({ sports: "A", art: "A", music: "A", discipline: "A" });
    setStudentPhoto(null);
  };

  const getGrade = (marksObtained: number | string, maxMarks: number) => {
    if (marksObtained === '') return '';
    let p = (Number(marksObtained) / maxMarks) * 100;
    if (p >= 91) return 'A1'; if (p >= 81) return 'A2'; if (p >= 71) return 'B1'; if (p >= 61) return 'B2';
    if (p >= 51) return 'C1'; if (p >= 41) return 'C2'; if (p >= 33) return 'D';  return 'E';
  };

  const getCalculations = (mObj: MarksState, clsName: string) => {
    const subs = subjectConfig[clsName] || DEFAULT_SUBJECTS;
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
    resetMarks();
  };

  // 🖨️ PERFECT NATIVE PRINT TRIGGERS
  const triggerSinglePrint = () => {
    setPrintMode('single');
    document.title = `${student.name || 'Student'}_Class_${activeClass}_Marksheet`;
    setTimeout(() => { window.print(); }, 100);
  };

  const triggerBulkPrint = () => {
    const classStudents = dbStudents.filter(s => s.class_name === activeClass);
    if (classStudents.length === 0) return alert("No students in this class to download!");
    setIsPreparingBulk(true);
    setPrintMode('bulk');
    document.title = `Class_${activeClass}_All_Marksheets`;
    // Delay ensures the DOM fully renders the hidden marksheet list before calling print
    setTimeout(() => { 
      setIsPreparingBulk(false);
      window.print(); 
      setPrintMode('single'); // revert back
    }, 1000);
  };


  // ==========================================
  // VIEW 1: LOGIN SCREEN 🔒
  // ==========================================
  if (isCheckingAuth) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-schoolBlue" size={48}/></div>;

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full max-w-md relative z-10 border border-white">
          <div className="text-center mb-8">
            <div className="bg-white w-24 h-24 rounded-full mx-auto flex items-center justify-center shadow-lg mb-4 p-2 border-4 border-schoolRed/10">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-extrabold text-schoolRed" style={{ fontFamily: 'Georgia, serif' }}>SBS Shiksha Niketan</h1>
            <p className="text-gray-500 font-bold text-sm mt-1">Admin Portal Login</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold text-center border border-red-100">{loginError}</div>}
            
            <div className="relative">
              <UserIcon className="absolute left-4 top-3.5 text-gray-400" size={20}/>
              <input type="email" required placeholder="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-schoolBlue transition-all font-semibold" />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400" size={20}/>
              <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-schoolBlue transition-all font-semibold" />
            </div>

            <button type="submit" disabled={isLoggingIn} className="w-full bg-schoolBlue hover:bg-blue-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95">
              {isLoggingIn ? <Loader2 className="animate-spin"/> : "Secure Login"}
            </button>
          </form>
          <div className="mt-8 text-center text-xs text-gray-400 font-semibold flex items-center justify-center gap-1">
            <Lock size={12}/> Protected by Supabase Auth
          </div>
        </div>
      </div>
    );
  }

  const classFilteredStudents = dbStudents.filter(s => s.class_name === activeClass);

  return (
    <>
      {/* 🛑 THE ULTIMATE CSS PRINT ENGINE */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0 !important; }
          body, html { margin: 0 !important; padding: 0 !important; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          
          /* Hide all UI elements during print */
          .app-ui-wrapper { display: none !important; }
          
          /* Show ONLY the print container */
          .print-render-container { display: block !important; position: absolute; top: 0; left: 0; width: 100%; background: white; z-index: 9999; }
          
          /* Strict 1-Page constraint per marksheet */
          .marksheet-page { 
            width: 210mm !important; 
            height: 296mm !important; /* 1mm buffer so it NEVER spills to page 2 */
            overflow: hidden !important; 
            page-break-after: always; 
            page-break-inside: avoid;
            margin: 0 auto !important; 
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          /* Remove page break from the very last marksheet so no blank page appears at the end */
          .marksheet-page:last-child { page-break-after: auto !important; }
        }
      `}} />

      {/* 💻 DASHBOARD & WIZARD UI WRAPPER (Hidden when printing) */}
      <div className="app-ui-wrapper">
        
        {isPreparingBulk && (
          <div className="fixed inset-0 bg-black/80 z-[9999] flex flex-col items-center justify-center text-white backdrop-blur-sm">
            <Loader2 className="animate-spin mb-4" size={64} />
            <h2 className="text-2xl font-bold mb-2">Preparing HD Print Engine...</h2>
            <p className="text-gray-300">Loading {classFilteredStudents.length} marksheets. Please wait.</p>
          </div>
        )}

        {view === 'dashboard' ? (
          <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 relative">
            <div className="w-full max-w-5xl">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div className="flex items-center gap-4">
                  <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain drop-shadow-md bg-white rounded-full p-1" />
                  <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-schoolRed tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>SBS Shiksha Niketan</h1>
                    <p className="text-gray-600 font-bold tracking-wide mt-1">EduPrime SMS <span className="text-schoolBlue ml-2 px-2 py-0.5 bg-blue-100 rounded text-xs font-bold">Admin Portal</span></p>
                  </div>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-100">
                  <LogOut size={18} /> Logout
                </button>
              </div>

              <div className="mb-6 flex flex-wrap gap-3">
                <button onClick={() => setShowPrePrimary(!showPrePrimary)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${['NURSERY', 'LKG', 'UKG'].includes(activeClass) ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}>
                  <Folder size={18} className={['NURSERY', 'LKG', 'UKG'].includes(activeClass) ? "text-yellow-200" : "text-gray-400"}/> Pre-Primary
                </button>
                {['1', '2', '3', '4', '5'].map(cls => (
                  <button key={cls} onClick={() => {setActiveClass(cls); setShowPrePrimary(false);}} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${activeClass === cls ? 'bg-schoolBlue text-white scale-105' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}>
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
                
                <div className="bg-white border-2 border-gray-200 rounded-xl flex items-center px-3 shadow-sm hover:border-gray-300 transition-all">
                  <Palette size={18} className="text-gray-400 mr-2" />
                  <select value={activeTheme} onChange={e => { setActiveTheme(e.target.value as any); localStorage.setItem('sbsTheme', e.target.value); }} className="py-3 bg-transparent font-bold text-gray-700 outline-none cursor-pointer appearance-none pr-4">
                    {Object.values(THEMES).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { setTempSubjects([...currentSubjectsList]); setShowSubjectModal(true); }} className="bg-white text-gray-700 border-2 border-gray-200 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 flex-1 sm:flex-none">
                    <Settings size={20} /> Subjects
                  </button>
                  <button onClick={triggerBulkPrint} className="bg-green-600 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-green-700 flex-1 sm:flex-none">
                    <DownloadCloud size={20} /> All PDF
                  </button>
                  <button onClick={() => { resetMarks(); setStep(1); setView('editor'); }} className="bg-schoolBlue text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-800 flex-1 sm:flex-none">
                    <Plus size={20} /> Add
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50/50 flex justify-between"><h3 className="font-bold">Database: {activeClass}</h3></div>
                <div className="divide-y divide-gray-100 min-h-[200px]">
                  {isLoadingList ? <div className="p-10 text-center text-gray-400"><Loader2 className="animate-spin mx-auto mb-2" size={30}/>Loading...</div> : 
                    classFilteredStudents.length === 0 ? <div className="p-10 text-center text-gray-400">Folder is empty. Add new marksheet.</div> :
                    classFilteredStudents.filter(s => s.student_name.includes(searchQuery.toUpperCase())).map((s) => (
                      <div key={s.id} className="p-4 flex items-center justify-between hover:bg-blue-50 cursor-pointer" onClick={() => {
                        setStudent(s.student_data); setMarks(s.marks_data); setExtraDetails(s.extra_data || extraDetails); setCoScholastic(s.extra_data?.coScholastic || coScholastic); setStudentPhoto(s.student_data.photo || null); setView('editor');
                      }}>
                        <div className="flex items-center gap-4">
                          {s.student_data?.photo ? <img src={s.student_data.photo} className="w-10 h-10 rounded-full object-cover object-top" /> : <div className="h-10 w-10 bg-[#e0f7fa] rounded-full flex items-center justify-center text-schoolBlue font-bold">{s.student_name.charAt(0)}</div>}
                          <div><h4 className="font-bold">{s.student_name}</h4><p className="text-xs text-gray-500">Roll: {s.roll_no}</p></div>
                        </div>
                        <ChevronRight className="text-gray-400" />
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            {showSubjectModal && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
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
                    <input type="text" value={newSubInput} onChange={e=>setNewSubInput(e.target.value.toUpperCase())} placeholder="New Subject Name" className="flex-1 border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-schoolBlue" />
                    <button onClick={() => { if(newSubInput && !tempSubjects.includes(newSubInput)){ setTempSubjects([...tempSubjects, newSubInput]); setNewSubInput(''); } }} className="bg-gray-800 text-white px-6 font-bold rounded-xl">Add</button>
                  </div>
                  <button onClick={saveSubjects} className="w-full bg-schoolBlue text-white py-4 rounded-xl font-bold hover:bg-blue-800">Save Subject List</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-screen bg-gray-100 flex flex-col font-sans overflow-x-hidden">
            <div className="bg-white shadow-sm border-b px-6 py-3 flex justify-between items-center">
              <button onClick={() => setView('dashboard')} className="font-bold flex items-center gap-2"><Home size={20}/> Back</button>
              <span className="font-bold text-schoolBlue">Editing: {activeClass}</span>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row w-full">
              <div className="w-full lg:w-[45%] bg-white p-6 border-r overflow-y-auto h-[calc(100vh-60px)]">
                
                {lastSaved && <div className="mb-4 bg-green-100 text-green-800 p-2 rounded-lg text-sm font-bold text-center animate-pulse">{lastSaved}</div>}

                <div className="flex justify-between items-center mb-6 relative">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-0 h-1 bg-schoolBlue -z-10 -translate-y-1/2" style={{ width: `${((step - 1) / 4) * 100}%` }}></div>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} onClick={() => setStep(s)} className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer ${step === s ? 'bg-schoolBlue text-white ring-2 ring-offset-2 ring-schoolBlue' : step > s ? 'bg-schoolBlue text-white' : 'bg-white text-gray-400 border'}`}>{s}</div>
                  ))}
                </div>

                <div className="space-y-4">
                  {step === 1 && (
                    <>
                      <h2 className="text-xl font-bold mb-4">1. Details & Photo</h2>
                      <div className="flex items-center gap-4 mb-4">
                        <label className="cursor-pointer">
                          <div className="w-20 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-schoolBlue bg-gray-50 overflow-hidden relative">
                            {studentPhoto ? <img src={studentPhoto} className="w-full h-full object-cover object-top" /> : <><ImageIcon size={24} className="text-gray-400 mb-1"/><span className="text-[10px] font-bold text-gray-500">Upload</span></>}
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                          </div>
                        </label>
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div><label className="text-xs font-bold">Name</label><input type="text" name="name" value={student.name} onChange={handleDetailChange} className="w-full border p-2 rounded" /></div>
                          <div><label className="text-xs font-bold">Roll No</label><input type="text" name="roll" value={student.roll} onChange={(e)=>setStudent({...student, roll: e.target.value})} className="w-full border p-2 rounded" /></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-bold">Gender</label><select name="gender" value={student.gender} onChange={(e)=>setStudent({...student, gender: e.target.value})} className="w-full border p-2 rounded"><option>MALE</option><option>FEMALE</option></select></div>
                        <div><label className="text-xs font-bold">DOB</label><input type="date" name="dob" value={student.dob} max={maxDobStr} min="2000-01-01" onChange={(e)=>setStudent({...student, dob: e.target.value})} className="w-full border p-2 rounded uppercase" /></div>
                        <div><label className="text-xs font-bold">Father</label><input type="text" name="father" value={student.father} onChange={handleDetailChange} className="w-full border p-2 rounded" /></div>
                        <div><label className="text-xs font-bold">Mother</label><input type="text" name="mother" value={student.mother} onChange={handleDetailChange} className="w-full border p-2 rounded" /></div>
                        <div className="col-span-2">
                          <label className="text-xs font-bold">Address</label>
                          <input list="addresses" type="text" name="address" value={student.address} onChange={(e)=>setStudent({...student, address: e.target.value.toUpperCase()})} className="w-full border p-2 rounded" />
                          <datalist id="addresses">{uniqueAddresses.map((a:any, i) => <option key={i} value={a}/>)}</datalist>
                        </div>
                      </div>
                    </>
                  )}

                  {[2, 3, 4].includes(step) && (
                    <>
                      <h2 className="text-xl font-bold mb-4">Term {step-1} Marks</h2>
                      {currentSubjectsList.map(sub => {
                        const term = step===2?'t1':step===3?'t2':'t3';
                        const maxVal = step===2?40:step===3?60:100;
                        return (
                        <div key={sub} className="flex justify-between items-center bg-gray-50 p-2 rounded border mb-2">
                          <span className="font-bold text-xs">{sub}</span>
                          <div className="flex items-center gap-2">
                            <input type="number" value={marks[sub]?.[term] || ''} onChange={(e) => handleMarkChange(sub, term, e.target.value)} className="w-16 border p-1 rounded text-center font-bold outline-none focus:border-schoolBlue" />
                            <span className="text-xs font-bold text-gray-400 w-12 text-right">MM: {maxVal}</span>
                          </div>
                        </div>
                      )})}
                    </>
                  )}

                  {step === 5 && (
                    <>
                      <h2 className="text-xl font-bold mb-4">Final Touches & Export</h2>
                      <div className="grid grid-cols-2 gap-3 mb-4 border p-4 rounded-xl bg-gray-50">
                        {['sports', 'art', 'music', 'discipline'].map(item => (
                          <div key={item}>
                            <label className="text-xs font-bold capitalize">{item}</label>
                            <select value={coScholastic[item as keyof CoScholasticState]} onChange={(e)=>setCoScholastic({...coScholastic, [item]: e.target.value})} className="w-full border p-2 rounded bg-white">
                              <option value="A+">A+ (Outstanding)</option><option value="A">A (Excellent)</option>
                              <option value="B+">B+ (Very Good)</option><option value="B">B (Good)</option><option value="C">C (Average)</option>
                            </select>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-bold">Attendance</label><input type="text" value={extraDetails.attendance} onChange={(e)=>setExtraDetails({...extraDetails, attendance: e.target.value})} className="w-full border p-2 rounded" /></div>
                        <div><label className="text-xs font-bold">Issue Date</label><input type="date" value={extraDetails.issueDate} onChange={(e)=>setExtraDetails({...extraDetails, issueDate: e.target.value})} className="w-full border p-2 rounded" /></div>
                        <div className="col-span-2">
                          <label className="text-xs font-bold">Remarks</label>
                          <input list="remarks-list" type="text" value={extraDetails.remark} onChange={(e)=>setExtraDetails({...extraDetails, remark: e.target.value})} className="w-full border p-2 rounded" />
                          <datalist id="remarks-list">{remarksList.map((r,i)=><option key={i} value={r}/>)}</datalist>
                        </div>
                      </div>

                      <div className="mt-8 space-y-3">
                        <button onClick={() => saveToCloud(true)} disabled={isSaving} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-green-700">
                          {isSaving ? <Loader2 className="animate-spin"/> : <Save/>} Save & Add Next Student
                        </button>
                        <button onClick={()=>saveToCloud(false)} className="w-full bg-schoolBlue text-white p-3 rounded-lg font-bold hover:bg-blue-800 transition-colors">Save & Close</button>
                        
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                          <button onClick={triggerSinglePrint} className="bg-gray-800 text-white p-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-gray-900"><Printer size={18}/> Print Format</button>
                          <button onClick={triggerSinglePrint} className="bg-red-600 text-white p-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-red-700"><Download size={18}/> Save PDF</button>
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-1 font-semibold">*To Save PDF natively: Tap either button above, then click "Share" icon in the print dialog and choose "Save to Files".</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep(s => Math.max(1, s - 1))} className="px-4 py-2 border rounded font-bold">Back</button>
                  {step < 5 && <button onClick={() => setStep(s => Math.min(5, s + 1))} className="px-6 py-2 bg-schoolBlue text-white rounded font-bold shadow-md">Next</button>}
                </div>
              </div>

              {/* LIVE PREVIEW PANE */}
              <div className="w-full lg:w-[55%] bg-gray-800 lg:p-4 flex justify-center overflow-auto">
                <div className="lg:origin-top lg:scale-[0.70] xl:scale-[0.80] transition-transform">
                  <MarksheetTemplate theme={THEMES[activeTheme]} student={student} marks={marks} subjectsList={currentSubjectsList} grandTotal={grandTotal} percentage={percentage} finalGrade={finalGrade} extra={extraDetails} coScholastic={coScholastic} photo={studentPhoto} rank={getClassRank(grandTotal, activeClass)} activeClass={activeClass} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🖨️ THE PRINT RENDER CONTAINER (Hidden in Browser, Visible to Printer) */}
      <div className="hidden print-render-container">
        {printMode === 'single' && (
          <div className="marksheet-page">
            <MarksheetTemplate theme={THEMES[activeTheme]} student={student} marks={marks} subjectsList={currentSubjectsList} grandTotal={grandTotal} percentage={percentage} finalGrade={finalGrade} extra={extraDetails} coScholastic={coScholastic} photo={studentPhoto} rank={getClassRank(grandTotal, activeClass)} activeClass={activeClass} />
          </div>
        )}

        {printMode === 'bulk' && classFilteredStudents.map(s => {
          const calcs = getCalculations(s.marks_data, s.class_name);
          return (
            <div key={s.id} className="marksheet-page">
              <MarksheetTemplate theme={THEMES[activeTheme]} student={s.student_data} marks={s.marks_data} subjectsList={subjectConfig[s.class_name] || DEFAULT_SUBJECTS} grandTotal={calcs.grandTotal} percentage={calcs.percentage} finalGrade={calcs.finalGrade} extra={s.extra_data} coScholastic={s.extra_data?.coScholastic || {sports:'A',art:'A',music:'A',discipline:'A'}} photo={s.student_data.photo} rank={getClassRank(calcs.grandTotal, s.class_name)} activeClass={s.class_name} />
            </div>
          )
        })}
      </div>
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
    <div className={`w-[210mm] h-[296mm] bg-white relative overflow-hidden text-black text-sm box-border mx-auto p-2 ${t.ring} shadow-xl print:shadow-none`}>
      <div className="absolute inset-0 flex justify-center items-center z-0 opacity-[0.05] pointer-events-none"><img src="/logo.png" className="w-[450px] h-[450px]" /></div>
      <div className={`relative z-10 h-full w-full border-[6px] ${t.border} p-[3px] flex flex-col box-border bg-white`}>
        <div className={`border-[2px] ${t.border} h-full w-full p-4 flex flex-col box-border`}>
          
          <div className="flex justify-between items-start mb-3">
            <div className="w-28 h-28 p-1"><img src="/logo.png" className="w-full h-full object-contain" /></div>
            <div className="text-center flex-1 px-2">
              <h1 className={`text-[2.2rem] leading-none font-extrabold ${t.text} uppercase tracking-widest drop-shadow-sm`} style={{ fontFamily: 'Georgia, serif' }}>SBS Shiksha Niketan</h1>
              <p className="font-semibold mt-1 text-[13px] text-gray-800">Karaspur Prithvipur, Ghazipur, Uttar Pradesh – 233226</p>
              <div className="mt-3 mb-2 flex justify-center"><span className={`${t.bg} text-white px-5 py-1.5 rounded-full ring-2 ring-offset-2 ${t.ring} font-bold uppercase text-[11px]`}>PROGRESS EVALUATION REPORT</span></div>
              <p className={`${t.textSecondary} font-extrabold mt-3 text-sm tracking-wide`}>ACADEMIC SESSION : 2025-26</p>
              <p className="font-extrabold text-[15px] mt-1 mb-2">CLASS : {activeClass}</p>
            </div>
            <div className="w-24 h-28 border-[2px] border-gray-400 flex items-center justify-center bg-gray-50 overflow-hidden">
              {photo ? <img src={photo} className="w-full h-full object-cover object-top"/> : <span className="text-gray-400 text-xs text-center font-bold px-2">Upload Photo</span>}
            </div>
          </div>

          <div className={`${t.bgHighlight} border ${t.border} p-2 grid grid-cols-2 gap-x-8 gap-y-1 font-semibold text-[13px] mb-3 uppercase`}>
            <div className="flex"><span className="w-36">STUDENT'S NAME</span><span>: {student.name}</span></div>
            <div className="flex"><span className="w-32">ROLL NO.</span><span>: {student.roll}</span></div>
            <div className="flex"><span className="w-36">MOTHER'S NAME</span><span>: {student.mother}</span></div>
            <div className="flex"><span className="w-32">ADMISSION NO.</span><span>: {student.admission}</span></div>
            <div className="flex"><span className="w-36">FATHER'S NAME</span><span>: {student.father}</span></div>
            <div className="flex"><span className="w-32">DATE OF BIRTH</span><span>: {formatDate(student.dob)}</span></div>
            <div className="flex"><span className="w-36">GENDER</span><span>: {student.gender}</span></div>
            <div className="flex col-span-2"><span className="w-36">ADDRESS</span><span>: {student.address}</span></div>
          </div>

          <div className="w-full flex-1 mb-3 flex flex-col">
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

          <div className="w-full flex flex-col mt-auto mb-5">
            <table className="w-full text-[10px] border-[2px] border-black text-center mb-1 font-bold">
              <tbody>
                <tr className={`${t.bgHeader} border-b-[2px] border-black`}>
                  <td colSpan={2} className="text-left p-1 border-r-[2px] border-black text-black">Co-Scholastic Area</td>
                  <td colSpan={6} className={`text-right p-1 text-[9px] font-normal ${t.textSecondary}`}>A+: Outstanding A: Excellent B+: Very Good B: Good C: Average</td>
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

          <div className="flex justify-between items-end px-8 pt-1 pb-1 font-semibold text-sm">
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