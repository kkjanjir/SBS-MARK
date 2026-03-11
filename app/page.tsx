'use client'

export default function Marksheet() {
  return (
    <div className="flex flex-col items-center bg-gray-200 min-h-screen py-8 print:py-0 print:bg-white">
      
      {/* A4 Canvas Container */}
      <div className="w-[210mm] min-h-[297mm] bg-white relative print:w-full print:h-full shadow-2xl print:shadow-none overflow-hidden text-black text-sm">
        
        {/* Background Watermark */}
        <div className="absolute inset-0 flex justify-center items-center z-0 opacity-10 pointer-events-none">
          <img src="/logo.png" alt="Watermark" className="w-[400px] h-[400px] object-contain" />
        </div>

        {/* Main Content Wrapper */}
        <div className="relative z-10 h-full border-[6px] border-schoolRed m-2 p-1">
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

            {/* Student Details Section (Fix Applied Here) */}
            <div className="bg-[#e0f7fa] border border-schoolRed p-3 grid grid-cols-2 gap-x-8 gap-y-1 font-semibold text-[13px] mb-4">
              <div className="flex"><span className="w-36">STUDENT&apos;S NAME</span><span>: SANJAY KUMAR</span></div>
              <div className="flex"><span className="w-32">ROLL NO.</span><span>: 15</span></div>
              <div className="flex"><span className="w-36">MOTHER&apos;S NAME</span><span>: SUNITA DEVI</span></div>
              <div className="flex"><span className="w-32">ADMISSION NO.</span><span>: 2025/104</span></div>
              <div className="flex"><span className="w-36">FATHER&apos;S NAME</span><span>: RAMESH KUMAR</span></div>
              <div className="flex"><span className="w-32">DATE OF BIRTH</span><span>: 15-08-2012</span></div>
              <div className="flex"><span className="w-36">GENDER</span><span>: MALE</span></div>
              <div className="flex col-span-2"><span className="w-36">ADDRESS</span><span>: GHAZIPUR, UP</span></div>
            </div>

            {/* Table Area Placeholder */}
            <div className="flex-1 border border-schoolRed flex items-center justify-center bg-gray-50">
               <p className="text-gray-400 font-bold">Marks Table yahan aayega</p>
            </div>

            {/* Signatures */}
            <div className="mt-6 flex justify-between items-end px-8 pb-4 font-semibold text-sm">
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