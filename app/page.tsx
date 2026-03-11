'use client'
import { useState } from 'react';

// Subjects List
const subjectsList = ['HINDI', 'ENGLISH', 'MATHEMATICS', 'SCIENCE', 'SOCIAL SCIENCE', 'ART AND DRAWING', 'COMPUTER', 'G.K.'];

type MarksState = Record<string, { t1: string; t2: string; t3: string }>;

export default function Marksheet() {
  const [student, setStudent] = useState({
    name: "SANJAY KUMAR", roll: "15", mother: "SUNITA DEVI",
    father: "RAMESH KUMAR", dob: "15-08-2012", admission: "2025/104",
  });

  const initialMarks: MarksState = {};
  subjectsList.forEach(sub => {
    initialMarks[sub] = { t1: '', t2: '', t3: '' };
  });
  const [marks, setMarks] = useState<MarksState>(initialMarks);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const getGrade = (marksObtained: number | string, maxMarks: number) => {
    if (marksObtained === '') return '';
    let perc = (Number(marksObtained) / maxMarks) * 100;
    if (perc >= 91) return 'A1'; if (perc >= 81) return 'A2';
    if (perc >= 71) return 'B1'; if (perc >= 61) return 'B2';
    if (perc >= 51) return 'C1'; if (perc >= 41) return 'C2';
    if (perc >= 33) return 'D';  return 'E';
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    window.scrollTo(0, 0); 
    
    const element = document.getElementById('marksheet-template');
    if (element) {
      try {
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');
        
        const canvas = await html2canvas(element, { 
          scale: 2, 
          useCORS: true 
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4'); 
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${student.name}_Marksheet.pdf`); 
      } catch (error) {
        console.error("Error generating PDF", error);
        alert("PDF banane me error aayi. Please try again.");
      }
    }
    setIsDownloading(false);
  };

  let gTotalT1 = 0, gTotalT2 = 0, gTotalT3 = 0, grandTotal = 0;
  subjectsList.forEach(sub => {
    gTotalT1 += Number(marks[sub].t1) || 0;
    gTotalT2 += Number(marks[sub].t2) || 0;
    gTotalT3 += Number(marks[sub].t3) || 0;
  });
  grandTotal = gTotalT1 + gTotalT2 + gTotalT3;
  let percentage = grandTotal > 0 ? ((grandTotal / 1600) * 100).toFixed(1) : "0";
  let finalGrade = grandTotal > 0 ? getGrade(grandTotal, 1600) : "";

  return (
    <div className="flex flex-col items-center bg-gray-200 min-h-screen py-8 print:block print:py-0 print:bg-white">
      
      {/* EXTREME 1-PAGE PRINT CSS FIX FOR iOS/SAFARI */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0mm !important; }
          html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
            width: 210mm; 
            height: 297mm; 
            overflow: hidden !important; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            background-color: white;
          }
          header, footer { display: none !important; }
        }
      `}} />

      {/* 🟢 DATA ENTRY FORM */}
      <div className="w-[210mm] bg-white p-6 rounded-xl shadow-lg mb-8 border-t-8 border-schoolBlue print:hidden mx-auto">
        <h2 className="text-xl font-bold text-schoolBlue mb-3 border-b-2 pb-2">1. Student Details</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['name', 'roll', 'admission', 'father', 'mother', 'dob'].map((field) => (
            <div key={field}>
              <label className="block text-xs font-bold text-gray-700 uppercase">{field}</label>
              <input type="text" name={field} value={student[field as keyof typeof student]} onChange={handleDetailChange} className="w-full border-2 border-gray-300 p-1 rounded font-semibold text-sm" />
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold text-schoolBlue mb-3 border-b-2 pb-2">2. Enter Marks</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center border">
            <thead className="bg-gray-100 text-xs">
              <tr>
                <th className="p-2 border text-left">SUBJECT</th>
                <th className="p-2 border">Term 1 (40)</th>
                <th className="p-2 border">Term 2 (60)</th>
                <th className="p-2 border">Term 3 (100)</th>
              </tr>
            </thead>
            <tbody>
              {subjectsList.map(sub => (
                <tr key={sub}>
                  <td className="p-1 border text-left font-bold text-xs">{sub}</td>
                  <td className="p-1 border"><input type="number" value={marks[sub].t1} onChange={(e) => handleMarkChange(sub, 't1', e.target.value)} className="w-16 border text-center p-1 outline-none focus:bg-blue-50" /></td>
                  <td className="p-1 border"><input type="number" value={marks[sub].t2} onChange={(e) => handleMarkChange(sub, 't2', e.target.value)} className="w-16 border text-center p-1 outline-none focus:bg-blue-50" /></td>
                  <td className="p-1 border"><input type="number" value={marks[sub].t3} onChange={(e) => handleMarkChange(sub, 't3', e.target.value)} className="w-16 border text-center p-1 outline-none focus:bg-blue-50" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔴 A4 MARKSHEET CANVAS - Added outer padding (p-2) to create a safe zone for the border */}
      <div id="marksheet-template" className="w-[210mm] h-[297mm] bg-white relative overflow-hidden text-black text-sm box-border mx-auto p-2" style={{ pageBreakInside: 'avoid', pageBreakAfter: 'avoid' }}>
        
        {/* Background Watermark */}
        <div className="absolute inset-0 flex justify-center items-center z-0 opacity-[0.08] pointer-events-none">
          <img src="/logo.png" alt="Watermark" className="w-[450px] h-[450px] object-contain" />
        </div>

        {/* Main Content Wrapper - Safe inside the padding */}
        <div className="relative z-10 h-full w-full border-[6px] border-schoolRed p-[3px] flex flex-col box-border">
          <div className="border-[2px] border-schoolRed h-full w-full p-4 flex flex-col box-border">
            
            {/* 🛠️ HEADER SECTION: Enhanced Font, Bigger Logo, Beautiful Banner */}
            <div className="flex justify-between items-start mb-3">
              {/* Bigger Logo */}
              <div className="w-28 h-28 flex items-center justify-center p-1">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>

              {/* Enhanced Center Text */}
              <div className="text-center flex-1 px-2">
                <h1 className="text-[2.2rem] leading-none font-extrabold text-schoolRed uppercase tracking-widest drop-shadow-sm" style={{ fontFamily: 'Georgia, serif' }}>
                  SBS Shiksha Niketan
                </h1>
                <p className="font-semibold mt-1 text-[13px] text-gray-800">Karaspur Prithvipur, Ghazipur, Uttar Pradesh – 233226</p>
                
                {/* Premium Pill Banner */}
                <div className="mt-3 mb-2 flex justify-center">
                  <span className="bg-schoolRed text-white px-5 py-1.5 rounded-full ring-2 ring-offset-2 ring-schoolRed font-bold uppercase tracking-widest text-[11px] shadow-sm">
                    PROGRESS EVALUATION REPORT
                  </span>
                </div>

                <p className="text-schoolBlue font-extrabold mt-3 text-sm tracking-wide">ACADEMIC SESSION : 2025-26</p>
                <p className="font-extrabold text-[15px] mt-1 mb-2">CLASS : 7</p>
              </div>

              {/* Adjusted Photo Box */}
              <div className="w-24 h-28 border-[2px] border-gray-400 flex flex-col items-center justify-center bg-gray-50 text-gray-400 text-xs">
                <span className="text-3xl mb-1">👤</span>
                <p className="font-semibold">Student</p><p className="font-semibold">Photo</p>
              </div>
            </div>

            {/* Dynamic Student Details Section */}
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

            {/* AUTO-CALCULATING ACADEMIC TABLE */}
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
                  {subjectsList.map((sub, i) => {
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

            {/* Co-Scholastic Area & Grade Scale */}
            <div className="w-full flex flex-col mt-auto mb-2">
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
              <div className="flex justify-between text-[11px] font-bold mt-2 text-schoolBlue">
                <div>Remark : <span className="border-b border-black inline-block w-64"></span></div>
                <div>Attendance : <span className="border-b border-black inline-block w-20"></span></div>
                <div>Class Rank : <span className="border-b border-black inline-block w-20"></span></div>
              </div>
            </div>

            {/* Signatures Footer */}
            <div className="flex justify-between items-end px-8 pt-2 pb-1 font-semibold text-sm">
              <div className="border-t border-black w-32 text-center pt-1">Date</div>
              <div className="border-t border-black w-32 text-center pt-1">Class Teacher</div>
              <div className="flex flex-col items-center">
                <img src="/principal_sign.png" alt="Signature" className="h-10 mb-1 object-contain" />
                <div className="border-t border-black w-32 text-center pt-1">Principal</div>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* DIRECT PDF DOWNLOAD BUTTON */}
      <button 
        onClick={handleDownloadPDF} 
        disabled={isDownloading}
        className={`fixed bottom-8 right-8 text-white px-6 py-3 rounded-full shadow-2xl font-bold transition-all z-50 flex items-center gap-2 ${isDownloading ? 'bg-gray-500 cursor-wait' : 'bg-green-600 hover:bg-green-800 hover:scale-105'}`}
      >
        {isDownloading ? '⏳ Generating PDF...' : '⬇️ Download PDF'}
      </button>

    </div>
  )
}