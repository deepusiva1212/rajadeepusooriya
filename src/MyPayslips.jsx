import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function MyPayslips({ userEmail }) {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchPayslips = async () => {
      if (!userEmail) return;
      try {
        const q = query(collection(db, "payslips"), where("employeeEmail", "==", userEmail.toLowerCase()));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => b.issuedAt?.seconds - a.issuedAt?.seconds);
        setPayslips(data);
      } catch (error) {
        console.error("Error fetching payslips:", error);
      }
      setLoading(false);
    };
    fetchPayslips();
  }, [userEmail]);

  const generatePDF = async (slip) => {
    setDownloadingId(slip.id);
    const element = document.getElementById(`payslip-template-${slip.id}`);
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payslip_${slip.month}_${slip.year}_${slip.employeeName.replace(/ /g, "_")}.pdf`);
    } catch (error) {
      console.error("PDF Generation failed:", error);
    }
    setDownloadingId(null);
  };

  if (loading) return <div className="text-white text-center py-10">Loading Vault...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white tracking-wide">My Payslips</h2>
      
      {payslips.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-8 text-center rounded-xl text-slate-400">
          No payslips generated for this account yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payslips.map(slip => (
            <div key={slip.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-lg font-bold text-white">{slip.month} {slip.year}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Net Pay: <span className="text-emerald-400 font-bold">₹{Number(slip.netPay).toLocaleString('en-IN')}</span></div>
                </div>
                <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center text-xl">📄</div>
              </div>
              
              <button 
                onClick={() => generatePDF(slip)}
                disabled={downloadingId === slip.id}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded flex justify-center items-center transition-colors"
              >
                {downloadingId === slip.id ? "Generating PDF..." : "Download Verified Payslip"}
              </button>

              {/* HIDDEN PDF TEMPLATE FOR HTML2CANVAS */}
              <div className="fixed -left-[9999px] top-0">
                <div id={`payslip-template-${slip.id}`} className="w-[850px] bg-white p-12 text-slate-900 font-sans tracking-tight">
                  
                  {/* Header */}
                  <div className="border-b-4 border-red-700 pb-6 mb-8 flex justify-between items-end">
                    <div>
                      <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-900">Raja Deepu Sooriya</h1>
                      <p className="text-sm font-bold tracking-widest text-slate-500 uppercase mt-1">Private Limited</p>
                      <p className="text-xs text-slate-400 mt-2">17/1 DS Apartment, Tiruchengode Road, Sankagiri — 637301</p>
                      <p className="text-xs text-slate-400">CIN: U79120TZ2025PTC034817 | GSTIN: 33AAOCR6737N1ZN</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-3xl font-black text-blue-900 uppercase tracking-widest">Payslip</h2>
                      <p className="text-lg font-bold text-slate-700 mt-1">{slip.month} {slip.year}</p>
                    </div>
                  </div>

                  {/* Employee Info Grid */}
                  <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
                    <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
                      <div className="flex justify-between"><span className="text-slate-500 font-bold uppercase text-xs">Employee Name</span> <span className="font-bold">{slip.employeeName}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold uppercase text-xs">Employee ID</span> <span className="font-bold">{slip.employeeId || "N/A"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold uppercase text-xs">Designation</span> <span className="font-bold">{slip.role}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold uppercase text-xs">Department</span> <span className="font-bold">{slip.department || "N/A"}</span></div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
                      <div className="flex justify-between"><span className="text-slate-500 font-bold uppercase text-xs">Paid Days</span> <span className="font-bold">{slip.paidDays || 30}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold uppercase text-xs">Loss of Pay (LWP)</span> <span className="font-bold text-red-600">{slip.lwp || 0}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold uppercase text-xs">PAN Number</span> <span className="font-bold uppercase">{slip.panNumber || "N/A"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold uppercase text-xs">UAN Number</span> <span className="font-bold">{slip.uanNumber || "N/A"}</span></div>
                    </div>
                  </div>

                  {/* Salary Breakdown Table */}
                  <div className="border border-slate-300 rounded overflow-hidden mb-8">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-800 text-white">
                          <th className="p-3 text-left font-bold uppercase tracking-wider w-1/2">Earnings</th>
                          <th className="p-3 text-right font-bold uppercase tracking-wider border-r border-slate-600">Amount (₹)</th>
                          <th className="p-3 text-left font-bold uppercase tracking-wider w-1/2">Deductions</th>
                          <th className="p-3 text-right font-bold uppercase tracking-wider">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="p-3">Basic Salary</td><td className="p-3 text-right border-r border-slate-300">{Number(slip.basic).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-red-700">Provident Fund (PF)</td><td className="p-3 text-right text-red-700">{Number(slip.pf || 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="p-3">House Rent Allowance (HRA)</td><td className="p-3 text-right border-r border-slate-300">{Number(slip.hra).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-red-700">Income Tax (TDS)</td><td className="p-3 text-right text-red-700">{Number(slip.tds || 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="p-3">Conveyance Allowance</td><td className="p-3 text-right border-r border-slate-300">{Number(slip.conveyance || 0).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-red-700">Professional Tax (PT)</td><td className="p-3 text-right text-red-700">{Number(slip.pt || 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="p-3">Special Allowance</td><td className="p-3 text-right border-r border-slate-300">{Number(slip.special || 0).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-red-700">Other Deductions / Loan</td><td className="p-3 text-right text-red-700">{Number(slip.otherDeductions || 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="p-3">Bonus / Incentives</td><td className="p-3 text-right border-r border-slate-300">{Number(slip.bonus || 0).toLocaleString('en-IN')}</td>
                          <td className="p-3 bg-slate-50"></td><td className="p-3 bg-slate-50"></td>
                        </tr>
                        {/* Totals Row */}
                        <tr className="bg-slate-100 font-black text-base border-t-2 border-slate-400">
                          <td className="p-4">Gross Earnings</td><td className="p-4 text-right border-r border-slate-300">{Number(slip.totalEarnings).toLocaleString('en-IN')}</td>
                          <td className="p-4 text-red-700">Total Deductions</td><td className="p-4 text-right text-red-700">{Number(slip.totalDeductions || slip.deductions || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Net Pay & Footer */}
                  <div className="flex justify-between items-end mb-12">
                    <div className="text-xs text-slate-500">
                      <p><span className="font-bold text-slate-700">Bank Transfer Details:</span> A/C ending in {slip.bankAccount || "XXXX"}</p>
                      <p className="mt-1">Generated electronically on {new Date(slip.issuedAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right border-l-4 border-blue-900 pl-6">
                      <span className="block text-sm font-bold uppercase tracking-widest text-slate-500 mb-1">Net Payable Amount</span>
                      <span className="text-4xl font-black text-blue-900">
                        ₹{Number(slip.netPay).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-6 uppercase tracking-wider">
                    <p>This is a system-generated document issued by the RDS Enterprise Portal.</p>
                    <p>It is valid without a physical signature.</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
