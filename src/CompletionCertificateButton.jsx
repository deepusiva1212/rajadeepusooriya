import React from "react";

export default function CompletionCertificateButton({ candidate }) {
  const generateCertificate = () => {
    // Optional safeguard: Warn if they haven't been marked as completed
    if (candidate.status !== "Selected" && candidate.status !== "Completed") {
      if(!window.confirm("This candidate's status is not 'Completed' or 'Selected'. Generate anyway?")) return;
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    if (!printWindow) {
      alert("Please allow pop-ups to generate Certificates");
      return;
    }

    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    // Landscape A4 HTML Document using pure flat colors
    const htmlContent = `
      <html>
        <head>
          <title>Certificate_${candidate.name ? candidate.name.replace(/\s+/g, '_') : 'Candidate'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@400;700;900&display=swap');
            @media print { 
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @page { size: A4 landscape; margin: 0; }
            }
          </style>
        </head>
        <body class="bg-white flex items-center justify-center min-h-screen m-0" style="font-family: 'Inter', sans-serif;">
          <div class="border-[16px] border-[#0f172a] p-12 text-center relative" style="width: 277mm; height: 190mm; box-sizing: border-box;">
            
            <div class="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none text-9xl font-black">RDS</div>
            
            <div class="text-xs font-bold tracking-[0.3em] uppercase text-[#fbbf24] mb-2">Raja Deepu Sooriya Private Limited</div>
            <h1 class="text-5xl font-black text-[#0f172a] mb-12" style="font-family: 'Playfair Display', serif;">CERTIFICATE OF COMPLETION</h1>
            
            <p class="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">This is proudly presented to</p>
            
            <h2 class="text-4xl font-bold text-[#2563eb] mb-6 border-b-2 border-slate-200 pb-4 inline-block px-12" style="font-family: 'Playfair Display', serif;">
              ${candidate.name || "Candidate Name"}
            </h2>
            
            <p class="text-base text-slate-700 leading-relaxed max-w-3xl mx-auto mb-16">
              For successfully completing the internship program in the <strong>${candidate.stream || "Operations"}</strong> track. 
              During their tenure focusing on the <strong>${candidate.brand || "RDS"}</strong> portfolio, they demonstrated exceptional dedication, execution, and adherence to our corporate values.
            </p>
            
            <div class="flex justify-between items-end px-24 mt-12">
              <div class="text-left">
                <div class="text-sm font-bold text-slate-800 mb-1">Date of Issue</div>
                <div class="text-xs font-bold text-slate-500 border-t-2 border-slate-300 pt-2 w-40">${today}</div>
              </div>
              
              <div class="text-right">
                <div class="text-sm font-black text-slate-800 mb-1" style="font-family: 'Playfair Display', serif;">Deepadharsan Rajavel</div>
                <div class="text-xs font-bold text-slate-500 border-t-2 border-[#0f172a] pt-2 w-48 text-center uppercase tracking-widest">Director of Operations</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 800);
  };

  return (
    <button 
      onClick={generateCertificate}
      className="mt-2 w-full px-2 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[9px] font-bold uppercase tracking-widest rounded transition-colors flex justify-center items-center gap-1"
    >
      🎓 Generate Certificate
    </button>
  );
}
