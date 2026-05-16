import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function PrivateNotepad({ userEmail }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      const snap = await getDoc(doc(db, "notes", userEmail));
      if (snap.exists()) setNote(snap.data().content);
    };
    fetchNote();
  }, [userEmail]);

  const handleSave = async () => {
    setSaving(true);
    await setDoc(doc(db, "notes", userEmail), { content: note, lastUpdated: new Date().toLocaleString() });
    setTimeout(() => setSaving(false), 500);
  };

  return (
    <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 animate-fade-in flex flex-col h-[70vh]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-gray-800">My Private Workspace</h3>
        <button onClick={handleSave} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors ${saving ? 'bg-green-500 text-white' : 'bg-gray-900 text-corp-gold'}`}>
          {saving ? "Saved ✓" : "Save Notes"}
        </button>
      </div>
      <textarea 
        value={note} 
        onChange={(e) => setNote(e.target.value)} 
        placeholder="Type your personal notes, daily to-do lists, or drafts here. This is 100% private to your account..."
        className="flex-1 w-full p-4 border border-gray-200 rounded bg-gray-50 focus:bg-white outline-none resize-none font-body text-sm leading-relaxed" 
      />
    </div>
  );
}
