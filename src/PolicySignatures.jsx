import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

export default function PolicySignatures({ userName }) {
  const [signedPolicies, setSignedPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Your Official Corporate Policies
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
    const fetchSignatures = async () => {
      try {
        // Safe document ID formatting
        const safeUserName = userName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const docRef = doc(db, "signatures", safeUserName);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSignedPolicies(docSnap.data().signed || []);
        } else {
          await setDoc(docRef, { signed: [] });
          setSignedPolicies([]);
        }
      } catch (e) {
        console.error("Error fetching signatures:", e);
      }
      setLoading(false);
    };

    fetchSignatures();
  }, [userName]);

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
      
    } catch (e) {
      alert("Failed to record signature. Please check your connection.");
    }
  };

  const hasSigned = (policyId) => signedPolicies.some(sig => sig.policyId === policyId);
  
  const getSignatureDate = (policyId) => {
    const sig = signedPolicies.find(sig => sig.policyId === policyId);
    return sig ? new Date(sig.timestamp).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "";
  };

  if (loading) return <div className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center py-8">Verifying Digital Records...</div>;

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h3 className="font-display text-2xl font-bold text-slate-900">Corporate Compliance Vault</h3>
        <p className="text-xs text-slate-500 mt-1">Review and digitally sign official policies and agreements.</p>
      </div>

      <div className="space-y-6">
        {policies.map(policy => {
          const signed = hasSigned(policy.id);
          
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
                    <div className="text-[9px] text-slate-500 font-mono mt-1">{getSignatureDate(policy.id)}</div>
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
