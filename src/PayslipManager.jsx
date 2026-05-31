import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function PayslipManager() {
  const [formData, setFormData] = useState({
    // Employee Info
    employeeEmail: "", employeeName: "", employeeId: "RDS-",
    role: "Intern", department: "Digital Marketing",
    month: "January", year: new Date().getFullYear().toString(),
    // Statutory & Bank
    panNumber: "", uanNumber: "", bankAccount: "",
    // Attendance
    paidDays: 30, lwp: 0,
    // Earnings
    basic: 0, hra: 0, conveyance: 0, special: 0, bonus: 0,
    // Deductions
    pf: 0, tds: 0, pt: 0, otherDeductions: 0,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const totalEarnings = Number(formData.basic) + Number(formData.hra) + Number(formData.conveyance) + Number(formData.special) + Number(formData.bonus);
  const totalDeductions = Number(formData.pf) + Number(formData.tds) + Number(formData.pt) + Number(formData.otherDeductions);
  const netPay = totalEarnings - totalDeductions;

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
        totalDeductions,
        netPay,
        issuedAt: serverTimestamp(),
      });
      setMessage("✅ Comprehensive Payslip generated securely!");
      // Reset financial amounts but keep employee details for quick next-entry
      setFormData({ ...formData, basic: 0, hra: 0, conveyance: 0, special: 0, bonus: 0, pf: 0, tds: 0, pt: 0, otherDeductions: 0, lwp: 0 });
    } catch (error) {
      console.error("Error generating payslip:", error);
      setMessage("❌ Failed to generate payslip.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
        <div className="w-10 h-10 bg-blue-500/20 text-blue-400 flex items-center justify-center rounded-lg text-xl">💰</div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Issue Comprehensive Payslip</h2>
          <p className="text-xs text-slate-400">Statutory compliant payroll generation (Includes PAN, PF, TDS).</p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        
        {/* SECTION 1: IDENTITY */}
        <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
          <h3 className="text-sm font-bold text-corp-gold mb-4 uppercase tracking-widest">1. Personnel Identity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Email Address</label>
              <input required type="email" value={formData.employeeEmail} onChange={(e) => setFormData({...formData, employeeEmail: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Full Name</label>
              <input required type="text" value={formData.employeeName} onChange={(e) => setFormData({...formData, employeeName: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Employee ID</label>
              <input required type="text" value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Designation / Role</label>
              <input required type="text" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Department</label>
              <input required type="text" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Month & Year</label>
              <div className="flex gap-2">
                <select value={formData.month} onChange={(e) => setFormData({...formData, month: e.target.value})} className="w-2/3 bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm">
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => <option key={m}>{m}</option>)}
                </select>
                <input type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} className="w-1/3 bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm text-center" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: STATUTORY & COMPLIANCE */}
        <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
          <h3 className="text-sm font-bold text-blue-400 mb-4 uppercase tracking-widest">2. Compliance & Banking</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">PAN Number</label>
              <input type="text" value={formData.panNumber} onChange={(e) => setFormData({...formData, panNumber: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm uppercase" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">UAN (PF Number)</label>
              <input type="text" value={formData.uanNumber} onChange={(e) => setFormData({...formData, uanNumber: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Bank A/C (Last 4 Digits)</label>
              <input type="text" value={formData.bankAccount} onChange={(e) => setFormData({...formData, bankAccount: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm" placeholder="e.g. XXXX4567" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Total Paid Days</label>
              <input type="number" value={formData.paidDays} onChange={(e) => setFormData({...formData, paidDays: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">LWP (Leave Without Pay)</label>
              <input type="number" value={formData.lwp} onChange={(e) => setFormData({...formData, lwp: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm" />
            </div>
          </div>
        </div>

        {/* SECTION 3: FINANCIALS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* EARNINGS */}
          <div className="bg-emerald-900/10 p-4 rounded-lg border border-emerald-500/20">
            <h3 className="text-sm font-bold text-emerald-400 mb-4 uppercase tracking-widest">3. Earnings (₹)</h3>
            <div className="space-y-3">
              {[
                { label: "Basic Salary", field: "basic" },
                { label: "House Rent Allowance (HRA)", field: "hra" },
                { label: "Conveyance Allowance", field: "conveyance" },
                { label: "Special Allowance", field: "special" },
                { label: "Bonus / Incentives", field: "bonus" },
              ].map((item) => (
                <div key={item.field} className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase">{item.label}</label>
                  <input type="number" value={formData[item.field]} onChange={(e) => setFormData({...formData, [item.field]: e.target.value})} className="w-32 bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-sm text-right" />
                </div>
              ))}
              <div className="pt-3 border-t border-emerald-500/30 flex justify-between">
                <span className="text-xs font-black text-emerald-500 uppercase">Total Earnings</span>
                <span className="text-sm font-black text-emerald-400">₹{totalEarnings.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* DEDUCTIONS */}
          <div className="bg-red-900/10 p-4 rounded-lg border border-red-500/20">
            <h3 className="text-sm font-bold text-red-400 mb-4 uppercase tracking-widest">4. Deductions (₹)</h3>
            <div className="space-y-3">
              {[
                { label: "Provident Fund (PF)", field: "pf" },
                { label: "Tax Deducted at Source (TDS)", field: "tds" },
                { label: "Professional Tax (PT)", field: "pt" },
                { label: "Other Deductions / Loan", field: "otherDeductions" },
              ].map((item) => (
                <div key={item.field} className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase">{item.label}</label>
                  <input type="number" value={formData[item.field]} onChange={(e) => setFormData({...formData, [item.field]: e.target.value})} className="w-32 bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-sm text-right" />
                </div>
              ))}
              <div className="pt-3 border-t border-red-500/30 flex justify-between mt-auto">
                <span className="text-xs font-black text-red-500 uppercase">Total Deductions</span>
                <span className="text-sm font-black text-red-400">₹{totalDeductions.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* NET PAY */}
        <div className="flex items-center justify-between bg-blue-600 border border-blue-500 p-5 rounded-xl shadow-lg">
          <div className="text-white font-bold uppercase tracking-widest text-sm">Net Payable Amount</div>
          <div className="text-3xl font-black text-white">₹{netPay.toLocaleString('en-IN')}</div>
        </div>

        {message && <div className="text-sm font-bold text-white bg-green-500/20 p-3 rounded">{message}</div>}

        <button disabled={isSubmitting} type="submit" className="w-full py-4 bg-white hover:bg-gray-200 text-slate-900 font-black tracking-widest uppercase rounded-lg transition-colors shadow-lg">
          {isSubmitting ? "Generating..." : "Issue Official Payslip"}
        </button>
      </form>
    </div>
  );
}
