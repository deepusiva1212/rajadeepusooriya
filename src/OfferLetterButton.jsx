import React from "react";

export default function OfferLetterButton({ candidate }) {
  const generateOfferLetter = () => {
    // Open a temporary background window for the PDF renderer
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert("Please allow pop-ups to generate PDFs");
      return;
    }

    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Inject a perfect A4 Corporate Letterhead using Tailwind CDN
    const htmlContent = `
      <html>
        <head>
          <title>Offer_Letter_${candidate.name ? candidate.name.replace(/\s+/g, '_') : 'Candidate'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Playfair+Display:wght@700&display=swap');
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body class="bg-white p-12 text-slate-800" style="font-family: 'Inter', sans-serif; width: 210mm; height: 297mm; margin: auto;">
          <div class="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
            <div>
              <div class="text-3xl font-black tracking-tighter text-slate-900">RAJA DEEPU SOORIYA</div>
              <div class="text-xs font-bold tracking-widest uppercase text-slate-500 mt-1">Private Limited</div>
            </div>
            <div class="text-right text-[10px] text-slate-500 leading-tight">
              CIN: U79120TZ2025PTC034817<br/>
              Sankagiri, Tamil Nadu, India<br/>
              rajadeepusooriya.com
            </div>
          </div>

          <div class="flex justify-between text-sm mb-12">
            <div><strong>Date:</strong> ${today}</div>
            <div><strong>Ref:</strong> RDS/HR/${new Date().getFullYear()}/${(candidate.applicationId || "000000").slice(0, 6).toUpperCase()}</div>
          </div>

          <div class="text-sm leading-relaxed space-y-6">
            <p><strong>Dear ${candidate.name || "Candidate"},</strong></p>
            
            <p>Following our recent discussions, we are delighted to formally offer you the position of <strong>${candidate.stream || "Operations"} Intern</strong> at Raja Deepu Sooriya Private Limited, primarily focusing on the <strong>${candidate.brand || "RDS"}</strong> portfolio.</p>
            
            <p>Your academic background from ${candidate.university || candidate.college || "your institution"} makes you a strong fit for our strategic objectives. During this ${candidate.duration || "upcoming"} tenure, you will engage in high-impact operations designed to accelerate your professional trajectory.</p>
            
            <p><strong>Terms of Engagement:</strong></p>
            <ul class="list-disc pl-5 space-y-2">
              <li><strong>Reporting Track:</strong> ${candidate.batch || "Standard"} Cohort</li>
              <li><strong>Work Model:</strong> Remote / Hybrid as per operational directive</li>
              <li><strong>Performance Evaluation:</strong> Weekly milestones tracked via the RDS Enterprise Portal.</li>
            </ul>

            <p>Please sign and return a copy of this letter within 48 hours to confirm your acceptance.</p>
            
            <p>Welcome to the team.</p>
          </div>

          <div class="mt-24 flex justify-between items-end">
            <div>
              <div class="border-b border-slate-400 w-48 mb-2"></div>
              <div class="text-xs font-bold uppercase tracking-widest">Deepadharsan Rajavel</div>
              <div class="text-[10px] text-slate-500">Director of Operations</div>
            </div>
            <div>
              <div class="border-b border-slate-400 w-48 mb-2"></div>
              <div class="text-xs font-bold uppercase tracking-widest text-slate-400 text-center">Candidate Signature</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Auto-trigger the PDF save dialog after fonts load
    setTimeout(() => {
      printWindow.print();
    }, 800);
  };

  return (
    <button 
      onClick={generateOfferLetter}
      className="mt-2 w-full px-2 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded transition-colors flex justify-center items-center gap-1"
    >
      📄 Generate PDF
    </button>
  );
}
