import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, doc, runTransaction, query, where, getDocs } from "firebase/firestore";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import emailjs from '@emailjs/browser';
import ResumeUpload from "./ResumeUpload";

export default function InternshipPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  
  const [activeTab, setActiveTab] = useState("apply");
  const [form, setForm] = useState({ 
    name: "", phone: "", altPhone: "", 
    university: "", college: "", 
    stream: "", major: "",
    batch: "", year: "1st Year", 
    brand: "MyTripRaja", duration: "1 Month",
    linkedin: "", portfolio: "", whyInternship: ""
  });
  
  const [universitiesList, setUniversitiesList] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [verifiedEmail, setVerifiedEmail] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentAppId, setSentAppId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [trackingId, setTrackingId] = useState("");
  const [trackingStatus, setTrackingStatus] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [trackError, setTrackError] = useState("");

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const res = await fetch("http://universities.hipolabs.com/search?country=India");
        if (res.ok) {
          const data = await res.json();
          const uniNames = Array.from(new Set(data.map(u => u.name))).sort();
          setUniversitiesList(uniNames);
        }
      } catch (error) {
        setUniversitiesList(["Anna University", "Bharathiar University", "Madras University", "SRM Institute", "VIT", "Delhi University"]);
      }
    };
    fetchUniversities();
  }, []);

  const handleGoogleVerify = async () => {
    setErrorMsg("");
    try {
      const result = await signInWithPopup(auth, provider);
      setVerifiedEmail(result.user.email);
    } catch (error) { setErrorMsg("Verification failed. Please try again."); }
  };

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(form.phone)) { setErrorMsg("Please enter a valid 10-digit primary mobile number."); return; }
    if (!resumeFile) { setErrorMsg("Please upload your resume."); return; }
    setShowConfirm(true);
  };

  const processFinalSubmission = async () => {
    if (!agreedToTerms) return;
    setShowConfirm(false);
    setIsSubmitting(true);
    
    try {
      const counterDocRef = doc(db, "counters", "applications");
      const newIdNum = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterDocRef);
        let nextNum = 1;
        if (!counterDoc.exists()) { transaction.set(counterDocRef, { count: 1 }); } 
        else { nextNum = counterDoc.data().count + 1; transaction.update(counterDocRef, { count: nextNum }); }
        return nextNum;
      });
      const uniqueId = "RDS-" + new Date().getFullYear() + "-" + String(newIdNum).padStart(4, '0');

      const formData = new FormData();
      formData.append("file", resumeFile);
      formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const cloudData = await cloudRes.json();
      if (!cloudRes.ok) throw new Error(cloudData.error.message);
      const secureDownloadUrl = cloudData.secure_url;

      await addDoc(collection(db, "applications"), {
        ...form, email: verifiedEmail, applicationId: uniqueId, resumeUrl: secureDownloadUrl, submittedAt: serverTimestamp(), status: "Pending"
      });

      try {
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID, 
          { to_name: form.name, to_email: verifiedEmail, application_id: uniqueId, brand: form.brand, role: "Internship Application" },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY 
        );
      } catch (emailError) { console.error("Email failed", emailError); }

      setSentAppId(uniqueId);
      signOut(auth); 
    } catch (error) { setErrorMsg("There was an error processing your application. Please try again."); }
    setIsSubmitting(false);
  };

  const trackApplication = async (e) => {
    e.preventDefault();
    setTrackError(""); setTrackingStatus(null); setIsSearching(true);
    try {
      const q = query(collection(db, "applications"), where("applicationId", "==", trackingId.toUpperCase().trim()));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) setTrackError("No application found with that ID. Please check and try again.");
      else setTrackingStatus(querySnapshot.docs[0].data().status || "Pending");
    } catch (error) { setTrackError("Error fetching status. Please try again later."); }
    setIsSearching(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sentAppId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareAppId = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'RDS Application ID',
          text: `My Raja Deepu Sooriya Internship Application ID is: ${sentAppId}`,
        });
      } catch (err) { console.log('Share cancelled'); }
    } else {
      alert("Sharing is not supported on this browser. Please use the Copy button.");
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 relative">
      
      <datalist id="universities-list">
        {universitiesList.map(uni => <option key={uni} value={uni} />)}
      </datalist>

      {/* FINAL CONFIRMATION POPUP WITH SECURITY WARNING */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6">
          <div className="bg-white p-6 sm:p-8 rounded-sm shadow-2xl max-w-lg w-full border-t-4 border-corp-red animate-fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-2xl font-black text-gray-900 mb-4">Final Confirmation</h3>
            
            <div className="bg-yellow-50 text-yellow-800 text-xs sm:text-sm p-4 rounded-sm border border-yellow-200 mb-6 space-y-3 font-medium">
              <p className="text-red-600 font-black uppercase tracking-widest text-[10px]">⚠️ Security Alert</p>
              <p>Beware of fraudulent calls or messages. If anyone claims to be from Raja Deepu Sooriya Private Limited and asks for your private details or money, <b>do not share them.</b></p>
              <p>We will <b>NEVER</b> ask you to pay any amount to personal accounts (GPay, PhonePe, etc.). All official transactions only happen through company-registered bank accounts.</p>
              <p>We only ask for additional details if there is a mistake in your form, and we will <b>only</b> request this via our official email: <a href="mailto:contact@rajadeepusooriya.com" className="font-bold underline">contact@rajadeepusooriya.com</a> (or another @rajadeepusooriya.com domain). We will only discuss internship-related matters.</p>
            </div>

            <ul className="text-gray-600 text-xs font-body mb-6 space-y-2 list-disc pl-5">
              <li>Once submitted, your application details cannot be edited.</li>
              <li>After submission, you will see your unique <b>Application Number</b> on the screen. Save this number for future reference.</li>
            </ul>

            <div className="flex items-start gap-3 mb-8 bg-gray-50 p-4 border border-gray-200 rounded-sm">
              <input 
                type="checkbox" id="terms" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 accent-corp-red cursor-pointer flex-shrink-0" 
              />
              <label htmlFor="terms" className="text-[11px] sm:text-xs text-gray-700 font-body leading-relaxed cursor-pointer">
                I acknowledge the security guidelines above and agree to the <a href="/internship-terms" target="_blank" className="text-corp-blue hover:underline font-bold">Internship Terms & Conditions</a> and <a href="/internship-privacy" target="_blank" className="text-corp-blue hover:underline font-bold">Privacy Policy</a>.
              </label>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 text-xs font-bold tracking-widest uppercase text-gray-600 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors">Go Back</button>
              <button 
                onClick={processFinalSubmission} disabled={!agreedToTerms}
                className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase rounded-sm transition-colors shadow-md ${agreedToTerms ? 'bg-corp-red hover:bg-corp-red-dark text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                Agree & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 border border-corp-red/40 bg-corp-red/10 rounded-sm backdrop-blur-sm">
            <span className="text-corp-red text-xs font-bold tracking-[0.25em] uppercase">Programme 2026–27</span>
          </div>
          <h1 className="font-display text-4xl lg:text-6xl font-black text-white leading-tight mb-8">Work. <span className="text-corp-red">Grow.</span> <span className="text-corp-gold">Lead.</span></h1>
          <div className="inline-flex bg-white/10 backdrop-blur-md p-1 rounded-sm border border-white/20">
            <button onClick={() => setActiveTab("apply")} className={`px-8 py-3 text-xs font-bold tracking-widest uppercase rounded-sm transition-all ${activeTab === "apply" ? "bg-white text-gray-900 shadow-sm" : "text-gray-300 hover:text-white"}`}>Submit Application</button>
            <button onClick={() => setActiveTab("status")} className={`px-8 py-3 text-xs font-bold tracking-widest uppercase rounded-sm transition-all ${activeTab === "status" ? "bg-white text-gray-900 shadow-sm" : "text-gray-300 hover:text-white"}`}>Check Status</button>
          </div>
        </div>

        {/* ─── TAB: STATUS TRACKER ─── */}
        {activeTab === "status" && (
           <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-sm p-8 lg:p-12 shadow-xl animate-fade-in">
             <h2 className="font-display text-3xl font-black text-gray-900 mb-2 text-center">Track Application</h2>
             <p className="text-gray-500 text-sm text-center mb-8">Enter your RDS Application ID to check your current recruitment status.</p>
             <form onSubmit={trackApplication} className="flex gap-4 mb-10">
               <input type="text" placeholder="e.g. RDS-2026-0001" required value={trackingId} onChange={(e) => setTrackingId(e.target.value)} className="flex-1 px-4 py-3 border border-gray-300 rounded-sm focus:border-corp-blue outline-none font-mono text-sm uppercase"/>
               <button type="submit" disabled={isSearching} className="px-8 bg-corp-blue hover:bg-corp-blue-mid text-white font-bold text-xs tracking-widest uppercase rounded-sm transition-colors shadow-sm">{isSearching ? "Searching..." : "Track"}</button>
             </form>
             {trackError && <div className="text-corp-red text-sm font-bold bg-red-50 border border-red-100 p-4 rounded-sm text-center">{trackError}</div>}
             {trackingStatus && (
               <div className="mt-12 pt-8 border-t border-gray-100">
                 <div className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-8 text-center">Application Timeline</div>
                 <div className="relative flex flex-col sm:flex-row justify-between items-center sm:items-start gap-8 sm:gap-0">
                   <div className="hidden sm:block absolute top-6 left-[10%] right-[10%] h-1 bg-gray-200 -z-10"></div>
                   <div className="flex flex-col items-center text-center relative w-full sm:w-1/4">
                     <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold mb-3 shadow-md border-4 border-white">1</div>
                     <div className="text-sm font-bold text-gray-900">Received</div><div className="text-[10px] text-gray-500 mt-1">Application Submitted</div>
                   </div>
                   <div className={`flex flex-col items-center text-center relative w-full sm:w-1/4 ${['Reviewed', 'Interviewing', 'Selected'].includes(trackingStatus) ? 'opacity-100' : 'opacity-40'}`}>
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-3 shadow-md border-4 border-white ${['Reviewed', 'Interviewing', 'Selected'].includes(trackingStatus) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                     <div className="text-sm font-bold text-gray-900">Under Review</div><div className="text-[10px] text-gray-500 mt-1">HR Screening</div>
                   </div>
                   <div className={`flex flex-col items-center text-center relative w-full sm:w-1/4 ${['Interviewing', 'Selected'].includes(trackingStatus) ? 'opacity-100' : 'opacity-40'}`}>
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-3 shadow-md border-4 border-white ${['Interviewing', 'Selected'].includes(trackingStatus) ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
                     <div className="text-sm font-bold text-gray-900">Interviewing</div><div className="text-[10px] text-gray-500 mt-1">Shortlisted</div>
                   </div>
                   <div className={`flex flex-col items-center text-center relative w-full sm:w-1/4 ${['Selected', 'Rejected'].includes(trackingStatus) ? 'opacity-100' : 'opacity-40'}`}>
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-3 shadow-md border-4 border-white ${trackingStatus === 'Selected' ? 'bg-corp-gold text-white' : trackingStatus === 'Rejected' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-500'}`}>4</div>
                     <div className="text-sm font-bold text-gray-900">{trackingStatus === 'Rejected' ? 'Not Selected' : 'Final Decision'}</div><div className="text-[10px] text-gray-500 mt-1">{trackingStatus === 'Selected' ? 'Offer Extended' : 'Process Closed'}</div>
                   </div>
                 </div>
               </div>
             )}
           </div>
        )}

        {/* ─── TAB: APPLICATION FORM ─── */}
        {activeTab === "apply" && (
          <div className="grid lg:grid-cols-2 gap-16 items-start animate-fade-in">
            {/* Tracks Sidebar */}
            <div>
              <h3 className="font-display text-2xl font-bold text-white mb-6">Available Tracks</h3>
              <div className="space-y-4 mb-10">
                <div className="p-5 bg-white/10 backdrop-blur-md border-l-4 border-corp-red shadow-sm rounded-r-sm"><h4 className="font-bold text-white text-sm tracking-widest uppercase mb-2">1 Month: Short Track</h4><p className="text-gray-300 text-sm">Orientation + guided live tasks + one focused mini project.</p></div>
                <div className="p-5 bg-white/10 backdrop-blur-md border-l-4 border-corp-gold shadow-sm rounded-r-sm"><h4 className="font-bold text-white text-sm tracking-widest uppercase mb-2">3 Months: Standard Track</h4><p className="text-gray-300 text-sm">Full involvement in your chosen role. Own a project from start to finish.</p></div>
                <div className="p-5 bg-gradient-to-r from-corp-blue-mid to-transparent border-l-4 border-blue-400 shadow-sm rounded-r-sm"><h4 className="font-bold text-white text-sm tracking-widest uppercase mb-2">6 Months: Advanced Track</h4><p className="text-gray-200 text-sm">Deep specialisation. Lead projects independently. Receives Portfolio Projects.</p></div>
              </div>
            </div>

            <div className="bg-[#f4f7fb] border border-gray-200 rounded-sm p-6 sm:p-8 shadow-xl relative">
              {sentAppId ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <div className="text-gray-900 font-black text-2xl mb-2">Application Received</div>
                  <p className="text-sm text-gray-500 mb-6">Save this ID to check your status later.</p>
                  
                  <div className="bg-white border border-gray-200 w-full p-6 rounded-sm mb-6 shadow-sm">
                    <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Your Application ID</div>
                    <div className="font-mono text-3xl font-bold text-corp-red tracking-wider mb-4">{sentAppId}</div>
                    
                    <div className="flex justify-center gap-3">
                      <button onClick={copyToClipboard} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold tracking-widest uppercase rounded transition-colors flex items-center gap-2">
                        {copied ? "✓ Copied" : "📋 Copy ID"}
                      </button>
                      <button onClick={shareAppId} className="px-4 py-2 bg-corp-blue hover:bg-corp-blue-mid text-white text-[10px] font-bold tracking-widest uppercase rounded transition-colors flex items-center gap-2">
                        📤 Share
                      </button>
                    </div>
                  </div>
                  <button onClick={() => {setSentAppId(null); setActiveTab("status");}} className="text-xs text-corp-blue font-bold tracking-widest uppercase hover:underline mt-4">Track Application Status →</button>
                </div>
              ) : !verifiedEmail ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                  <div className="text-gray-900 font-black text-xl mb-4 font-display">Secure Application</div>
                  <p className="text-gray-500 text-sm font-body mb-8">To prevent spam, please verify your email address to access the internship application form.</p>
                  <button onClick={handleGoogleVerify} className="w-full flex items-center justify-center gap-3 py-4 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm tracking-widest uppercase transition-colors rounded-sm shadow-sm">
                    Verify with Google
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInitialSubmit} className="space-y-6">
                  <div className="flex justify-between items-end border-b border-gray-200 pb-4 mb-6">
                    <div className="text-corp-blue font-black text-xl font-display uppercase tracking-wider">Application Form</div>
                    <div className="text-[10px] text-green-700 font-bold bg-green-100 px-2 py-1 rounded shadow-sm">✓ Verified</div>
                  </div>
                  {errorMsg && <div className="text-corp-red text-xs font-bold bg-red-50 border border-red-100 p-3 rounded-sm shadow-sm">{errorMsg}</div>}

                  {/* SECTION 1: CONTACT INFO */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase border-b border-gray-200 pb-1">1. Contact Details</h4>
                    <div><label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Verified Email</label><input type="text" disabled value={verifiedEmail} className="w-full px-3 py-2.5 border border-gray-200 bg-gray-100 text-gray-500 rounded-sm text-sm" /></div>
                    <div><label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Full Name *</label><input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue outline-none" /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Primary Phone *</label><input type="tel" required maxLength="10" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g,'') })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue outline-none" /></div>
                      <div><label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Alt Phone (Optional)</label><input type="tel" maxLength="10" value={form.altPhone} onChange={e => setForm({ ...form, altPhone: e.target.value.replace(/\D/g,'') })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue outline-none" /></div>
                    </div>
                  </div>

                  {/* SECTION 2: ACADEMICS */}
                  <div className="space-y-4 pt-4">
                    <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase border-b border-gray-200 pb-1">2. Academic Background</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="sm:col-span-2">
                        <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">University Name *</label>
                        <input type="text" required list="universities-list" placeholder="Search your university..." value={form.university} onChange={e => setForm({ ...form, university: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue outline-none" />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="flex items-center text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">
                          College / Institution Name *
                          <div className="relative group inline-block ml-2">
                            <span className="cursor-help text-gray-400 border border-gray-400 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">?</span>
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-gray-900 text-white text-[10px] p-2 rounded hidden group-hover:block z-10 normal-case tracking-normal">Enter the college name. If you study directly at the University campus, you can enter the University name again here.</div>
                          </div>
                        </label>
                        <input type="text" required placeholder="Type your specific college name..." value={form.college} onChange={e => setForm({ ...form, college: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue outline-none" />
                      </div>
                      
                      <div><label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Degree / Stream *</label><input type="text" required placeholder="e.g. B.Com, B.E., MBA..." value={form.stream} onChange={e => setForm({ ...form, stream: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue outline-none" /></div>
                      <div>
                        <label className="flex items-center text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">
                          Major / Specialization *
                          <div className="relative group inline-block ml-2">
                            <span className="cursor-help text-gray-400 border border-gray-400 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">?</span>
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-gray-900 text-white text-[10px] p-2 rounded hidden group-hover:block z-10 normal-case tracking-normal">If your degree is general and has no specific major, simply type 'None'.</div>
                          </div>
                        </label>
                        <input type="text" required placeholder="e.g. Finance, IT, None" value={form.major} onChange={e => setForm({ ...form, major: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue outline-none" />
                      </div>

                      <div>
                        <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Current Year of Study *</label>
                        <select value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-sm focus:border-corp-blue text-sm bg-white outline-none">
                          <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>5th Year</option><option>Final Year</option><option>Graduated</option>
                        </select>
                      </div>

                      <div><label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Batch / Year of Passing *</label><input type="text" required placeholder="e.g. 2024-2026" value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue outline-none" /></div>
                    </div>
                  </div>

                  {/* SECTION 3: PREFERENCES */}
                  <div className="space-y-4 pt-4">
                    <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase border-b border-gray-200 pb-1">3. Preferences</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Preferred Brand</label><select value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white"><option>MyTripRaja (Travel)</option><option>MarketerRaja (Marketing)</option></select></div>
                      <div><label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Duration</label><select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white"><option>1 Month</option><option>3 Months</option><option>6 Months</option></select></div>
                      <div className="sm:col-span-2"><label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Why do you want this internship? (Optional)</label><textarea rows="3" value={form.whyInternship} onChange={e => setForm({ ...form, whyInternship: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-sm resize-none" /></div>
                    </div>
                  </div>

                  {/* SECTION 4: ATTACHMENTS & LINKS (RESTORED!) */}
                  <div className="space-y-4 pt-4">
                    <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase border-b border-gray-200 pb-1">4. Attachments & Links</h4>
                    <ResumeUpload resumeFile={resumeFile} setResumeFile={setResumeFile} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">LinkedIn Profile (Optional)</label>
                        <input type="url" placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue outline-none" />
                      </div>
                      <div>
                        <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Portfolio / Project Link (Optional)</label>
                        <input type="url" placeholder="https://..." value={form.portfolio} onChange={e => setForm({ ...form, portfolio: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button type="submit" disabled={isSubmitting} className={`w-full py-4 font-bold text-sm tracking-widest uppercase rounded-sm shadow-xl transition-all duration-200 ${isSubmitting ? 'bg-gray-400 text-white cursor-wait' : 'bg-corp-red hover:bg-corp-red-dark text-white hover:-translate-y-1'}`}>
                      {isSubmitting ? 'Processing Application...' : 'Review & Submit'}
                    </button>
                    <p className="text-center text-[10px] text-gray-500 mt-4 font-bold tracking-widest uppercase">
                      Facing issues? Contact <a href="mailto:contact@rajadeepusooriya.com" className="text-corp-blue hover:underline">contact@rajadeepusooriya.com</a>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
