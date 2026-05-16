import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, where, serverTimestamp } from "firebase/firestore";

export default function MyCalendar({ userEmail, userName }) {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ date: "", title: "" });

  useEffect(() => {
    const loadAllCalendarData = async () => {
      let combinedEvents = [];

      // 1. Fetch Personal Work/Events
      const snapPersonal = await getDocs(query(collection(db, "calendar"), where("email", "==", userEmail)));
      combinedEvents = [...combinedEvents, ...snapPersonal.docs.map(d => ({ id: d.id, type: "Personal Task", ...d.data() }))];

      // 2. Fetch System Meetings (Global)
      const snapMeetings = await getDocs(query(collection(db, "meetings")));
      combinedEvents = [...combinedEvents, ...snapMeetings.docs.map(d => ({ id: `mtg-${d.id}`, type: "Meeting", date: d.data().date, title: `${d.data().title} (${d.data().time})` }))];

      // 3. Fetch Approved Leaves (For this user)
      const snapLeaves = await getDocs(query(collection(db, "leaves"), where("applicantEmail", "==", userEmail), where("status", "==", "Approved")));
      combinedEvents = [...combinedEvents, ...snapLeaves.docs.map(d => ({ id: `leave-${d.id}`, type: "Leave Approved", date: d.data().startDate, title: `Out of Office: ${d.data().type}` }))];

      // Sort everything by Date
      combinedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
      setEvents(combinedEvents);
    };
    
    loadAllCalendarData();
  }, [userEmail]);

  const addPersonalEvent = async (e) => {
    e.preventDefault();
    const data = { ...newEvent, email: userEmail, userName: userName, timestamp: serverTimestamp() };
    const docRef = await addDoc(collection(db, "calendar"), data);
    
    // Sort array locally after adding
    let updatedList = [...events, { id: docRef.id, type: "Personal Task", ...data }];
    updatedList.sort((a, b) => new Date(a.date) - new Date(b.date));
    setEvents(updatedList);
    setNewEvent({ date: "", title: "" });
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 animate-fade-in">
      <div className="md:col-span-1">
        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
          <h3 className="font-bold mb-4 text-lg">Add to My Schedule</h3>
          <p className="text-xs text-gray-500 mb-4">Add your own reminders. Meetings and Approved Leaves will appear automatically.</p>
          <form onSubmit={addPersonalEvent} className="space-y-4">
            <input type="date" required value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full p-2 border rounded text-sm" />
            <input type="text" required placeholder="Event or Task Name" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full p-2 border rounded text-sm" />
            <button type="submit" className="w-full bg-corp-blue text-white p-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-blue-900">Save to Agenda</button>
          </form>
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-800 flex justify-between items-center">
            <span>Unified Agenda</span>
            <span className="text-xs text-gray-400 font-normal">Sorted by upcoming date</span>
          </div>
          <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
            {events.map((evt, index) => (
              <div key={index} className="flex gap-4 items-center p-3 border rounded shadow-sm hover:shadow-md transition-shadow bg-white">
                <div className="bg-gray-100 text-center rounded p-2 min-w-[70px]">
                  <div className="text-[10px] uppercase font-black text-gray-500">{new Date(evt.date).toLocaleString('en-US', { month: 'short' })}</div>
                  <div className="text-xl font-black text-gray-900">{new Date(evt.date).toLocaleString('en-US', { day: '2-digit' })}</div>
                </div>
                <div>
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${evt.type === 'Meeting' ? 'text-blue-600' : evt.type === 'Leave Approved' ? 'text-green-600' : 'text-corp-gold'}`}>{evt.type}</div>
                  <div className="font-bold text-sm text-gray-900">{evt.title}</div>
                </div>
              </div>
            ))}
            {events.length === 0 && <div className="text-center text-gray-400 py-8 text-sm font-bold uppercase">No upcoming events</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
