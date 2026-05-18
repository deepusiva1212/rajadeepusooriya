import React from "react";

export default function IDCardButton({ staffData }) {
  const generateIDCard = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) {
      alert("Please allow pop-ups to generate ID Cards");
      return;
    }

    // Use their uploaded photo if available, otherwise use a colored initial circle
    const photoHtml = staffData.photoUrl 
      ? `<img src="${staffData.photoUrl}" style="width: 110px; height: 110px; border-radius: 50%; object-fit: cover; border: 4px solid #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 0 auto;" />`
      : `<div style="width: 110px; height: 110px; border-radius: 50%; background-color: #e2e8f0; color: #64748b; font-size: 42px; display: flex; align-items: center; justify-content: center; border: 4px solid #fff; font-weight: bold; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">${staffData.name.charAt(0)}</div>`;

    // Standard CR80 Card Dimensions (54mm x 86mm)
    const htmlContent = `
      <html>
        <head>
          <title>ID_Card_${staffData.name.replace(/\s+/g, '_')}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            @media print { 
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; } 
              @page { size: 54mm 86mm; margin: 0; }
            }
            body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f8fafc; font-family: 'Inter', sans-serif; }
            .id-card { width: 54mm; height: 86mm; background: white; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #cbd5e1; position: relative; display: flex; flex-direction: column; }
            
            .header { background: #0f172a; padding: 12px 0; text-align: center; }
            .header-title { font-weight: 900; font-size: 11px; color: #fbbf24; letter-spacing: 0.05em; }
            .header-sub { font-size: 6px; font-weight: bold; color: #cbd5e1; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 1px;}
            
            .photo-container { text-align: center; margin-top: 16px; position: relative; z-index: 10; }
            
            .details { text-align: center; padding: 10px 12px; flex-grow: 1; }
            .name { font-size: 14px; font-weight: 900; color: #0f172a; margin-bottom: 2px; line-height: 1.1; }
            .role { font-size: 8px; font-weight: bold; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
            
            .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; }
            .info-row { font-size: 7px; color: #475569; margin-bottom: 3px; display: flex; justify-content: space-between; align-items: center; }
            .info-label { font-weight: bold; color: #94a3b8; }
            .info-val { font-weight: bold; color: #0f172a; }
            
            .footer { background: #f1f5f9; padding: 8px 0; text-align: center; border-top: 1px dashed #cbd5e1; margin-top: auto; }
            .signature { font-family: 'Inter', sans-serif; font-size: 9px; font-weight: 900; color: #0f172a; letter-spacing: 0.05em; }
            .footer-text { font-size: 5px; color: #64748b; margin-top: 2px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.1em; }
          </style>
        </head>
        <body>
          <div class="id-card">
            <div class="header">
              <div class="header-title">RAJA DEEPU SOORIYA</div>
              <div class="header-sub">Private Limited</div>
            </div>
            
            <div class="photo-container">
              ${photoHtml}
            </div>
            
            <div class="details">
              <div class="name">${staffData.name}</div>
              <div class="role">${staffData.role || 'Staff Member'}</div>
              
              <div class="info-box">
                <div class="info-row"><span class="info-label">EMP ID</span> <span class="info-val">${staffData.employeeId || 'RDS-PENDING'}</span></div>
                <div class="info-row"><span class="info-label">EMAIL</span> <span class="info-val">${staffData.email.length > 20 ? staffData.email.slice(0, 18) + '...' : staffData.email}</span></div>
                <div class="info-row" style="margin-bottom: 0;"><span class="info-label">VALID THRU</span> <span class="info-val">DEC ${new Date().getFullYear() + 1}</span></div>
              </div>
            </div>
            
            <div class="footer">
              <div class="signature">Deepadharsan Rajavel</div>
              <div class="footer-text">Authorized Signatory</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Auto-trigger the PDF save dialog after the photo and fonts load
    setTimeout(() => {
      printWindow.print();
    }, 800);
  };

  return (
    <button 
      onClick={generateIDCard}
      className="mt-6 w-full py-3 border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-sm flex justify-center items-center gap-2"
    >
      <span className="text-lg">🪪</span> Generate Digital ID Badge
    </button>
  );
}
