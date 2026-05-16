import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";

export default function PolicySignatures({ userName, role }) {
  const [signatures, setSignatures] = useState([]);
  
  useEffect(() => {
    getDocs(query(collection(db, "policies"), orderBy("timestamp", "desc"))).then(snap => {
      setSignatures(snap.docs.map(d => ({ id: d.id, ...d.data(), dateStr: d.data().timestamp?.toDate().toLocaleString('en-IN') })));
    });
  }, []);

  const signPolicy = async (policyName) => {
    const data = { policyName, employeeName: userName, timestamp: serverTimestamp() };
    const docRef = await addDoc(collection(db, "policies"), data);
    setSignatures([{ id: docRef.id, ...data, dateStr: "Just now" }, ...signatures]);
    alert("Digital Signature Recorded!");
  };

  const policies = ["Employee Handbook v2.0", "Data Privacy & Security Addendum", "Remote Work Protocol"];

  return (
    <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-200 animate-fade-in">
      <h3 className="font-bold text-xl mb-6">Compliance & E-Signatures</h3>
      
      {role === "User" ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">Please read and digitally acknowledge the following company policies.</p>
          {policies.map(p => {
            const hasSigned = signatures.some(sig => sig.policyName === p && sig.employeeName === userName);
            return (
              <div key={p} className="flex justify-between items-center p-4 border rounded bg-gray-50">
                <span className="font-bold text-sm text-gray-800">📄 {p}</span>
                {hasSigned ? (
                  <span className="text-green-600 text-xs font-black uppercase tracking-widest">✓ Signed</span>
                ) : (
                  <button onClick={() => signPolicy(p)} className="bg-gray-900 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-black">Sign & Acknowledge</button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <table className="w-full text-left text-sm border-collapse">
          <thead><tr className="bg-gray-50 border-b"><th className="p-3 font-bold text-gray-500 uppercase text-[10px]">Employee</th><th className="p-3 font-bold text-gray-500 uppercase text-[10px]">Document Signed</th><th className="p-3 font-bold text-gray-500 uppercase text-[10px]">Date/Time</th></tr></thead>
          <tbody>
            {signatures.map(sig => (
              <tr key={sig.id} className="border-b"><td className="p-3 font-bold">{sig.employeeName}</td><td className="p-3 text-corp-blue font-bold">{sig.policyName}</td><td className="p-3 text-gray-500 text-xs">{sig.dateStr}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
