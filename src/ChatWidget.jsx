import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, onSnapshot } from "firebase/firestore";

export default function ChatWidget({ userName, userEmail }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef(null);

  // Listen to the database in real-time
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    
    // onSnapshot listens for live updates instantly without refreshing
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(fetchedMessages);
      
      // Calculate unread messages (if window is closed, count new messages)
      if (!isOpen) {
        // Simple logic: if a message arrives and the chat is closed, increment
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => unsubscribe();
  }, [isOpen]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadCount(0); // Clear unread count when opened
    }
  }, [messages, isOpen]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      await addDoc(collection(db, "messages"), {
        text: newMessage,
        sender: userName,
        email: userEmail,
        createdAt: serverTimestamp()
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Sending...";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      
      {/* 🟢 EXPANDED CHAT WINDOW */}
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-slate-200 mb-4 overflow-hidden flex flex-col h-[500px] animate-fade-in origin-bottom-right">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-full"><span className="text-xl">💬</span></div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">RDS Team Comm</h3>
                <p className="text-[9px] font-medium opacity-80 uppercase tracking-widest">End-to-End Internal</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
              ✕
            </button>
          </div>

          {/* Chat History Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] space-y-4 custom-scrollbar">
            <div className="text-center mb-6">
              <span className="bg-[#fff9d7] text-slate-600 text-[9px] font-bold px-3 py-1 rounded shadow-sm uppercase tracking-widest">
                🔒 Official Corporate Channel
              </span>
            </div>
            
            {messages.map((msg) => {
              const isMe = msg.email === userEmail;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${isMe ? "bg-[#dcf8c6] rounded-tr-none" : "bg-white rounded-tl-none"}`}>
                    {!isMe && <div className="text-[10px] font-black text-emerald-600 mb-0.5">{msg.sender}</div>}
                    <div className="text-sm text-slate-800 leading-snug">{msg.text}</div>
                    <div className="text-[9px] text-slate-400 text-right mt-1 font-mono">
                      {formatTime(msg.createdAt)} {isMe && <span className="text-emerald-500">✓✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={sendMessage} className="bg-slate-100 p-3 border-t border-slate-200 flex gap-2 items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 rounded-full text-sm outline-none border border-slate-200 focus:border-emerald-500 transition-colors bg-white shadow-inner"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-md flex-shrink-0"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* 🔴 FLOATING BUTTON TONGGLE */}
      <button 
        onClick={() => { setIsOpen(!isOpen); setUnreadCount(0); }}
        className="w-16 h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 relative group"
      >
        <span className="text-3xl">💬</span>
        
        {/* Red Unread Badge */}
        {!isOpen && unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-50 shadow-md animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>
      
    </div>
  );
}
