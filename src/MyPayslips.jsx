import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
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
        // Sort manually by date issued (most recent first)
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
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`RDS_Payslip_${slip.month}_${slip.year}_${slip.employeeName.replace(/ /g, "_")}.pdf`);
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
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center text-xl">📄</div>
              </div>
              
              <button 
                onClick={() => generatePDF(slip)}
                disabled={downloadingId === slip.id}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded flex justify-center items-center gap-2 transition-colors"
              >
                {downloadingId === slip.id ? "Generating PDF..." : "Download PDF"}
              </button>

              {/* HIDDEN PDF TEMPLATE (This renders off-screen just for html2canvas to take a picture of) */}
              <div className="fixed -left-[9999px] top-0">
                <div id={`payslip-template-${slip.id}`} className="w-[800px] bg-white p-12 text-slate-900 font-sans">
                  {/* Header */}
                  <div className="flex justify-between items-center border-b-2 border-slate-900 pb-6 mb-8">
                    <div>
                      <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-900">Raja Deepu Sooriya</h1>
                      <p className="text-sm font-bold tracking-widest text-slate-500 uppercase">Private Limited</p>
                      <p className="text-xs text-slate-400 mt-1">CIN: U79120TZ2025PTC034817</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-black text-blue-600 uppercase">Payslip</h2>
                      <p className="text-lg font-bold text-slate-700">{slip.month} {slip.year}</p>
                    </div>
                  </div>

                  {/* Employee Details */}
                  <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400 mb-1">Employee Name</p>
                      <p className="font-bold text-lg">{slip.employeeName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400 mb-1">Designation</p>
                      <p className="font-bold text-lg">{slip.role}</p>
                    </div>
                  </div>

                  {/* Salary Table */}
                  <table className="w-full mb-8 border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-left">
                        <th className="p-4 text-sm uppercase tracking-wider border border-slate-900">Earnings</th>
                        <th className="p-4 text-sm uppercase tracking-wider border border-slate-900 text-right">Amount (₹)</th>
                        <th className="p-4 text-sm uppercase tracking-wider border border-slate-900">Deductions</th>
                        <th className="p-4 text-sm uppercase tracking-wider border border-slate-900 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-4 border border-slate-200 font-medium">Basic Salary</td>
                        <td className="p-4 border border-slate-200 text-right">{Number(slip.basic).toLocaleString('en-IN')}</td>
                        <td className="p-4 border border-slate-200 font-medium text-red-600">Provident Fund / Tax</td>
                        <td className="p-4 border border-slate-200 text-right text-red-600">{Number(slip.deductions).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td className="p-4 border border-slate-200 font-medium">House Rent Allowance (HRA)</td>
                        <td className="p-4 border border-slate-200 text-right">{Number(slip.hra).toLocaleString('en-IN')}</td>
                        <td className="p-4 border border-slate-200 bg-slate-50"></td>
                        <td className="p-4 border border-slate-200 bg-slate-50"></td>
                      </tr>
                      <tr>
                        <td className="p-4 border border-slate-200 font-medium">Other Allowances</td>
                        <td className="p-4 border border-slate-200 text-right">{Number(slip.allowances).toLocaleString('en-IN')}</td>
                        <td className="p-4 border border-slate-200 bg-slate-50"></td>
                        <td className="p-4 border border-slate-200 bg-slate-50"></td>
                      </tr>
                      {/* Totals */}
                      <tr className="bg-slate-100 font-black">
                        <td className="p-4 border border-slate-300">Total Earnings</td>
                        <td className="p-4 border border-slate-300 text-right">{Number(slip.totalEarnings).toLocaleString('en-IN')}</td>
                        <td className="p-4 border border-slate-300 text-red-600">Total Deductions</td>
                        <td className="p-4 border border-slate-300 text-right text-red-600">{Number(slip.deductions).toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Net Pay */}
                  <div className="flex justify-end items-center gap-6 mb-12">
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-500">Net Payable Amount:</span>
                    <span className="text-3xl font-black text-emerald-600 border-b-4 border-emerald-600 pb-1">
                      ₹{Number(slip.netPay).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="text-center text-xs text-slate-400 border-t border-slate-200 pt-6">
                    <p>This is a system-generated payslip securely issued by the RDS Enterprise Portal.</p>
                    <p>No physical signature is required.</p>
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
