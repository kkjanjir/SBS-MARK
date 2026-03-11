'use client'
import { useState, useEffect } from 'react';
import { Search, Plus, FileText, ChevronRight, ChevronLeft, Printer, Download, Home, Edit, CheckCircle, Save, Loader2, Folder, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// 🚀 SUPABASE CONNECTION
const supabaseUrl = 'https://jrvsjjzmkpkwmhbcohyq.supabase.co/';
const supabaseKey = 'sb_publishable_7jwgTYdDmbbCUJK52IHNMw_JoZF-OYD';
const supabase = createClient(supabaseUrl, supabaseKey);

const subjectsList = ['HINDI', 'ENGLISH', 'MATHEMATICS', 'SCIENCE', 'SOCIAL SCIENCE', 'ART AND DRAWING', 'COMPUTER', 'G.K.'];
const remarksList = ["Excellent performance, keep it up!", "Good effort, can do better in Science.", "Needs to focus more on studies.", "Outstanding participation in class."];

type MarksState = Record<string, { t1: string; t2: string; t3: string }>;
type CoScholasticState = { sports: string; art: string; music: string; discipline: string };

export default function MarksheetApp() {
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClass, setActiveClass] = useState<string>('7'); // Class Folder state
  
  // App States
  const [dbStudents, setDbStudents] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [lastSaved, setLastSaved] = useState('');

  // Form States
  const [student, setStudent] = useState({
    name: "", roll: "", mother: "", father: "", dob: "", admission: "", gender: "MALE", address: ""
  });
  
  const [extraDetails, setExtraDetails] = useState({
    attendance: "", remark: "", issueDate: new Date().toISOString().split('T')[0]
  });

  const [coScholastic, setCoScholastic] = useState<CoScholasticState>({
    sports: "A", art: "A", music: "A", discipline: "A"
  });

  const [studentPhoto, setStudentPhoto] = useState<string | null>(null);

  const [marks, setMarks] = useState<MarksState>(() => {
    const initial: MarksState = {};
    subjectsList.forEach(sub => { initial[sub] = { t1: '', t2: '', t3: '' }; });
    return initial;
  });

  // Unique Addresses for Auto-suggest
  const uniqueAddresses = Array.from(new Set(dbStudents.map(s => s.student_data?.address).filter(Boolean)));

  // 📡 FETCH FROM CLOUD
  const fetchStudentsFromCloud = async () => {
    setIsLoadingList(true);
    const { data, error } = await supabase.from('marks_records').select('*').order('created_at', { ascending: false });
    if (data) setDbStudents(data);
    setIsLoadingList(false);
  };

  useEffect(() => { if (view === 'dashboard') fetchStudentsFromCloud(); }, [view]);

  // 📸 PHOTO UPLOAD HANDLER (Local Preview)
  const handlePhotoUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setStudentPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 💾 SAVE & NEXT LOGIC
  const saveToCloud = async (addNext: boolean = false) => {
    if (!student.name || !student.roll) { alert("Student Name and Roll No required!"); return; }
    setIsSaving(true);
    
    // Auto-calculate rank helper
    let myTotal = calculateGrandTotal(marks);
    
    const { data, error } = await supabase.from('marks_records').insert([
      { 
        student_name: student.name, 
        roll_no: student.roll,
        class_name: activeClass,
        student_data: { ...student, photo: studentPhoto }, 
        marks_data: marks,
        extra_data: { ...extraDetails, coScholastic, total: myTotal }
      }
    ]);

    setIsSaving(false);
    if (error) { alert("Save failed! " + error.message); } 
    else {
      setLastSaved(`Saved: ${student.name} (Roll: ${student.roll})`);
      if (addNext) {
        // Increment Roll No intelligently
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
    subjectsList.forEach(sub => { initial[sub] = { t1: '', t2: '', t3: '' }; });
    setMarks(initial);
    setExtraDetails({ attendance: "", remark: "", issueDate: new Date().toISOString().split('T')[0] });
    setCoScholastic({ sports: "A", art: "A", music: "A", discipline: "A" });
    setStudentPhoto(null);
  };

  // --- CALCULATIONS ---
  const calculateGrandTotal = (m: MarksState) => {
    let total = 0;
    subjectsList.forEach(sub => { total += (Number(m[sub]?.t1)||0) + (Number(m[sub]?.t2)||0) + (Number(m[sub]?.t3)||0); });
    return total;
  };

  const getGrade = (marksObtained: number | string, maxMarks: number) => {
    if (marksObtained === '') return '';
    let perc = (Number(marksObtained) / maxMarks) * 100;
    if (perc >= 91) return 'A1'; if (perc >= 81) return 'A2';
    if (perc >= 71) return 'B1'; if (perc >= 61) return 'B2';
    if (perc >= 51) return 'C1'; if (perc >= 41) return 'C2';
    if (perc >= 33) return 'D';  return 'E';
  };

  let grandTotal = calculateGrandTotal(marks);
  let percentage = grandTotal > 0 ? ((grandTotal / 1600) * 100).toFixed(1) : "0";
  let finalGrade = grandTotal > 0 ? getGrade(grandTotal, 1600) : "";

  // 🏆 DYNAMIC RANK CALCULATION
  const getDynamicRank = () => {
    if (grandTotal === 0) return "";
    // Get all students of this class from DB
    const classStudents = dbStudents.filter(s => s.class_name === activeClass);
    let allTotals = classStudents.map(s => s.extra_data?.total || 0);
    allTotals.push(grandTotal); // Include current student
    allTotals.sort((a, b) => b - a); // Sort descending
    // Find rank (1-based index)
    const rank = allTotals.indexOf(grandTotal) + 1;
    return rank > 0 ? `${rank}` : "";
  };


  // ==========================================
  // VIEW 1: DASHBOARD
  // ==========================================
  if (view === 'dashboard') {
    const classFilteredStudents = dbStudents.filter(s => s.class_name === activeClass);
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
        <div className="w-full max-w-5xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-schoolRed">EduPrime SMS</h1>
              <p className="text-gray-500 font-medium">Marksheet ERP System</p>
            </div>
          </div>

          {/* Class Folders */}
          <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
            {['5', '6', '7', '8', '9', '10'].map(cls => (
              <button 
                key={cls} onClick={() => setActiveClass(cls)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm whitespace-nowrap ${activeClass === cls ? 'bg-schoolBlue text-white scale-105' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
              >
                <Folder size={18} className={activeClass === cls ? "text-yellow-300" : "text-gray-400"}/> Class {cls}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <input type="text" placeholder={`Search in Class ${activeClass}...`} className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button onClick={() => { resetMarks(); setStep(1); setView('editor'); }} className="bg-schoolBlue text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">
              <Plus size={20} /> Add to Class {activeClass}
            </button>
          </div>

          {/* Student List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex justify-between"><h3 className="font-bold">Database: Class {activeClass}</h3></div>
            <div className="divide-y divide-gray-100 min-h-[200px]">
              {isLoadingList ? <div className="p-10 text-center text-gray-400">Loading...</div> : 
                classFilteredStudents.length === 0 ? <div className="p-10 text-center text-gray-400">Folder is empty.</div> :
                classFilteredStudents.filter(s => s.student_name.includes(searchQuery.toUpperCase())).map((s) => (
                  <div key={s.id} className="p-4 flex items-center justify-between hover:bg-blue-50 cursor-pointer" onClick={() => {
                    setStudent(s.student_data); setMarks(s.marks_data); setExtraDetails(s.extra_data || extraDetails); setCoScholastic(s.extra_data?.coScholastic || coScholastic); setStudentPhoto(s.student_data.photo || null); setView('editor');
                  }}>
                    <div className="flex items-center gap-4">
                      {s.student_data?.photo ? <img src={s.student_data.photo} className="w-10 h-10 rounded-full object-cover" /> : <div className="h-10 w-10 bg-[#e0f7fa] rounded-full flex items-center justify-center text-schoolBlue font-bold">{s.student_name.charAt(0)}</div>}
                      <div><h4 className="font-bold">{s.student_name}</h4><p className="text-xs text-gray-500">Roll: {s.roll_no}</p></div>
                    </div>
                    <ChevronRight className="text-gray-400" />
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: SMART WIZARD
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans print:bg-white overflow-x-hidden">
      <style dangerouslySetInnerHTML={{__html: `@media print { @page { size: A4 portrait; margin: 0; } html, body { width: 210mm !important; height: 297mm !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; -webkit-print-color-adjust: exact !important; background: white !important; } .no-print { display: none !important; } }`}} />

      <div className="bg-white shadow-sm border-b px-6 py-3 flex justify-between items-center no-print">
        <button onClick={() => setView('dashboard')} className="font-bold flex items-center gap-2"><Home size={20}/> Back</button>
        <span className="font-bold text-schoolBlue">Editing: Class {activeClass}</span>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row w-full no-print">
        <div className="w-full lg:w-[45%] bg-white p-6 border-r overflow-y-auto no-print h-[calc(100vh-60px)]">
          
          {/* Last Saved Toast */}
          {lastSaved && <div className="mb-4 bg-green-100 text-green-800 p-2 rounded-lg text-sm font-bold text-center animate-pulse">{lastSaved}</div>}

          {/* Stepper */}
          <div className="flex justify-between items-center mb-6 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-0 h-1 bg-schoolBlue -z-10 -translate-y-1/2" style={{ width: `${((step - 1) / 4) * 100}%` }}></div>
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} onClick={() => setStep(s)} className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer ${step === s ? 'bg-schoolBlue text-white ring-2 ring-offset-2 ring-schoolBlue' : step > s ? 'bg-schoolBlue text-white' : 'bg-white text-gray-400 border'}`}>{s}</div>
            ))}
          </div>

          {/* WIZARD CONTENT */}
          <div className="space-y-4">
            {step === 1 && (
              <>
                <h2 className="text-xl font-bold mb-4">1. Details & Photo</h2>
                <div className="flex items-center gap-4 mb-4">
                  <label className="cursor-pointer">
                    <div className="w-20 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-schoolBlue bg-gray-50 overflow-hidden relative">
                      {studentPhoto ? <img src={studentPhoto} className="w-full h-full object-cover" /> : <><ImageIcon size={24} className="text-gray-400 mb-1"/><span className="text-[10px] font-bold text-gray-500">Upload</span></>}
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </div>
                  </label>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-bold">Name</label><input type="text" name="name" value={student.name} onChange={(e)=>setStudent({...student, name: e.target.value.toUpperCase()})} className="w-full border p-2 rounded" /></div>
                    <div><label className="text-xs font-bold">Roll No (Editable)</label><input type="text" name="roll" value={student.roll} onChange={(e)=>setStudent({...student, roll: e.target.value})} className="w-full border p-2 rounded" /></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-bold">Gender</label><select name="gender" value={student.gender} onChange={(e)=>setStudent({...student, gender: e.target.value})} className="w-full border p-2 rounded"><option>MALE</option><option>FEMALE</option></select></div>
                  <div><label className="text-xs font-bold">DOB (Smart Calendar)</label><input type="date" name="dob" value={student.dob} max="2020-12-31" min="2000-01-01" onChange={(e)=>setStudent({...student, dob: e.target.value})} className="w-full border p-2 rounded uppercase" /></div>
                  <div><label className="text-xs font-bold">Father</label><input type="text" name="father" value={student.father} onChange={(e)=>setStudent({...student, father: e.target.value.toUpperCase()})} className="w-full border p-2 rounded" /></div>
                  <div><label className="text-xs font-bold">Mother</label><input type="text" name="mother" value={student.mother} onChange={(e)=>setStudent({...student, mother: e.target.value.toUpperCase()})} className="w-full border p-2 rounded" /></div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold">Address (Auto-Suggest)</label>
                    <input list="addresses" type="text" name="address" value={student.address} onChange={(e)=>setStudent({...student, address: e.target.value.toUpperCase()})} className="w-full border p-2 rounded" />
                    <datalist id="addresses">{uniqueAddresses.map((a:any, i) => <option key={i} value={a}/>)}</datalist>
                  </div>
                </div>
              </>
            )}

            {[2, 3, 4].includes(step) && (
              <>
                <h2 className="text-xl font-bold mb-4">Term {step-1} Marks</h2>
                {subjectsList.map(sub => (
                  <div key={sub} className="flex justify-between items-center bg-gray-50 p-2 rounded border mb-2">
                    <span className="font-bold text-xs">{sub}</span>
                    <input type="number" value={marks[sub][step===2?'t1':step===3?'t2':'t3']} onChange={(e) => handleMarkChange(sub, step===2?'t1':step===3?'t2':'t3', e.target.value)} className="w-16 border p-1 rounded text-center font-bold" />
                  </div>
                ))}
              </>
            )}

            {step === 5 && (
              <>
                <h2 className="text-xl font-bold mb-4">Final Touches</h2>
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
                  <div><label className="text-xs font-bold">Attendance (e.g. 210/220)</label><input type="text" value={extraDetails.attendance} onChange={(e)=>setExtraDetails({...extraDetails, attendance: e.target.value})} className="w-full border p-2 rounded" /></div>
                  <div><label className="text-xs font-bold">Issue Date</label><input type="date" value={extraDetails.issueDate} onChange={(e)=>setExtraDetails({...extraDetails, issueDate: e.target.value})} className="w-full border p-2 rounded" /></div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold">Remarks Dropdown</label>
                    <input list="remarks-list" type="text" value={extraDetails.remark} onChange={(e)=>setExtraDetails({...extraDetails, remark: e.target.value})} className="w-full border p-2 rounded" placeholder="Type or select..." />
                    <datalist id="remarks-list">{remarksList.map((r,i)=><option key={i} value={r}/>)}</datalist>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <button onClick={() => saveToCloud(true)} disabled={isSaving} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-green-700">
                    {isSaving ? <Loader2 className="animate-spin"/> : <Save/>} Save & Add Next Student
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={()=>saveToCloud(false)} className="bg-schoolBlue text-white p-3 rounded-lg font-bold">Save & Close</button>
                    <button onClick={() => { document.title = student.name; window.print(); }} className="bg-gray-800 text-white p-3 rounded-lg font-bold flex justify-center gap-2"><Printer size={18}/> Print</button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-8 flex justify-between">
            <button onClick={() => setStep(s => Math.max(1, s - 1))} className="px-4 py-2 border rounded font-bold">Back</button>
            {step < 5 && <button onClick={() => setStep(s => Math.min(5, s + 1))} className="px-6 py-2 bg-schoolBlue text-white rounded font-bold">Next</button>}
          </div>
        </div>

        {/* LIVE PREVIEW PANE */}
        <div className="w-full lg:w-[55%] bg-gray-800 lg:p-4 flex justify-center overflow-auto no-print">
          <div className="lg:origin-top lg:scale-[0.70] xl:scale-[0.80] transition-transform">
            <MarksheetTemplate student={student} marks={marks} subjectsList={subjectsList} grandTotal={grandTotal} percentage={percentage} finalGrade={finalGrade} extra={extraDetails} coScholastic={coScholastic} photo={studentPhoto} rank={getDynamicRank()} activeClass={activeClass} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// MARKSHEET TEMPLATE (Smart Colors & Data)
// ==========================================
function MarksheetTemplate({ student, marks, subjectsList, grandTotal, percentage, finalGrade, extra, coScholastic, photo, rank, activeClass }: any) {
  const getGrade = (m: number | string, max: number) => {
    if (m === '') return '';
    let p = (Number(m) / max) * 100;
    if (p >= 91) return 'A1'; if (p >= 81) return 'A2'; if (p >= 71) return 'B1'; if (p >= 61) return 'B2';
    if (p >= 51) return 'C1'; if (p >= 41) return 'C2'; if (p >= 33) return 'D'; return 'E';
  };

  // Helper formatting for Date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  return (
    <div id="marksheet-template" className="w-[210mm] h-[297mm] bg-white relative overflow-hidden text-black text-sm box-border mx-auto p-2" style={{ pageBreakInside: 'avoid', pageBreakAfter: 'avoid' }}>
      <div className="absolute inset-0 flex justify-center items-center z-0 opacity-[0.08] pointer-events-none"><img src="/logo.png" className="w-[450px] h-[450px]" /></div>
      <div className="relative z-10 h-full w-full border-[6px] border-schoolRed p-[3px] flex flex-col box-border bg-white">
        <div className="border-[2px] border-schoolRed h-full w-full p-4 flex flex-col box-border">
          
          <div className="flex justify-between items-start mb-3">
            <div className="w-28 h-28 p-1"><img src="/logo.png" className="w-full h-full object-contain" /></div>
            <div className="text-center flex-1 px-2">
              <h1 className="text-[2.2rem] leading-none font-extrabold text-schoolRed uppercase tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>SBS Shiksha Niketan</h1>
              <p className="font-semibold mt-1 text-[13px] text-gray-800">Karaspur Prithvipur, Ghazipur, Uttar Pradesh – 233226</p>
              <div className="mt-3 mb-2 flex justify-center"><span className="bg-schoolRed text-white px-5 py-1.5 rounded-full ring-2 ring-offset-2 ring-schoolRed font-bold uppercase text-[11px]">PROGRESS EVALUATION REPORT</span></div>
              <p className="text-schoolBlue font-extrabold mt-3 text-sm tracking-wide">ACADEMIC SESSION : 2025-26</p>
              <p className="font-extrabold text-[15px] mt-1 mb-2">CLASS : {activeClass}</p>
            </div>
            <div className="w-24 h-28 border-[2px] border-gray-400 flex items-center justify-center bg-gray-50 overflow-hidden">
              {photo ? <img src={photo} className="w-full h-full object-cover"/> : <span className="text-gray-400 text-xs text-center font-bold px-2">Upload Photo</span>}
            </div>
          </div>

          <div className="bg-[#e0f7fa] border border-schoolRed p-2 grid grid-cols-2 gap-x-8 gap-y-1 font-semibold text-[13px] mb-3 uppercase">
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
            <table className="w-full text-center border-collapse text-[11px] font-bold border-[2px] border-schoolRed">
              <thead>
                <tr className="bg-[#fae6d1] text-schoolRed border-b-[2px] border-schoolRed">
                  <th rowSpan={2} className="border-r-[2px] border-schoolRed p-1 text-left uppercase">Subjects</th>
                  <th colSpan={2} className="border-r-[2px] border-schoolRed p-1 uppercase">Term 1 (40)</th>
                  <th colSpan={2} className="border-r-[2px] border-schoolRed p-1 uppercase">Term 2 (60)</th>
                  <th colSpan={2} className="border-r-[2px] border-schoolRed p-1 uppercase">Term 3 (100)</th>
                  <th colSpan={2} className="border-r-[2px] border-schoolRed p-1 uppercase">Grand Total</th>
                  <th rowSpan={2} className="p-1 uppercase">Grade</th>
                </tr>
                <tr className="bg-[#fae6d1] text-schoolBlue border-b-[2px] border-schoolRed text-[10px]">
                  <th className="border-r-[2px] border-schoolRed border-t-[2px] border-schoolRed p-1">MM</th><th className="border-r-[2px] border-schoolRed border-t-[2px] border-schoolRed p-1">OBT</th>
                  <th className="border-r-[2px] border-schoolRed border-t-[2px] border-schoolRed p-1">MM</th><th className="border-r-[2px] border-schoolRed border-t-[2px] border-schoolRed p-1">OBT</th>
                  <th className="border-r-[2px] border-schoolRed border-t-[2px] border-schoolRed p-1">MM</th><th className="border-r-[2px] border-schoolRed border-t-[2px] border-schoolRed p-1">OBT</th>
                  <th className="border-r-[2px] border-schoolRed border-t-[2px] border-schoolRed p-1">MM</th><th className="border-r-[2px] border-schoolRed border-t-[2px] border-schoolRed p-1">TOT</th>
                </tr>
              </thead>
              <tbody className="text-schoolBlue">
                {subjectsList.map((sub: string, i: number) => {
                  let subData = marks[sub]; let tot = (Number(subData.t1)||0) + (Number(subData.t2)||0) + (Number(subData.t3)||0);
                  return (
                    <tr key={i} className="border-b-[2px] border-schoolRed">
                      <td className="border-r-[2px] border-schoolRed p-1.5 text-left text-black">{sub}</td>
                      <td className="border-r-[2px] border-schoolRed p-1.5">40</td><td className="border-r-[2px] border-schoolRed p-1.5">{subData.t1}</td>
                      <td className="border-r-[2px] border-schoolRed p-1.5">60</td><td className="border-r-[2px] border-schoolRed p-1.5">{subData.t2}</td>
                      <td className="border-r-[2px] border-schoolRed p-1.5">100</td><td className="border-r-[2px] border-schoolRed p-1.5">{subData.t3}</td>
                      <td className="border-r-[2px] border-schoolRed p-1.5">200</td><td className="border-r-[2px] border-schoolRed p-1.5 text-black">{tot > 0 ? tot : ''}</td>
                      <td className="p-1.5 text-schoolRed">{tot > 0 ? getGrade(tot, 200) : ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="w-full flex flex-col mt-auto mb-5">
            <table className="w-full text-[10px] border-[2px] border-black text-center mb-1 font-bold">
              <tbody>
                <tr className="border-b-[2px] border-black bg-[#fae6d1]">
                  <td colSpan={2} className="text-left p-1 border-r-[2px] border-black text-black">Co-Scholastic Area</td>
                  <td colSpan={6} className="text-right p-1 text-[9px] font-normal text-schoolBlue">A+: Outstanding A: Excellent B+: Very Good B: Good C: Average</td>
                </tr>
                <tr>
                  <td className="p-1 border-r border-black text-left w-24">Sports & Games</td><td className="p-1 border-r-[2px] border-black w-10 text-schoolRed text-xs">{coScholastic.sports}</td>
                  <td className="p-1 border-r border-black text-left w-24">Art & Craft</td><td className="p-1 border-r-[2px] border-black w-10 text-schoolRed text-xs">{coScholastic.art}</td>
                  <td className="p-1 border-r border-black text-left w-24">Music & Dance</td><td className="p-1 border-r-[2px] border-black w-10 text-schoolRed text-xs">{coScholastic.music}</td>
                  <td className="p-1 border-r border-black text-left w-24">Discipline</td><td className="p-1 border-black w-10 text-schoolRed text-xs">{coScholastic.discipline}</td>
                </tr>
              </tbody>
            </table>
            
            {/* DYNAMIC COLOR GRADE SCALE */}
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
            
            <div className="flex justify-between text-[11px] font-bold mt-5 text-schoolBlue">
              <div>Remark : <span className="border-b border-black inline-block min-w-[200px] text-schoolRed uppercase px-2">{extra.remark}</span></div>
              <div>Attendance : <span className="border-b border-black inline-block min-w-[60px] text-center text-schoolRed px-2">{extra.attendance}</span></div>
              <div>Class Rank : <span className="border-b border-black inline-block min-w-[60px] text-center text-schoolRed px-2 text-sm">{rank}</span></div>
            </div>
          </div>

          <div className="flex justify-between items-end px-8 pt-1 pb-1 font-semibold text-sm">
            <div className="border-t border-black w-32 text-center pt-1">{formatDate(extra.issueDate)}</div>
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