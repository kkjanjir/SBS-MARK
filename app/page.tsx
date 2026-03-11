'use client'
import { useState, useEffect } from 'react';
import { Search, Plus, FileText, ChevronRight, ChevronLeft, Printer, Download, Home, Edit, CheckCircle, CloudUpload, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// 🚀 SUPABASE CONNECTION SETUP (Aapki chabiyan yahan hain)
const supabaseUrl = 'https://jrvsjjzmkpkwmhbcohyq.supabase.co/';
const supabaseKey = 'sb_publishable_7jwgTYdDmbbCUJK52IHNMw_JoZF-OYD';
const supabase = createClient(supabaseUrl, supabaseKey);

const subjectsList = ['HINDI', 'ENGLISH', 'MATHEMATICS', 'SCIENCE', 'SOCIAL SCIENCE', 'ART AND DRAWING', 'COMPUTER', 'G.K.'];
type MarksState = Record<string, { t1: string; t2: string; t3: string }>;

export default function MarksheetApp() {
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Database States
  const [dbStudents, setDbStudents] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);

  const [student, setStudent] = useState({
    name: "", roll: "", mother: "", father: "", dob: "", admission: "",
  });

  const [marks, setMarks] = useState<MarksState>(() => {
    const initial: MarksState = {};
    subjectsList.forEach(sub => { initial[sub] = { t1: '', t2: '', t3: '' }; });
    return initial;
  });

  // 📡 FETCH STUDENTS FROM CLOUD
  const fetchStudentsFromCloud = async () => {
    setIsLoadingList(true);
    const { data, error } = await supabase
      .from('marks_records')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setDbStudents(data);
    setIsLoadingList(false);
  };

  useEffect(() => {
    if (view === 'dashboard') {
      fetchStudentsFromCloud();
    }
  }, [view]);

  // 💾 SAVE STUDENT TO CLOUD
  const saveToCloud = async () => {
    if (!student.name || !student.roll) {
      alert("Please enter at least Student Name and Roll No before saving!");
      return;
    }
    setIsSaving(true);
    const { data, error } = await supabase
      .from('marks_records')
      .insert([
        { 
          student_name: student.name, 
          roll_no: student.roll, 
          student_data: student, 
          marks_data: marks 
        }
      ]);

    setIsSaving(false);
    if (error) {
      alert("Save failed! Error: " + error.message);
    } else {
      alert("🎉 Student saved successfully to Cloud!");
      setView('dashboard');
      resetForm();
    }
  };

  // ✏️ EDIT SAVED STUDENT
  const editStudent = (record: any) => {
    setStudent(record.student_data);
    setMarks(record.marks_data);
    setStep(1);
    setView('editor');
  };

  const handleDetailChange = (e: any) => {
    setStudent({ ...student, [e.target.name]: e.target.value.toUpperCase() });
  };

  const handleMarkChange = (sub: string, term: 't1' | 't2' | 't3', value: string) => {
    let max = term === 't1' ? 40 : term === 't2' ? 60 : 100;
    if (value !== '') {
      let numVal = Number(value);
      if (numVal < 0 || numVal > max) return; 
    }
    setMarks(prev => ({ ...prev, [sub]: { ...prev[sub], [term]: value } }));
  };

  const resetForm = () => {
    setStudent({ name: "", roll: "", mother: "", father: "", dob: "", admission: "" });
    const initial: MarksState = {};
    subjectsList.forEach(sub => { initial[sub] = { t1: '', t2: '', t3: '' }; });
    setMarks(initial);
    setStep(1);
    setView('editor');
  };

  const getGrade = (marksObtained: number | string, maxMarks: number) => {
    if (marksObtained === '') return '';
    let perc = (Number(marksObtained) / maxMarks) * 100;
    if (perc >= 91) return 'A1'; if (perc >= 81) return 'A2';
    if (perc >= 71) return 'B1'; if (perc >= 61) return 'B2';
    if (perc >= 51) return 'C1'; if (perc >= 41) return 'C2';
    if (perc >= 33) return 'D';  return 'E';
  };

  const triggerPrint = () => {
    document.title = `${student.name || 'Student'}_Marksheet`; 
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    window.scrollTo(0, 0); 
    const element = document.getElementById('marksheet-template');
    if (element) {
      try {
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');
        const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4'); 
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${student.name || 'Student'}_Marksheet.pdf`); 
      } catch (error) {
        alert("PDF Error!");
      }
    }
    setIsDownloading(false);
  };

  let gTotalT1 = 0, gTotalT2 = 0, gTotalT3 = 0, grandTotal = 0;
  subjectsList.forEach(sub => {
    gTotalT1 += Number(marks[sub]?.t1) || 0;
    gTotalT2 += Number(marks[sub]?.t2) || 0;
    gTotalT3 += Number(marks[sub]?.t3) || 0;
  });
  grandTotal = gTotalT1 + gTotalT2 + gTotalT3;
  let percentage = grandTotal > 0 ? ((grandTotal / 1600) * 100).toFixed(1) : "0";
  let finalGrade = grandTotal > 0 ? getGrade(grandTotal, 1600) : "";

  // ==========================================
  // VIEW 1: DASHBOARD (Cloud Connected)
  // ==========================================
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
        <div className="w-full max-w-4xl">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-extrabold text-schoolRed">EduPrime SMS</h1>
              <p className="text-gray-500 font-medium">Marksheet Generator Pro <span className="text-green-600 text-xs font-bold ml-2 px-2 py-1 bg-green-100 rounded-full">Cloud Active ☁️</span></p>
            </div>
            <div className="h-12 w-12 bg-schoolBlue text-white rounded-full flex items-center justify-center text-xl font-bold shadow-md">
              A
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search students by name or roll no..." 
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-schoolBlue outline-none shadow-sm transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={resetForm}
              className="bg-schoolBlue text-white px-6 py-3 rounded-xl shadow-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-800 transition-all active:scale-95"
            >
              <Plus size={20} /> New Marksheet
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2"><FileText size={18}/> Cloud Database</h3>
              <button onClick={fetchStudentsFromCloud} className="text-sm text-schoolBlue font-semibold hover:underline">Refresh</button>
            </div>
            
            <div className="divide-y divide-gray-100 min-h-[200px]">
              {isLoadingList ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 className="animate-spin mb-2" size={32} />
                  <p>Loading records from cloud...</p>
                </div>
              ) : (
                <>
                  {dbStudents.filter(s => s.student_name.includes(searchQuery.toUpperCase()) || s.roll_no.includes(searchQuery)).map((studentData) => (
                    <div key={studentData.id} className="p-6 flex items-center justify-between hover:bg-blue-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-[#e0f7fa] rounded-full flex items-center justify-center text-schoolBlue font-bold">
                          {studentData.student_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">{studentData.student_name}</h4>
                          <p className="text-xs font-medium text-gray-500">Roll: {studentData.roll_no} • Saved on: {new Date(studentData.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button onClick={() => editStudent(studentData)} className="text-schoolBlue hover:text-schoolRed bg-white border shadow-sm p-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all">
                        <Edit size={16}/> Open
                      </button>
                    </div>
                  ))}
                  {dbStudents.length === 0 && (
                    <div className="py-12 text-center text-gray-500 flex flex-col items-center">
                      <CloudUpload size={48} className="text-gray-300 mb-3" />
                      <p className="font-bold text-lg">No records found!</p>
                      <p className="text-sm">Create a new marksheet and save it to see it here.</p>
                    </div>
                  )}
                </>
              )}
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
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { width: 210mm !important; height: 297mm !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
          .no-print { display: none !important; }
          #marksheet-template { transform: scale(1) !important; margin: 0 !important; transform-origin: top left !important; }
        }
      `}} />

      <div className="bg-white shadow-sm border-b px-6 py-3 flex justify-between items-center no-print sticky top-0 z-50">
        <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-schoolBlue font-bold transition-colors">
          <Home size={20} /> Back to Dashboard
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row w-full no-print">
        
        <div className="w-full lg:w-[45%] bg-white p-6 lg:p-10 border-r border-gray-200 overflow-y-auto no-print shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
          
          <div className="flex justify-between items-center mb-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 -translate-y-1/2 rounded-full"></div>
            <div className="absolute top-1/2 left-0 h-1 bg-schoolBlue -z-10 -translate-y-1/2 rounded-full transition-all duration-300" style={{ width: `${((step - 1) / 4) * 100}%` }}></div>
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} onClick={() => setStep(s)} className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm cursor-pointer transition-all ${step === s ? 'bg-schoolBlue text-white ring-4 ring-blue-100' : step > s ? 'bg-schoolBlue text-white' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
                {s === 5 ? <Printer size={18}/> : s}
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-extrabold text-gray-800 mb-6">
            {step === 1 && "🎓 Student Details"}
            {step === 2 && "📝 Term 1 Marks (Out of 40)"}
            {step === 3 && "📝 Term 2 Marks (Out of 60)"}
            {step === 4 && "📝 Term 3 Marks (Out of 100)"}
            {step === 5 && "🎉 Final Review & Save"}
          </h2>

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['name', 'roll', 'admission', 'father', 'mother', 'dob'].map((field) => (
                  <div key={field}>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{field}</label>
                    <input type="text" name={field} value={student[field as keyof typeof student]} onChange={handleDetailChange} placeholder={`Enter ${field}`} className="w-full border-2 border-gray-200 bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none focus:border-schoolBlue focus:bg-white transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {[2, 3, 4].includes(step) && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
              {subjectsList.map((sub) => {
                const term = step === 2 ? 't1' : step === 3 ? 't2' : 't3';
                const max = step === 2 ? 40 : step === 3 ? 60 : 100;
                return (
                  <div key={sub} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-schoolBlue/30 transition-all">
                    <span className="font-bold text-gray-700 text-sm">{sub}</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={marks[sub][term]} 
                        onChange={(e) => handleMarkChange(sub, term, e.target.value)} 
                        placeholder="0"
                        className="w-20 border-2 border-gray-200 p-2 rounded-lg text-center font-bold outline-none focus:border-schoolBlue focus:bg-blue-50 transition-all" 
                      />
                      <span className="text-xs font-bold text-gray-400">/ {max}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl text-center">
                <CloudUpload className="mx-auto text-schoolBlue mb-3" size={48} />
                <h3 className="text-xl font-bold text-schoolBlue mb-1">Marksheet Ready!</h3>
                <p className="text-sm font-medium text-gray-600 mb-6">Save this record to the cloud database before printing.</p>
                
                <div className="flex flex-col gap-3">
                  <button onClick={saveToCloud} disabled={isSaving} className={`w-full text-white px-6 py-4 rounded-xl shadow-lg font-bold transition-all flex items-center justify-center gap-2 text-lg ${isSaving ? 'bg-blue-400' : 'bg-schoolBlue hover:bg-blue-800 hover:scale-[1.02]'}`}>
                    {isSaving ? <><Loader2 className="animate-spin" size={20}/> Saving to Cloud...</> : <><CloudUpload size={20} /> Save to Database</>}
                  </button>
                  <button onClick={triggerPrint} className="w-full bg-gray-800 text-white px-6 py-4 rounded-xl shadow-lg font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-lg">
                    <Printer size={20} /> Print Directly
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-between pt-6 border-t border-gray-100">
            <button 
              onClick={() => setStep(s => Math.max(1, s - 1))} 
              disabled={step === 1}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${step === 1 ? 'text-gray-300 bg-gray-50' : 'text-gray-600 bg-white border-2 border-gray-200 hover:bg-gray-50 active:scale-95'}`}
            >
              <ChevronLeft size={20}/> Back
            </button>
            <button 
              onClick={() => setStep(s => Math.min(5, s + 1))} 
              disabled={step === 5}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 ${step === 5 ? 'text-white bg-gray-300 shadow-none' : 'text-white bg-schoolBlue hover:bg-blue-800'}`}
            >
              Next <ChevronRight size={20}/>
            </button>
          </div>

        </div>

        <div className="w-full lg:w-[55%] bg-gray-800 lg:p-8 flex items-start justify-center overflow-auto relative no-print">
          <div className="absolute top-4 right-4 bg-black/50 text-white px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm z-20">
            Live Preview
          </div>
          <div className="lg:origin-top lg:scale-[0.75] xl:scale-[0.85] transition-transform duration-300 flex justify-center w-full">
            <MarksheetTemplate student={student} marks={marks} subjectsList={subjectsList} gTotalT1={gTotalT1} gTotalT2={gTotalT2} gTotalT3={gTotalT3} grandTotal={grandTotal} percentage={percentage} finalGrade={finalGrade} />
          </div>
        </div>
      </div>

      <div className="hidden print:block w-[210mm] h-[296mm] mx-auto overflow-hidden">
        <MarksheetTemplate student={student} marks={marks} subjectsList={subjectsList} gTotalT1={gTotalT1} gTotalT2={gTotalT2} gTotalT3={gTotalT3} grandTotal={grandTotal} percentage={percentage} finalGrade={finalGrade} />
      </div>

    </div>
  )
}

function MarksheetTemplate({ student, marks, subjectsList, gTotalT1, gTotalT2, gTotalT3, grandTotal, percentage, finalGrade }: any) {
  const getGrade = (marksObtained: number | string, maxMarks: number) => {
    if (marksObtained === '') return '';
    let perc = (Number(marksObtained) / maxMarks) * 100;
    if (perc >= 91) return 'A1'; if (perc >= 81) return 'A2';
    if (perc >= 71) return 'B1'; if (perc >= 61) return 'B2';
    if (perc >= 51) return 'C1'; if (perc >= 41) return 'C2';
    if (perc >= 33) return 'D';  return 'E';
  };

  return (
    <div id="marksheet-template" className="w-[210mm] h-[297mm] bg-white relative overflow-hidden text-black text-sm box-border mx-auto p-2" style={{ pageBreakInside: 'avoid', pageBreakAfter: 'avoid' }}>
      
      <div className="absolute inset-0 flex justify-center items-center z-0 opacity-[0.08] pointer-events-none">
        <img src="/logo.png" alt="Watermark" className="w-[450px] h-[450px] object-contain" />
      </div>

      <div className="relative z-10 h-full w-full border-[6px] border-schoolRed p-[3px] flex flex-col box-border bg-white">
        <div className="border-[2px] border-schoolRed h-full w-full p-4 flex flex-col box-border">
          
          <div className="flex justify-between items-start mb-3">
            <div className="w-28 h-28 flex items-center justify-center p-1">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>

            <div className="text-center flex-1 px-2">
              <h1 className="text-[2.2rem] leading-none font-extrabold text-schoolRed uppercase tracking-widest drop-shadow-sm" style={{ fontFamily: 'Georgia, serif' }}>
                SBS Shiksha Niketan
              </h1>
              <p className="font-semibold mt-1 text-[13px] text-gray-800">Karaspur Prithvipur, Ghazipur, Uttar Pradesh – 233226</p>
              
              <div className="mt-3 mb-2 flex justify-center">
                <span className="bg-schoolRed text-white px-5 py-1.5 rounded-full ring-2 ring-offset-2 ring-schoolRed font-bold uppercase tracking-widest text-[11px] shadow-sm">
                  PROGRESS EVALUATION REPORT
                </span>
              </div>

              <p className="text-schoolBlue font-extrabold mt-3 text-sm tracking-wide">ACADEMIC SESSION : 2025-26</p>
              <p className="font-extrabold text-[15px] mt-1 mb-2">CLASS : 7</p>
            </div>

            <div className="w-24 h-28 border-[2px] border-gray-400 flex flex-col items-center justify-center bg-gray-50 text-gray-400 text-xs">
              <span className="text-3xl mb-1">👤</span>
              <p className="font-semibold">Student</p><p className="font-semibold">Photo</p>
            </div>
          </div>

          <div className="bg-[#e0f7fa] border border-schoolRed p-2 grid grid-cols-2 gap-x-8 gap-y-1 font-semibold text-[13px] mb-3 uppercase">
            <div className="flex"><span className="w-36">STUDENT'S NAME</span><span>: {student.name}</span></div>
            <div className="flex"><span className="w-32">ROLL NO.</span><span>: {student.roll}</span></div>
            <div className="flex"><span className="w-36">MOTHER'S NAME</span><span>: {student.mother}</span></div>
            <div className="flex"><span className="w-32">ADMISSION NO.</span><span>: {student.admission}</span></div>
            <div className="flex"><span className="w-36">FATHER'S NAME</span><span>: {student.father}</span></div>
            <div className="flex"><span className="w-32">DATE OF BIRTH</span><span>: {student.dob}</span></div>
            <div className="flex"><span className="w-36">GENDER</span><span>: MALE</span></div>
            <div className="flex col-span-2"><span className="w-36">ADDRESS</span><span>: GHAZIPUR, UP</span></div>
          </div>

          <div className="w-full flex-1 mb-3 flex flex-col">
            <table className="w-full text-center border-collapse text-[11px] font-bold border-[2px] border-schoolRed">
              <thead>
                <tr className="bg-[#fae6d1] text-schoolRed border-b-[2px] border-schoolRed">
                  <th rowSpan={2} className="border-r-[2px] border-schoolRed p-1 text-left uppercase">Subjects</th>
                  <th colSpan={2} className="border-r-[2px] border-schoolRed p-1 uppercase">First Term (40)</th>
                  <th colSpan={2} className="border-r-[2px] border-schoolRed p-1 uppercase">Second Term (60)</th>
                  <th colSpan={2} className="border-r-[2px] border-schoolRed p-1 uppercase">Third Term (100)</th>
                  <th colSpan={2} className="border-r-[2px] border-schoolRed p-1 uppercase">Grand Total</th>
                  <th rowSpan={2} className="p-1 uppercase">Grade</th>
                </tr>
                <tr className="bg-[#fae6d1] text-schoolBlue border-b-[2px] border-schoolRed text-[10px]">
                  <th className="border-r-[2px] border-schoolRed border-t-[2px] border-schoolRed p-1">MM</th>
                  <th className="border-r-[2px] border-schoolRed border-t-[2px] border-schoolRed p-1">MARKS OBT</th>
                  <th className="border-r-[2px] border-schoolRed border-t-[2px] border-schoolRed p-1">MM</th>
                  <th className="border-r-[2px] border-schoolRed border-t-[2px] border-schoolRed p-1">MARKS OBT</th>
                  <th className="border-r-[2px] border-schoolRed border-t-[2px] border-schoolRed p-1">MM</th>
                  <th className="border-r-[2px] border-schoolRed border-t-[2px] border-schoolRed p-1">MARKS OBT</th>
                  <th className="border-r-[2px] border-schoolRed border-t-[2px] border-schoolRed p-1">MM</th>
                  <th className="border-r-[2px] border-schoolRed border-t-[2px] border-schoolRed p-1">TOTAL</th>
                </tr>
              </thead>
              <tbody className="text-schoolBlue">
                {subjectsList.map((sub: string, i: number) => {
                  let subData = marks[sub];
                  let subTotal = (Number(subData.t1)||0) + (Number(subData.t2)||0) + (Number(subData.t3)||0);
                  let subGrade = getGrade(subTotal, 200);
                  return (
                    <tr key={i} className="border-b-[2px] border-schoolRed">
                      <td className="border-r-[2px] border-schoolRed p-1.5 text-left text-black">{sub}</td>
                      <td className="border-r-[2px] border-schoolRed p-1.5">40</td>
                      <td className="border-r-[2px] border-schoolRed p-1.5">{subData.t1}</td>
                      <td className="border-r-[2px] border-schoolRed p-1.5">60</td>
                      <td className="border-r-[2px] border-schoolRed p-1.5">{subData.t2}</td>
                      <td className="border-r-[2px] border-schoolRed p-1.5">100</td>
                      <td className="border-r-[2px] border-schoolRed p-1.5">{subData.t3}</td>
                      <td className="border-r-[2px] border-schoolRed p-1.5">200</td>
                      <td className="border-r-[2px] border-schoolRed p-1.5 text-black">{subTotal > 0 ? subTotal : ''}</td>
                      <td className="p-1.5 text-schoolRed">{subTotal > 0 ? subGrade : ''}</td>
                    </tr>
                  )
                })}
                <tr className="border-b-[2px] border-schoolRed bg-[#e0f7fa]">
                  <td className="border-r-[2px] border-schoolRed p-1.5 text-left text-black">TOTAL</td>
                  <td className="border-r-[2px] border-schoolRed p-1.5">320</td>
                  <td className="border-r-[2px] border-schoolRed p-1.5 text-black">{gTotalT1 > 0 ? gTotalT1 : ''}</td>
                  <td className="border-r-[2px] border-schoolRed p-1.5">480</td>
                  <td className="border-r-[2px] border-schoolRed p-1.5 text-black">{gTotalT2 > 0 ? gTotalT2 : ''}</td>
                  <td className="border-r-[2px] border-schoolRed p-1.5">800</td>
                  <td className="border-r-[2px] border-schoolRed p-1.5 text-black">{gTotalT3 > 0 ? gTotalT3 : ''}</td>
                  <td className="border-r-[2px] border-schoolRed p-1.5">1600</td>
                  <td className="border-r-[2px] border-schoolRed p-1.5 text-black text-sm">{grandTotal > 0 ? grandTotal : ''}</td>
                  <td className="p-1.5"></td>
                </tr>
                <tr className="bg-[#e0f7fa]">
                  <td className="border-r-[2px] border-schoolRed p-1.5 text-left text-black">PERCENTAGE</td>
                  <td colSpan={2} className="border-r-[2px] border-schoolRed p-1.5 text-black">{percentage}%</td>
                  <td colSpan={2} className="border-r-[2px] border-schoolRed p-1.5 text-black">{percentage}%</td>
                  <td colSpan={2} className="border-r-[2px] border-schoolRed p-1.5 text-black">{percentage}%</td>
                  <td colSpan={2} className="border-r-[2px] border-schoolRed p-1.5 text-black text-sm">{percentage}%</td>
                  <td className="p-1.5 text-schoolBlue text-sm">{finalGrade}</td>
                </tr>
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
                  <td className="p-1 border-r border-black text-left w-24">Sports & Games</td><td className="p-1 border-r-[2px] border-black w-10"></td>
                  <td className="p-1 border-r border-black text-left w-24">Art & Craft</td><td className="p-1 border-r-[2px] border-black w-10"></td>
                  <td className="p-1 border-r border-black text-left w-24">Music & Dance</td><td className="p-1 border-r-[2px] border-black w-10"></td>
                  <td className="p-1 border-r border-black text-left w-24">Discipline</td><td className="p-1 border-black w-10"></td>
                </tr>
              </tbody>
            </table>
            <table className="w-full text-[10px] border-[2px] border-black text-center font-bold text-white">
              <tbody>
                <tr>
                  <td className="bg-black p-1 border-r border-white w-20 leading-tight">GRADE<br/>SCALE</td>
                  <td className="bg-gray-400 p-1 border-r border-white text-black leading-tight">91-100<br/>A1</td>
                  <td className="bg-gray-300 p-1 border-r border-white text-black leading-tight">81-90<br/>A2</td>
                  <td className="bg-gray-200 p-1 border-r border-white text-black leading-tight">71-80<br/>B1</td>
                  <td className="bg-gray-100 p-1 border-r border-white text-black leading-tight">61-70<br/>B2</td>
                  <td className="bg-gray-200 p-1 border-r border-white text-black leading-tight">51-60<br/>C1</td>
                  <td className="bg-gray-300 p-1 border-r border-white text-black leading-tight">41-50<br/>C2</td>
                  <td className="bg-gray-400 p-1 border-r border-white text-black leading-tight">33-40<br/>D</td>
                  <td className="bg-schoolRed p-1 leading-tight">00-32<br/>E</td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-between text-[11px] font-bold mt-5 text-schoolBlue">
              <div>Remark : <span className="border-b border-black inline-block w-64"></span></div>
              <div>Attendance : <span className="border-b border-black inline-block w-20"></span></div>
              <div>Class Rank : <span className="border-b border-black inline-block w-20"></span></div>
            </div>
          </div>

          <div className="flex justify-between items-end px-8 pt-1 pb-1 font-semibold text-sm">
            <div className="border-t border-black w-32 text-center pt-1">Date</div>
            <div className="border-t border-black w-32 text-center pt-1">Class Teacher</div>
            <div className="flex flex-col items-center">
              <img src="/principal_sign.png" alt="Signature" className="h-[70px] mb-1 object-contain" />
              <div className="border-t border-black w-32 text-center pt-1">Principal</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}