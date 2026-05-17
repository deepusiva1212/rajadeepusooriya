import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";

export default function OnCallRoster({ role }) {
  const [shifts, setShifts] = useState([]);
  const [newShift, setNewShift] = useState({ date: "", employee: "", shiftType: "Weekend Support" });

  useEffect(() => {
    getDocs(query(collection(db, "oncall"), orderBy("date", "asc"))).then(snap => setShifts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const assignShift = async (e) => {
    e.preventDefault();
    const docRef = await addDoc(collection(db, "oncall"), newShift);
    let updated = [...shifts, { id: docRef.id, ...newShift }];
    updated.sort((a, b) => new Date(a.date) - new Date(b.date));
    setShifts(updated);
  };

  return (
    <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-200 animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="font-display text-2xl font-black text-gray-900">Emergency & On-Call Roster</h3>
          <p className="text-gray-500 text-sm">Designated personnel for after-hours and weekend server/client support.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {role === "Super Admin" && (
          <div className="md:col-span-1 bg-gray-50 p-6 border rounded-sm h-fit">
            <h3 className="font-bold mb-4">Assign On-Call Shift</h3>
            <form onSubmit={assignShift} className="space-y-4">
              <input type="date" required value={newShift.date} onChange={e => setNewShift({...newShift, date: e.target.value})} className="w-full p-2 border rounded text-sm" />
              <input type="text" required placeholder="Employee Name" value={newShift.employee} onChange={e => setNewShift({...newShift, employee: e.target.value})} className="w-full p-2 border rounded text-sm" />
              <select value={newShift.shiftType} onChange={e => setNewShift({...newShift, shiftType: e.target.value})} className="w-full p-2 border rounded text-sm bg-white"><option>Weekend Support (Sat/Sun)</option><option>Night Shift (10 PM - 6 AM)</option><option>Holiday Emergency Coverage</option></select>
              <button type="submit" className="w-full bg-corp-blue text-white p-2 rounded text-xs font-bold uppercase tracking-widest">Assign Shift</button>
            </form>
          </div>
        )}

        <div className={role === "Super Admin" ? "md:col-span-2" : "md:col-span-3"}>
          <div className="space-y-3">
            {shifts.map(shift => (
              <div key={shift.id} className="p-4 border rounded bg-white shadow-sm flex justify-between items-center border-l-4 border-corp-gold">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{shift.shiftType}</div>
                  <div className="font-bold text-lg text-gray-900">{shift.employee}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase font-bold">Shift Date</div>
                  <div className="font-bold text-corp-blue">{new Date(shift.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                </div>
              </div>
            ))}
            {shifts.length === 0 && <div className="p-8 text-center text-gray-400 uppercase font-bold text-sm tracking-widest border border-dashed rounded">No upcoming shifts scheduled</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
