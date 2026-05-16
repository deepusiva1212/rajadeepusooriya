import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";

export default function SocialHub({ userName, userEmail }) {
  const [activeTab, setActiveTab] = useState("clubs");
  const [clubs, setClubs] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [newPost, setNewPost] = useState({ club: "Tech Enthusiasts", message: "" });
  const [newSkill, setNewSkill] = useState({ skill: "", expertise: "Intermediate" });

  useEffect(() => {
    fetchClubs();
    fetchMentors();
  }, []);

  const fetchClubs = async () => {
    const snap = await getDocs(query(collection(db, "clubs"), orderBy("timestamp", "desc")));
    setClubs(snap.docs.map(d => ({ id: d.id, ...d.data(), dateStr: d.data().timestamp?.toDate().toLocaleString('en-IN') })));
  };

  const fetchMentors = async () => {
    const snap = await getDocs(query(collection(db, "mentors"), orderBy("skill", "asc")));
    setMentors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const postToClub = async (e) => {
    e.preventDefault();
    const data = { ...newPost, author: userName, timestamp: serverTimestamp() };
    const docRef = await addDoc(collection(db, "clubs"), data);
    setClubs([{ id: docRef.id, ...data, dateStr: "Just now" }, ...clubs]);
    setNewPost({ ...newPost, message: "" });
  };

  const registerSkill = async (e) => {
    e.preventDefault();
    const data = { ...newSkill, mentorName: userName, email: userEmail, registeredAt: serverTimestamp() };
    const docRef = await addDoc(collection(db, "mentors"), data);
    setMentors([...mentors, { id: docRef.id, ...data }]);
    setNewSkill({ skill: "", expertise: "Intermediate" });
    alert("Skill added to registry!");
  };

  return (
    <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-200 animate-fade-in">
      <div className="flex gap-4 mb-8 border-b pb-4">
        <button onClick={() => setActiveTab("clubs")} className={`font-bold text-sm tracking-widest uppercase ${activeTab === 'clubs' ? 'text-corp-blue border-b-2 border-corp-blue' : 'text-gray-400'}`}>Interest Clubs</button>
        <button onClick={() => setActiveTab("mentors")} className={`font-bold text-sm tracking-widest uppercase ${activeTab === 'mentors' ? 'text-corp-blue border-b-2 border-corp-blue' : 'text-gray-400'}`}>Skill Registry</button>
      </div>

      {activeTab === "clubs" && (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <h3 className="font-bold mb-4">Post to a Club</h3>
            <form onSubmit={postToClub} className="space-y-4">
              <select value={newPost.club} onChange={e => setNewPost({...newPost, club: e.target.value})} className="w-full p-2 border rounded text-sm bg-white">
                <option>Tech Enthusiasts</option><option>Food & Culinary</option><option>Sports & Fitness</option><option>Book Club</option>
              </select>
              <textarea required rows="4" placeholder="Share something with the group..." value={newPost.message} onChange={e => setNewPost({...newPost, message: e.target.value})} className="w-full p-2 border rounded text-sm resize-none" />
              <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded text-xs font-bold uppercase tracking-widest">Share Post</button>
            </form>
          </div>
          <div className="md:col-span-2 space-y-4 max-h-[500px] overflow-y-auto">
            {clubs.map(c => (
              <div key={c.id} className="p-4 border rounded bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">{c.club}</span>
                    <h4 className="font-bold text-sm text-gray-900">{c.author}</h4>
                  </div>
                  <span className="text-[10px] text-gray-400">{c.dateStr}</span>
                </div>
                <p className="text-sm text-gray-700">{c.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "mentors" && (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <h3 className="font-bold mb-4">Register as a Mentor</h3>
            <form onSubmit={registerSkill} className="space-y-4">
              <input type="text" required placeholder="e.g., React.js, Public Speaking" value={newSkill.skill} onChange={e => setNewSkill({...newSkill, skill: e.target.value})} className="w-full p-2 border rounded text-sm" />
              <select value={newSkill.expertise} onChange={e => setNewSkill({...newSkill, expertise: e.target.value})} className="w-full p-2 border rounded text-sm bg-white">
                <option>Intermediate</option><option>Advanced</option><option>Expert / Mentor</option>
              </select>
              <button type="submit" className="w-full bg-green-600 text-white p-2 rounded text-xs font-bold uppercase tracking-widest">Add to Registry</button>
            </form>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-bold mb-4">Internal Mentorship Directory</h3>
            <table className="w-full text-left text-sm border-collapse">
              <thead><tr className="bg-gray-50 border-b"><th className="p-3 font-bold text-gray-500 uppercase text-[10px]">Skill</th><th className="p-3 font-bold text-gray-500 uppercase text-[10px]">Expertise Level</th><th className="p-3 font-bold text-gray-500 uppercase text-[10px]">Mentor Contact</th></tr></thead>
              <tbody>
                {mentors.map(m => (
                  <tr key={m.id} className="border-b">
                    <td className="p-3 font-bold text-blue-700">{m.skill}</td>
                    <td className="p-3"><span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-black uppercase">{m.expertise}</span></td>
                    <td className="p-3">
                      <div className="font-bold">{m.mentorName}</div>
                      <a href={`mailto:${m.email}`} className="text-xs text-gray-500 hover:underline">{m.email}</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
