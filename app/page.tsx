'use client'
import { useState } from 'react';

export default function Marksheet() {
  // APP KI MEMORY (State): Yahan form ka data save hoga
  const [student, setStudent] = useState({
    name: "SANJAY KUMAR",
    roll: "15",
    mother: "SUNITA DEVI",
    father: "RAMESH KUMAR",
    dob: "15-08-2012",
    admission: "2025/104",
  });

  // Jab bhi form me kuch type hoga, ye function memory ko update karega
  const handleChange = (e: any) => {
    setStudent({ ...student, [e.target.name]: e.target.value.toUpperCase() });
  };

  return (
    <div className="flex flex-col items-center bg-gray-200 min-h-screen py-8 print:py-0 print:bg-white">
      
      {/* 🟢 DATA ENTRY FORM (Ye Print me nahi dikhega) */}
      <div className="w-[210mm] bg-white p-6 rounded-xl shadow-lg mb-8 border-t-8 border-schoolBlue print:hidden">
        <h2 className="text-2xl font-bold text-schoolBlue mb-4 border-b-2 pb-2">📝 Student Data Entry</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Student's Name</label>
            <input type="text" name="name" value={student.name} onChange={handleChange} className="w-full border-2 border-gray-300 p-2 rounded focus:border-schoolBlue outline-none font-semibold text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Roll No.</label>
            <input type="text" name="roll" value={student.roll} onChange={handleChange} className="w-full border-2 border-gray-300 p-2 rounded focus:border-schoolBlue outline-none font-semibold text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Admission No.</label>
            <input type="text" name="admission" value={student.admission} onChange={handleChange} className="w-full border-2 border-gray-300 p-2 rounded focus:border-schoolBlue outline-none font-semibold text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Father's Name</label>
            <input type="text" name="father" value={student.father} onChange={handleChange} className="w-full border-2 border-gray-300 p-2 rounded focus:border-schoolBlue outline-none font-semibold text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Mother's Name</label>
            <input type="text" name="mother" value={student.mother} onChange={handleChange} className="w-full border-2 border-gray-300 p-2 rounded focus:border-schoolBlue outline-none font-semibold text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth</label>
            <input type="text" name="dob" value={student.dob} onChange={handleChange} className="w-full border-2 border-gray-300 p-2 rounded focus:border-schoolBlue outline-none font-semibold text-sm" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4 italic">*Aap yahan jo bhi likhenge, wo niche marksheet me apne aap update ho jayega.</p>
      </div>

      {/* 🔴 A4 MARKSHEET CANVAS (Ye Print hoga) */}
      <div className="w-[210mm] min-h-[297mm] bg-white relative print:w-full print:h-full shadow-2xl print:shadow-none overflow-hidden text-black text-sm">
        
        {/* Background Watermark */}
        <div className="absolute inset-0 flex justify-center items-center z-0 opacity-10 pointer-events-none">
          <img src="/logo.png" alt="Watermark" className="w-[400px] h-[400px] object-contain" />
        </div>

        {/* Main Content Wrapper */}
        <div className="relative z-10 h-full border-[6px] border-schoolRed m-2 p-1 flex flex-col">
          <div className="border-[2px] border-schoolRed h-full p-4 flex flex-col">
            
            {/* Header Section */}
            <div className="flex justify-between items-start mb-2">
              <div className="w-24 h-24 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>

              <div className="text-center flex-1 px-2">
                <h1 className="text-3xl font-bold text-schoolRed uppercase tracking-wider">SBS Shiksha Niketan</h1>
                <p className="font-semibold mt-1">Karaspur Prithvipur, Ghazipur, Uttar Pradesh – 233226</p>
                <div className="mt-2 flex justify-center">
                  <span className="border border-schoolRed bg-[#fff9c4] px-4 py-1 font-bold text-schoolRed shadow-sm">
                    PROGRESS EVALUATION REPORT
                  </span>
                </div>
                <p className="text-schoolBlue font-bold mt-2 text-md">ACADEMIC SESSION : 2025-26</p>
                <p className="font-bold text-lg mt-1">CLASS : 7</p>
              </div>

              <div className="w-20 h-24 border border-gray-400 flex flex-col items-center justify-center bg-gray-50 text-gray-400 text-xs">
                <span className="text-2xl mb-1">👤</span>
                <p>Student</p>
                <p>Photo</p>
              </div>
            </div>

            {/* 🔥 DYNAMIC Student Details Section 🔥 */}
            <div className="bg-[#e0f7fa] border border-schoolRed p-3 grid grid-cols-2 gap-x-8 gap-y-1 font-semibold text-[13px] mb-2 uppercase">
              <div className="flex"><span className="w-36">STUDENT&apos;S NAME</span><span>: {student.name}</span></div>
              <div className="flex"><span className="w-32">ROLL NO.</span><span>: {student.roll}</span></div>
              <div className="flex"><span className="w-36">MOTHER&apos;S NAME</span><span>: {student.mother}</span></div>
              <div className="flex"><span className="w-32">ADMISSION NO.</span><span>: {student.admission}</span></div>
              <div className="flex"><span className="w-36">FATHER&apos;S NAME</span><span>: {student.father}</span></div>
              <div className="flex"><span className="w-32">DATE OF BIRTH</span><span>: {student.dob}</span></div>
              <div className="flex"><span className="w-36">GENDER</span><span>: MALE</span></div>
              <div className="flex col-span-2"><span className="w-36">ADDRESS</span><span>: GHAZIPUR, UP</span></div>
            </div>

            {/* MAIN ACADEMIC TABLE (Abhi ke liye static) */}
            <div className="w-full flex-1 mb-2 flex flex-col">
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
                  {['HINDI', 'ENGLISH', 'MATHEMATICS', 'SCIENCE', 'SOCIAL SCIENCE', 'ART AND DRAWING', 'COMPUTER', 'G.K.'].map((sub, i) => (
                    <tr key={i} className="border-b-[2px] border-schoolRed">
                      <td className="border-r-[2px] border-schoolRed p-1 text-left text-black">{sub}</td>
                      <td className="border-r-[2px] border-schoolRed p-1">40</td>
                      <td className="border-r-[2px] border-schoolRed p-1"></td>
                      <td className="border-r-[2px] border-schoolRed p-1">60</td>
                      <td className="border-r-[2px] border-schoolRed p-1"></td>
                      <td className="border-r-[2px] border-schoolRed p-1">100</td>
                      <td className="border-r-[2px] border-schoolRed p-1"></td>
                      <td className="border-r-[2px] border-schoolRed p-1">200</td>
                      <td className="border-r-[2px] border-schoolRed p-1"></td>
                      <td className="p-1 text-schoolRed">E</td>
                    </tr>
                  ))}
                  <tr className="border-b-[2px] border-schoolRed bg-[#e0f7fa]">
                    <td className="border-r-[2px] border-schoolRed p-1 text-left text-black">TOTAL</td>
                    <td className="border-r-[2px] border-schoolRed p-1">320</td>
                    <td className="border-r-[2px] border-schoolRed p-1"></td>
                    <td className="border-r-[2px] border-schoolRed p-1">480</td>
                    <td className="border-r-[2px] border-schoolRed p-1"></td>
                    <td className="border-r-[2px] border-schoolRed p-1">800</td>
                    <td className="border-r-[2px] border-schoolRed p-1"></td>
                    <td className="border-r-[2px] border-schoolRed p-1">1600</td>
                    <td className="border-r-[2px] border-schoolRed p-1 text-black">0</td>
                    <td className="p-1"></td>
                  </tr>
                  <tr className="bg-[#e0f7fa]">
                    <td className="border-r-[2px] border-schoolRed p-1 text-left text-black">PERCENTAGE</td>
                    <td colSpan={2} className="border-r-[2px] border-schoolRed p-1 text-black">0%</td>
                    <td colSpan={2} className="border-r-[2px] border-schoolRed p-1 text-black">0%</td>
                    <td colSpan={2} className="border-r-[2px] border-schoolRed p-1 text-black">0%</td>
                    <td colSpan={2} className="border-r-[2px] border-schoolRed p-1 text-black">0%</td>
                    <td className="p-1 text-schoolBlue">E</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Co-Scholastic Area & Grade Scale */}
            <div className="w-full flex flex-col mb-4 mt-auto">
              <table className="w-full text-[10px] border-[2px] border-black text-center mb-1 font-bold">
                <tbody>
                  <tr className="border-b-[2px] border-black bg-[#fae6d1]">
                    <td colSpan={2} className="text-left p-1 border-r-[2px] border-black text-black">Co-Scholastic Area</td>
                    <td colSpan={6} className="text-right p-1 text-[9px] font-normal text-schoolBlue">A+: Outstanding A: Excellent B+: Very Good B: Good C: Average</td>
                  </tr>
                  <tr>
                    <td className="p-1 border-r border-black text-left w-24">Sports & Games</td>
                    <td className="p-1 border-r-[2px] border-black w-10"></td>
                    <td className="p-1 border-r border-black text-left w-24">Art & Craft</td>
                    <td className="p-1 border-r-[2px] border-black w-10"></td>
                    <td className="p-1 border-r border-black text-left w-24">Music & Dance</td>
                    <td className="p-1 border-r-[2px] border-black w-10"></td>
                    <td className="p-1 border-r border-black text-left w-24">Discipline</td>
                    <td className="p-1 border-black w-10"></td>
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
              <div className="flex justify-between text-xs font-bold mt-3 text-schoolBlue">
                <div>Remark : <span className="border-b border-black inline-block w-64"></span></div>
                <div>Attendance : <span className="border-b border-black inline-block w-20"></span></div>
                <div>Class Rank : <span className="border-b border-black inline-block w-20"></span></div>
              </div>
            </div>

            {/* Signatures Footer */}
            <div className="flex justify-between items-end px-8 pb-4 font-semibold text-sm">
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
      
      {/* Floating Print Button */}
      <button 
        onClick={() => window.print()} 
        className="fixed bottom-8 right-8 bg-schoolBlue text-white px-6 py-3 rounded-full shadow-2xl font-bold print:hidden hover:bg-blue-800 hover:scale-105 transition-all"
      >
        🖨️ Print Marksheet
      </button>

    </div>
  )
}