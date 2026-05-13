import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, doc, runTransaction } from "firebase/firestore";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import emailjs from '@emailjs/browser';
import ResumeUpload from "./ResumeUpload";

export default function InternshipPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  
  const [form, setForm] = useState({ 
    name: "", phone: "", altPhone: "", 
    collegeSelect: "", collegeManual: "", 
    streamSelect: "", streamManual: "", major: "",
    batch: "", year: "1st Year", 
    brand: "MyTripRaja", duration: "1 Month",
    linkedin: "", portfolio: "", whyInternship: ""
  });
  
  const [resumeFile, setResumeFile] = useState(null);
  const [verifiedEmail, setVerifiedEmail] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentAppId, setSentAppId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  
  // NEW: Confirmation Modal State
  const [showConfirm, setShowConfirm] = useState(false);

  const handleGoogleVerify = async () => {
    setErrorMsg("");
    try {
      const result = await signInWithPopup(auth, provider);
      setVerifiedEmail(result.user.email);
    } catch (error) { setErrorMsg("Verification failed. Please try again."); }
  };

  // Intercept the form submit to show the confirmation popup
  const handleInitialSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(form.phone)) { setErrorMsg("Please enter a valid 10-digit primary mobile number."); return; }
    if (!resumeFile) { setErrorMsg("Please upload your resume."); return; }
    
    // Show the "Cannot Edit" warning
    setShowConfirm(true);
  };

  // The actual submission logic after they click "Yes, Submit"
  const processFinalSubmission = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    
    try {
      // Resolve "Others" logic
      const finalCollege = form.collegeSelect === "Others" ? form.collegeManual : form.collegeSelect;
      const finalStream = form.streamSelect === "Others" ? form.streamManual : form.streamSelect;

      // 1. Generate ID
      const counterDocRef = doc(db, "counters", "applications");
      const newIdNum = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterDocRef);
        let nextNum = 1;
        if (!counterDoc.exists()) { transaction.set(counterDocRef, { count: 1 }); } 
        else { nextNum = counterDoc.data().count + 1; transaction.update(counterDocRef, { count: nextNum }); }
        return nextNum;
      });
      const uniqueId = "RDS-" + new Date().getFullYear() + "-" + String(newIdNum).padStart(4, '0');

      // 2. Cloudinary Upload
      const formData = new FormData();
      formData.append("file", resumeFile);
      formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const cloudData = await cloudRes.json();
      if (!cloudRes.ok) throw new Error(cloudData.error.message);
      const secureDownloadUrl = cloudData.secure_url;

      // 3. Save to Firestore
      await addDoc(collection(db, "applications"), {
        ...form,
        college: finalCollege, // Save the resolved college
        stream: finalStream,   // Save the resolved stream
        email: verifiedEmail,
        applicationId: uniqueId,
        resumeUrl: secureDownloadUrl, 
        submittedAt: serverTimestamp(),
      });

      // 4. Send Email
      try {
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID, 
          { to_name: form.name, to_email: verifiedEmail, application_id: uniqueId, brand: form.brand, role: "Internship Application" },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY 
        );
      } catch (emailError) { console.error("Email failed", emailError); }

      setSentAppId(uniqueId);
      signOut(auth); 
    } catch (error) {
      console.error(error);
      setErrorMsg("There was an error processing your application. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen pt-32 pb-24 relative">
      {/* FINAL CONFIRMATION POPUP */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="bg-white p-8 rounded-sm shadow-2xl max-w-md w-full border-t-4 border-corp-red animate-fade-in">
            <h3 className="font-display text-2xl font-black text-gray-900 mb-2">Final Confirmation</h3>
            <p className="text-gray-600 text-sm font-body mb-6">Are you sure you want to submit your application? <b>Once submitted, your details cannot be edited.</b></p>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 text-sm font-bold tracking-widest uppercase text-gray-600 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors">Go Back</button>
              <button onClick={processFinalSubmission} className="flex-1 py-3 text-sm font-bold tracking-widest uppercase text-white bg-corp-red hover:bg-corp-red-dark rounded-sm transition-colors shadow-md">Yes, Submit</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 border border-corp-red/40 bg-corp-red/10 rounded-sm backdrop-blur-sm">
            <span className="text-corp-red text-xs font-bold tracking-[0.25em] uppercase">Programme 2026–27</span>
          </div>
          <h1 className="font-display text-4xl lg:text-6xl font-black text-white leading-tight mb-6">
            Work. <span className="text-corp-red">Grow.</span> <span className="text-corp-gold">Lead.</span>
          </h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <h3 className="font-display text-2xl font-bold text-white mb-6">Available Tracks</h3>
            <div className="space-y-4 mb-10">
              <div className="p-5 bg-white/10 backdrop-blur-md border-l-4 border-corp-red shadow-sm rounded-r-sm">
                <h4 className="font-bold text-white text-sm tracking-widest uppercase mb-2">1 Month: Short Track</h4>
                <p className="text-gray-300 text-sm">Orientation + guided live tasks + one focused mini project. Receives Internship Certificate.</p>
              </div>
              <div className="p-5 bg-white/10 backdrop-blur-md border-l-4 border-corp-gold shadow-sm rounded-r-sm">
                <h4 className="font-bold text-white text-sm tracking-widest uppercase mb-2">3 Months: Standard Track</h4>
                <p className="text-gray-300 text-sm">Full involvement in your chosen role. Own a project from start to finish. Receives Certificate + Live Project Experience Letter.</p>
              </div>
              {/* FIX: Changed 6-Month Track color to stand out from the background */}
              <div className="p-5 bg-gradient-to-r from-corp-blue-mid to-transparent border-l-4 border-blue-400 shadow-sm rounded-r-sm">
                <h4 className="font-bold text-white text-sm tracking-widest uppercase mb-2">6 Months: Advanced Track</h4>
                <p className="text-gray-200 text-sm">Deep specialisation. Lead projects independently. Receives Certificate + Letter + Portfolio Projects.</p>
              </div>
            </div>
          </div>

          {/* FIX: Changed form background to a premium soft slate color */}
          <div className="bg-[#f4f7fb] border border-gray-200 rounded-sm p-6 sm:p-8 shadow-xl relative">
            {sentAppId ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <div className="text-gray-900 font-black text-2xl mb-2">Application Received</div>
                <div className="bg-white border border-gray-200 w-full p-6 rounded-sm mb-6 shadow-sm">
                  <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Your Application ID</div>
                  <div className="font-mono text-2xl font-bold text-corp-red">{sentAppId}</div>
                </div>
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
                  
                  <div>
                    <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Verified Email</label>
                    <input type="text" disabled value={verifiedEmail} className="w-full px-3 py-2.5 border border-gray-200 bg-gray-100 text-gray-500 rounded-sm text-sm" />
                  </div>
                  <div>
                    <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Full Name *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue text-sm outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Primary Phone *</label>
                      <input type="tel" required maxLength="10" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g,'') })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue text-sm outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Alt Phone (Optional)</label>
                      <input type="tel" maxLength="10" value={form.altPhone} onChange={e => setForm({ ...form, altPhone: e.target.value.replace(/\D/g,'') })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue text-sm outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: ACADEMICS */}
                <div className="space-y-4 pt-4">
                  <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase border-b border-gray-200 pb-1">2. Academic Background</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">College Name & Location *</label>
                      <select required value={form.collegeSelect} onChange={e => setForm({ ...form, collegeSelect: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue text-sm outline-none mb-2">
                        <option value="">Select your institution...</option>
                        <option value="Sri Krishna Arts and Science College (SKASC)">Sri Krishna Arts and Science College (SKASC)</option>
                        <option value="PSG College of Arts and Science">PSG College of Arts and Science</option>
                        <option value="Kumaraguru College of Technology (KCT)">Kumaraguru College of Technology (KCT)</option>
                        <option value="Hindusthan College of Arts and Science">Hindusthan College of Arts and Science</option>
                        <option value="Others">Others (Type Manually)</option>
                      </select>
                      {form.collegeSelect === "Others" && (
                        <input type="text" required placeholder="Type your college name and city..." value={form.collegeManual} onChange={e => setForm({ ...form, collegeManual: e.target.value })} className="w-full px-3 py-2.5 border border-corp-blue bg-blue-50 rounded-sm focus:ring-1 focus:ring-corp-blue text-sm outline-none transition-all" />
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Degree / Stream *</label>
                      <select required value={form.streamSelect} onChange={e => setForm({ ...form, streamSelect: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue text-sm outline-none mb-2">
                        <option value="">Select stream...</option>
                        <option value="M.Com">M.Com</option>
                        <option value="B.Com">B.Com</option>
                        <option value="MBA">MBA</option>
                        <option value="BBA">BBA</option>
                        <option value="B.E. / B.Tech">B.E. / B.Tech</option>
                        <option value="Others">Others (Type Manually)</option>
                      </select>
                      {form.streamSelect === "Others" && (
                        <input type="text" required placeholder="e.g. B.Sc Computer Science" value={form.streamManual} onChange={e => setForm({ ...form, streamManual: e.target.value })} className="w-full px-3 py-2.5 border border-corp-blue bg-blue-50 rounded-sm focus:ring-1 focus:ring-corp-blue text-sm outline-none transition-all" />
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Major / Specialization *</label>
                      <input type="text" required placeholder="e.g. General, CA, Finance, IT" value={form.major} onChange={e => setForm({ ...form, major: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue text-sm outline-none transition-all" />
                    </div>

                    <div>
                      <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Batch / Year of Passing *</label>
                      <input type="text" required placeholder="e.g. 2024-2026" value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue text-sm outline-none transition-all" />
                    </div>

                    <div>
                      <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Current Year of Study *</label>
                      <select value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-sm focus:border-corp-blue text-sm bg-white outline-none">
                        <option>1st Year</option><option>2nd Year</option><option>3rd Year</option>
                        <option>4th Year</option><option>5th Year</option>
                        <option>Final Year</option><option>Graduated</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: INTERNSHIP PREFERENCES */}
                <div className="space-y-4 pt-4">
                  <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase border-b border-gray-200 pb-1">3. Internship Preferences</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Preferred Brand</label>
                      <select value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-sm focus:border-corp-blue text-sm bg-white outline-none">
                        <option>MyTripRaja (Travel)</option><option>MarketerRaja (Marketing)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Duration</label>
                      <select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-sm focus:border-corp-blue text-sm bg-white outline-none">
                        <option>1 Month</option><option>3 Months</option><option>6 Months</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Why do you want this internship? (Optional)</label>
                      <textarea rows="3" placeholder="Tell us briefly about your goals..." value={form.whyInternship} onChange={e => setForm({ ...form, whyInternship: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue text-sm outline-none transition-all resize-none" />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: ATTACHMENTS */}
                <div className="space-y-4 pt-4">
                  <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase border-b border-gray-200 pb-1">4. Attachments & Links</h4>
                  <ResumeUpload resumeFile={resumeFile} setResumeFile={setResumeFile} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">LinkedIn Profile (Optional)</label>
                      <input type="url" placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue text-sm outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Portfolio / Project Link (Optional)</label>
                      <input type="url" placeholder="https://..." value={form.portfolio} onChange={e => setForm({ ...form, portfolio: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue text-sm outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button type="submit" disabled={isSubmitting} className={`w-full py-4 font-bold text-sm tracking-widest uppercase transition-all duration-200 rounded-sm shadow-xl ${isSubmitting ? 'bg-gray-400 text-white cursor-wait' : 'bg-corp-red hover:bg-corp-red-dark text-white hover:-translate-y-1'}`}>
                    {isSubmitting ? 'Processing Application...' : 'Submit Application'}
                  </button>
                  <p className="text-center text-[10px] text-gray-500 mt-4 font-bold tracking-widest uppercase">
                    Facing issues? Contact <a href="mailto:contact@rajadeepusooriya.com" className="text-corp-blue hover:underline">contact@rajadeepusooriya.com</a>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
