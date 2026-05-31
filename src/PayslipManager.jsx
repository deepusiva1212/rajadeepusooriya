import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function PayslipManager() {
  const [formData, setFormData] = useState({
    employeeEmail: "",
    employeeName: "",
    role: "Intern",
    month: "January",
    year: new Date().getFullYear().toString(),
    basic: 0,
    hra: 0,
    allowances: 0,
    deductions: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const totalEarnings = Number(formData.basic) + Number(formData.hra) + Number(formData.allowances);
  const netPay = totalEarnings - Number(formData.deductions);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const safeEmail = formData.employeeEmail.trim().toLowerCase();
      await addDoc(collection(db, "payslips"), {
        ...formData,
        employeeEmail: safeEmail,
        totalEarnings,
        netPay,
        issuedAt: serverTimestamp(),
      });
      setMessage("✅ Payslip generated and securely sent to employee!");
      setFormData({ ...formData, basic: 0, hra: 0, allowances: 0, deductions: 0 }); // Reset amounts
    } catch (error) {
      console.error("Error generating payslip:", error);
      setMessage("❌ Failed to generate payslip.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
        <div className="w-10 h-10 bg-blue-500/20 text-blue-400 flex items-center justify-center rounded-lg text-xl">
          💰
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Issue Payslip</h2>
          <p className="text-xs text-slate-400">Generate secure digital payslips for RDS personnel.</p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Employee Email</label>
            <input required type="email" value={formData.employeeEmail} onChange={(e) => setFormData({...formData, employeeEmail: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white" placeholder="intern@rajadeepusooriya.com" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Employee Name</label>
            <input required type="text" value={formData.employeeName} onChange={(e) => setFormData({...formData, employeeName: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white" placeholder="Full Name" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Month & Year</label>
            <div className="flex gap-2">
              <select value={formData.month} onChange={(e) => setFormData({...formData, month: e.target.value})} className="w-2/3 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white">
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => <option key={m}>{m}</option>)}
              </select>
              <input type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} className="w-1/3 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-center" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Role</label>
            <input required type="text" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white" />
          </div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Basic Salary (₹)</label>
            <input type="number" value={formData.basic} onChange={(e) => setFormData({...formData, basic: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">HRA (₹)</label>
            <input type="number" value={formData.hra} onChange={(e) => setFormData({...formData, hra: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Other Allowances (₹)</label>
            <input type="number" value={formData.allowances} onChange={(e) => setFormData({...formData, allowances: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white" />
          </div>
          <div>
            <label className="block text-xs font-bold text-red-400 mb-1 uppercase tracking-wider">Deductions (₹)</label>
            <input type="number" value={formData.deductions} onChange={(e) => setFormData({...formData, deductions: e.target.value})} className="w-full bg-slate-800 border border-red-500/30 focus:border-red-500 rounded-lg p-2 text-white" />
          </div>
        </div>

        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-lg">
          <div className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Net Payable</div>
          <div className="text-2xl font-black text-emerald-400">₹{netPay.toLocaleString('en-IN')}</div>
        </div>

        {message && <div className="text-sm font-bold text-blue-400">{message}</div>}

        <button disabled={isSubmitting} type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
          {isSubmitting ? "Generating..." : "Issue Official Payslip"}
        </button>
      </form>
    </div>
  );
}
