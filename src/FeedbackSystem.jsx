import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, where, doc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function FeedbackSystem({ role, userEmail, userName }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFeedback, setNewFeedback] = useState({ type: "Suggestion", message: "", isAnonymous: false });
  const [toast, setToast] = useState({ show: false, message: "" });

  const showToast = (msg) => { setToast({ show: true, message: msg }); setTimeout(() => setToast({ show: false, message: "" }), 3000); };

  const fetchFeedback = async () => {
    try {
      // Directors see all feedback. Employees see only their own.
      const q = role === "Super Admin" 
        ? query(collection(db, "feedback"), orderBy("submittedAt", "desc"))
        : query(collection(db, "feedback"), where("email", "==", userEmail));
        
      const snap = await getDocs(q);
      const sorted = snap.docs.map(d => ({ id: d.id, ...d.data(), dateStr: d.data().submittedAt?.toDate().toLocaleDateString('en-IN') }));
      
      // If employee, sort manually since we used 'where'
      if (role !== "Super Admin") sorted.sort((a, b) => b.submittedAt - a.submittedAt);
      setFeedbacks(sorted);
    } catch (e) { console.error("Failed to load feedback"); }
    setLoading(false);
  };

  useEffect(() => { fetchFeedback(); }, []);

  const submitFeedback = async (e) => {
    e.preventDefault();
    try {
      const fbData = { 
        ...newFeedback, 
        name: newFeedback.isAnonymous ? "Anonymous" : userName, 
        email: newFeedback.isAnonymous ? "hidden" : userEmail,
        status: "New", 
        submittedAt: serverTimestamp() 
      };
      const docRef = await addDoc(collection(db, "feedback"), fbData);
      setFeedbacks([{ id: docRef.id, ...fbData, dateStr: "Just now" }, ...feedbacks]);
      setNewFeedback({ type: "Suggestion", message: "", isAnonymous: false });
      showToast("Feedback submitted to Director!");
    } catch (error) { showToast("Failed to submit"); }
  };

  const markReviewed = async (id) => {
    try {
      await updateDoc(doc(db, "feedback", id), { status: "Reviewed" });
      setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, status: "Reviewed" } : f));
      showToast("Marked as Reviewed");
    } catch (error) { showToast("Failed to update"); }
  };

  if (loading) return <div className="text-center text-gray-500 font-bold text-xs uppercase mt-12">Loading Feedback...</div>;

  return (
    <div className="animate-fade-in relative">
      {toast.show && <div className="absolute top-0 right-0 bg-gray-900 text-white px-4 py-2 rounded text-xs font-bold">{toast.message}</div>}

      {role === "User" ? (
        <div className="grid lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1">
             <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
               <h3 className="font-display text-xl font-bold mb-6">Submit Feedback</h3>
               <form onSubmit={submitFeedback} className="space-y-4">
                 <div><label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Topic</label><select value={newFeedback.type} onChange={e => setNewFeedback({...newFeedback, type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"><option>Suggestion</option><option>Complaint</option><option>Question</option></select></div>
                 <div><label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Message</label><textarea required rows="5" value={newFeedback.message} onChange={e => setNewFeedback({...newFeedback, message: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none resize-none placeholder-gray-300" placeholder="Your message goes straight to the Director..." /></div>
                 <div className="flex items-center gap-2"><input type="checkbox" id="anon" checked={newFeedback.isAnonymous} onChange={e => setNewFeedback({...newFeedback, isAnonymous: e.target.checked})} className="w-4 h-4 accent-[#10b981]" /><label htmlFor="anon" className="text-xs text-gray-700 font-bold">Submit Anonymously</label></div>
                 <button type="submit" className="w-full py-3 bg-[#10b981] hover:bg-green-600 text-white font-bold text-[10px] uppercase rounded transition-colors shadow-sm">Send to Director</button>
               </form>
             </div>
           </div>
           <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-800">My Previous Submissions</div>
                <table className="w-full text-left border-collapse">
                  <thead><tr className="border-b border-gray-200"><th className="px-6 py-3 text-[10px] text-gray-500 uppercase">Date & Type</th><th className="px-6 py-3 text-[10px] text-gray-500 uppercase">Message</th><th className="px-6 py-3 text-[10px] text-gray-500 uppercase">Status</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {feedbacks.map(f => (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap"><div className="font-bold text-sm text-gray-900">{f.dateStr}</div><div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{f.type}</div></td>
                        <td className="px-6 py-4 text-xs text-gray-700">"{f.message}"</td>
                        <td className="px-6 py-4"><div className={`inline-block px-2 py-1 rounded text-[9px] font-black uppercase ${f.status === 'New' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>{f.status}</div></td>
                      </tr>
                    ))}
                    {feedbacks.length === 0 && <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-400 text-sm font-bold uppercase">No feedback submitted</td></tr>}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      ) : (
        /* DIRECTOR INBOX VIEW */
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden max-w-5xl mx-auto">
          <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-800 flex justify-between items-center">
            <span>Feedback Inbox</span>
            <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">{feedbacks.filter(f => f.status === 'New').length} Unread</span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead><tr className="border-b border-gray-200"><th className="px-6 py-3 text-[10px] text-gray-500 uppercase">Employee</th><th className="px-6 py-3 text-[10px] text-gray-500 uppercase w-1/2">Message</th><th className="px-6 py-3 text-[10px] text-gray-500 uppercase text-right">Status</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {feedbacks.map(f => (
                <tr key={f.id} className={`hover:bg-gray-50 ${f.status === 'New' ? 'bg-blue-50/20' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-gray-900">{f.name}</div>
                    <div className="text-[10px] text-gray-500">{f.email !== 'hidden' ? f.email : ''}</div>
                    <div className="text-[9px] text-gray-400 mt-1 uppercase font-bold">{f.dateStr} • {f.type}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-pre-wrap">"{f.message}"</td>
                  <td className="px-6 py-4 text-right">
                    {f.status === 'New' ? (
                      <button onClick={() => markReviewed(f.id)} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded uppercase border border-blue-200 hover:bg-blue-100">Mark Reviewed</button>
                    ) : (
                      <span className="text-[10px] font-bold text-green-600 uppercase">✓ Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
              {feedbacks.length === 0 && <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-400 text-sm font-bold uppercase">Inbox is empty</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
