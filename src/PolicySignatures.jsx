import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, updateDoc, setDoc, collection, getDocs } from "firebase/firestore";

export default function PolicySignatures({ userName, role }) {
  const [signedPolicies, setSignedPolicies] = useState([]);
  const [allSignatures, setAllSignatures] = useState([]); // Used for Director Audit Log
  const [loading, setLoading] = useState(true);

  const isDirector = role === "Super Admin" || role === "Admin";

  // Official Corporate Policies
  const policies = [
    {
      id: "nda_2026",
      title: "Non-Disclosure Agreement (NDA)",
      version: "v2.1",
      text: "I agree to hold all proprietary data, client lists, and operational methodologies of Raja Deepu Sooriya Private Limited, including subsidiaries MyTripRaja and MarketerRaja, in strict confidence. I will not reproduce or distribute corporate assets without explicit Director approval."
    },
    {
      id: "it_sec_2026",
      title: "IT & Software Security Protocol",
      version: "v1.4",
      text: "I acknowledge that all tasks must be tracked via the RDS Enterprise Portal. I agree to use authorized credentials only, refrain from sharing access tokens, and immediately report any security vulnerabilities to the IT Helpdesk."
    },
    {
      id: "intern_code_2026",
      title: "Internship Code of Conduct",
      version: "v1.0",
      text: "I agree to maintain professional communication standards, complete assigned weekly milestones, and adhere to the time-tracking protocols established by the Director of Operations. Failure to meet these metrics may result in termination of the internship."
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isDirector) {
          // DIRECTOR VIEW: Fetch ALL signatures from the entire company
          const snap = await getDocs(collection(db, "signatures"));
          let auditLog = [];
          snap.docs.forEach(d => {
            const data = d.data();
            if (data.signed) {
              data.signed.forEach(sig => auditLog.push(sig));
            }
          });
          // Sort by newest first
          auditLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setAllSignatures(auditLog);
        } else {
          // EMPLOYEE VIEW: Fetch only their personal signatures
          const safeUserName = userName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          const docRef = doc(db, "signatures", safeUserName);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setSignedPolicies(docSnap.data().signed || []);
          } else {
            await setDoc(docRef, { signed: [] });
            setSignedPolicies([]);
          }
        }
      } catch (e) {
        console.error("Error fetching signatures:", e);
      }
      setLoading(false);
    };

    fetchData();
  }, [userName, isDirector]);

  const signPolicy = async (policyId) => {
    if (!window.confirm("By clicking OK, you are applying a legally binding digital signature to this document.")) return;
    
    try {
      const safeUserName = userName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const docRef = doc(db, "signatures", safeUserName);
      
      const newSignature = {
        policyId: policyId,
        timestamp: new Date().toISOString(),
        signer: userName
      };

      const updatedSignatures = [...signedPolicies, newSignature];
      await updateDoc(docRef, { signed: updatedSignatures });
      setSignedPolicies(updatedSignatures);
      alert("Signature successfully recorded!");
      
    } catch (e) {
      alert("Failed to record signature. Did you update Firebase Rules?");
    }
  };

  const hasSigned = (policyId) => signedPolicies.some(sig => sig.policyId === policyId);
  
  const getSignatureDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center py-8">Verifying Digital Records...</div>;

  // ==========================================
  // VIEW 1: DIRECTOR AUDIT DASHBOARD
  // ==========================================
  if (isDirector) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h3 className="font-display text-2xl font-bold text-slate-900">Corporate Compliance Audit</h3>
          <p className="text-xs text-slate-500 mt-1">Master ledger of all legally binding signatures from staff and interns.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-800">Signature Master Ledger</div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                <th className="px-6 py-3">Employee Name</th>
                <th className="px-6 py-3">Document Signed</th>
                <th className="px-6 py-3">Timestamp (IST)</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allSignatures.map((sig, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-sm text-slate-900">{sig.signer}</td>
                  <td className="px-6 py-4 text-xs font-bold text-indigo-600">{policies.find(p => p.id === sig.policyId)?.title || sig.policyId}</td>
                  <td className="px-6 py-4 text-[10px] text-slate-500 font-mono">{getSignatureDate(sig.timestamp)}</td>
                  <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">Verified</span></td>
                </tr>
              ))}
              {allSignatures.length === 0 && (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No signatures on file yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: EMPLOYEE SIGNING INTERFACE
  // ==========================================
  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h3 className="font-display text-2xl font-bold text-slate-900">Corporate Compliance Vault</h3>
        <p className="text-xs text-slate-500 mt-1">Review and digitally sign official policies and agreements.</p>
      </div>

      <div className="space-y-6">
        {policies.map(policy => {
          const signed = hasSigned(policy.id);
          const sigData = signedPolicies.find(sig => sig.policyId === policy.id);
          
          return (
            <div key={policy.id} className={`bg-white border rounded-xl overflow-hidden transition-all shadow-sm ${signed ? 'border-emerald-200' : 'border-slate-200'}`}>
              <div className={`p-4 flex justify-between items-center border-b ${signed ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Document Ref: {policy.id} ({policy.version})</div>
                  <h4 className="font-bold text-slate-900">{policy.title}</h4>
                </div>
                {signed ? (
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1 justify-end"><span className="text-lg">✅</span> Digitally Signed</div>
                    <div className="text-[9px] text-slate-500 font-mono mt-1">{getSignatureDate(sigData.timestamp)}</div>
                  </div>
                ) : (
                  <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1">
                    <span className="text-lg">⚠️</span> Signature Required
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 font-serif italic mb-6">
                  "{policy.text}"
                </div>
                
                {!signed && (
                  <button 
                    onClick={() => signPolicy(policy.id)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-colors shadow-sm w-full md:w-auto"
                  >
                    ✍️ I Agree & Digitally Sign
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
