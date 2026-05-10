import { useState, useEffect, useRef } from "react";
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, signOut } from "firebase/auth";

// ─── Utility ─────────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar({ view, setView }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = ["About", "Values", "Brands", "Internships", "Contact"];

  const handleNavClick = (e, l) => {
    e.preventDefault();
    if (l === "Internships") {
      setView("internships");
      window.scrollTo(0,0);
    } else if (view !== "home") {
      setView("home");
      setTimeout(() => document.getElementById(l.toLowerCase())?.scrollIntoView({ behavior: "smooth" }), 100);
    } else {
      document.getElementById(l.toLowerCase())?.scrollIntoView({ behavior: "smooth" });
    }
    setOpen(false);
  };

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled || view !== "home" ? "bg-corp-blue shadow-xl shadow-black/50" : "bg-transparent"}`}>
      <div className="absolute top-0 w-full h-1 bg-corp-red" />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16 lg:h-20 mt-1">
        <button onClick={() => { setView("home"); window.scrollTo(0,0); }} className="flex items-center gap-3 group text-left">
          <div className="w-9 h-9 rounded bg-corp-red flex items-center justify-center text-white font-black text-sm tracking-tight leading-none select-none">
            RDS
          </div>
          <div className="hidden sm:block leading-tight">
            <span className="block text-white font-bold text-sm tracking-widest uppercase">Raja Deepu Sooriya</span>
            <span className="block text-corp-gold text-[10px] tracking-[0.2em] uppercase mt-0.5">Private Limited</span>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <button key={l} onClick={(e) => handleNavClick(e, l)}
              className="text-gray-300 hover:text-white text-sm font-medium tracking-widest uppercase transition-colors duration-200 relative group">
              {l}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-corp-gold group-hover:w-full transition-all duration-300" />
            </button>
          ))}
          <button onClick={(e) => handleNavClick(e, "Contact")}
            className="ml-4 px-5 py-2 bg-corp-red hover:bg-corp-red-dark text-white text-xs font-bold tracking-widest uppercase transition-colors duration-200 rounded-sm">
            Get In Touch
          </button>
        </nav>

        <button className="md:hidden text-white p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          <div className="w-5 h-px bg-white mb-1.5 transition-all" style={{ transform: open ? "rotate(45deg) translate(2px,6px)" : "" }} />
          <div className="w-5 h-px bg-white mb-1.5 transition-all" style={{ opacity: open ? 0 : 1 }} />
          <div className="w-5 h-px bg-white transition-all" style={{ transform: open ? "rotate(-45deg) translate(2px,-6px)" : "" }} />
        </button>
      </div>

      <div className={`md:hidden bg-corp-blue border-t border-white/10 overflow-hidden transition-all duration-300 ${open ? "max-h-60" : "max-h-0"}`}>
        {links.map(l => (
          <button key={l} onClick={(e) => handleNavClick(e, l)}
            className="block w-full text-left px-6 py-3 text-gray-300 hover:text-white text-sm font-medium tracking-widest uppercase border-b border-white/5">
            {l}
          </button>
        ))}
      </div>
    </header>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-corp-blue text-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-[10%] right-[15%] w-[500px] h-[500px] bg-corp-red/10 rounded-full blur-[120px] animate-blob-reverse" />
        <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-corp-gold/10 rounded-full blur-[90px] animate-blob" style={{ animationDelay: '2s' }} />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 pt-28 pb-20 flex flex-col items-center">
        <h1 className="font-display text-5xl sm:text-6xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight mb-8">
          Work. Grow.<br />
          <span className="text-corp-gold">Lead.</span>
        </h1>

        <p className="text-gray-300 text-lg sm:text-xl leading-relaxed max-w-2xl mb-12 font-body font-light">
          Raja Deepu Sooriya Private Limited is a dynamic, innovation-driven enterprise committed to delivering exceptional value across diverse business sectors — founded on trust, integrity, and shared vision.
        </p>

        <div className="flex flex-wrap justify-center gap-5">
          <a href="#about" className="px-8 py-4 bg-corp-red hover:bg-corp-red-dark text-white font-bold text-sm tracking-widest uppercase transition-all duration-200 rounded-sm shadow-xl shadow-corp-red/20">
            Discover Us
          </a>
          <a href="#brands" className="px-8 py-4 border border-white/20 hover:border-corp-gold bg-white/5 backdrop-blur-sm text-white font-bold text-sm tracking-widest uppercase transition-all duration-200 rounded-sm">
            Our Brands
          </a>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-bounce">
        <div className="w-px h-12 bg-gradient-to-b from-white/0 to-white/40" />
        <span className="text-white/40 text-[10px] tracking-widest uppercase">Scroll</span>
      </div>
    </section>
  );
}

// ─── ABOUT ────────────────────────────────────────────────────────────────────
function About({ setView }) {
  const [ref, visible] = useInView();
  
  const directors = [
    { id: "raja", initial: "R", name: "Raja", role: "Director & Co-Founder", desc: "Visionary leader driving corporate strategy.", color: "bg-corp-blue" },
    { id: "deepu", initial: "D", name: "Deepu", role: "Director & Co-Founder", desc: "Operations & financial specialist ensuring process excellence.", color: "bg-corp-red" },
    { id: "sooriya", initial: "S", name: "Sooriya", role: "Director & Co-Founder", desc: "Technology champion building digital capabilities.", color: "bg-corp-blue-mid" },
  ];

  return (
    <section id="about" className="py-24 lg:py-32 bg-corp-offwhite">
      <div ref={ref} className={`max-w-7xl mx-auto px-6 lg:px-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-corp-red" />
          <span className="text-corp-red text-xs font-bold tracking-[0.25em] uppercase">About Us</span>
        </div>
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-black text-gray-900 leading-tight mb-6">
              A Partnership Built on<br /><span className="text-corp-red">Shared Vision</span>
            </h2>
            <p className="text-gray-600 text-base leading-relaxed mb-5 font-body">
              Raja Deepu Sooriya Private Limited embodies the combined ambition and expertise of three co-founders whose complementary strengths form the backbone of the company.
            </p>
            <p className="text-gray-600 text-base leading-relaxed mb-8 font-body">
              Headquartered in Sankagiri, Tamil Nadu, the company operates with a commitment to transparency, corporate governance, and long-term value creation.
            </p>
            <button onClick={() => { setView("about-more"); window.scrollTo(0,0); }}
              className="px-6 py-3 border-2 border-corp-blue text-corp-blue font-bold text-xs tracking-widest uppercase hover:bg-corp-blue hover:text-white transition-colors duration-300 rounded-sm">
              Know More About Us
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="text-gray-900 font-bold text-sm tracking-widest uppercase mb-6 flex items-center justify-between">
              <span>Board of Directors</span>
              <span className="text-[10px] text-gray-400 font-normal normal-case">Click profile to view details</span>
            </div>
            {directors.map((d) => (
              <button key={d.name} onClick={() => { setView(`director-${d.id}`); window.scrollTo(0,0); }}
                className="w-full text-left flex gap-5 p-5 bg-white border border-gray-200 rounded-sm hover:shadow-lg hover:border-corp-gold hover:-translate-y-1 transition-all duration-300 group">
                <div className={`w-12 h-12 flex-shrink-0 rounded-sm flex items-center justify-center text-white font-black text-lg ${d.color}`}>
                  {d.initial}
                </div>
                <div>
                  <div className="text-gray-900 font-black text-base group-hover:text-corp-red transition-colors">{d.name}</div>
                  <div className="text-corp-gold text-xs font-bold tracking-widest uppercase mb-1">{d.role}</div>
                  <p className="text-gray-500 text-sm leading-relaxed font-body">{d.desc}</p>
                </div>
                <div className="ml-auto self-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 text-corp-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CORE VALUES ────────────────────────────────────────────────
function CoreValues() {
  const [ref, visible] = useInView();
  const values = [
    { title: "Integrity", desc: "We conduct our business with the highest standards of professional behavior and ethics. Transparency is at the core of our operations." },
    { title: "Innovation", desc: "We continuously seek new, digital-first approaches to solve problems and create value in traditional markets." },
    { title: "Sustainability", desc: "We are committed to long-term thinking, ensuring our growth strategies are environmentally conscious and economically sound." },
    { title: "Client Success", desc: "Our brands are built around the success and satisfaction of the clients and customers we serve." },
  ];

  return (
    <section id="values" className="py-24 bg-white">
      <div ref={ref} className={`max-w-7xl mx-auto px-6 lg:px-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-px bg-corp-red" />
            <span className="text-corp-red text-xs font-bold tracking-[0.25em] uppercase">Core Values</span>
            <div className="w-8 h-px bg-corp-red" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-gray-900">What Drives Us Forward</h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((v, i) => (
            <div key={v.title} className="p-8 bg-corp-offwhite border border-gray-100 rounded-sm hover:border-corp-gold/50 transition-colors duration-300">
              <div className="text-corp-gold font-display text-4xl font-black mb-4 opacity-30">0{i + 1}</div>
              <h3 className="text-gray-900 font-bold text-lg mb-3">{v.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed font-body">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── BRANDS ─────────────────────────────────────────────────────────────────
function Brands() {
  const [ref, visible] = useInView();

  return (
    <section id="brands" className="py-24 lg:py-32 bg-corp-blue relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="dot" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="white" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#dot)" />
        </svg>
      </div>

      <div ref={ref} className={`relative max-w-7xl mx-auto px-6 lg:px-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-corp-gold" />
          <span className="text-corp-gold text-xs font-bold tracking-[0.25em] uppercase">Our Enterprise</span>
        </div>
        <div className="mb-16">
          <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-black text-white leading-tight">
            Operating Brands
          </h2>
          <p className="text-gray-400 text-base leading-relaxed mt-4 max-w-2xl font-body">
            Raja Deepu Sooriya Private Limited manages and scales specialized brands across multiple business sectors to deliver focused, high-quality services.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="group bg-white/5 border border-white/10 p-10 rounded-sm hover:border-corp-red transition-all duration-500 backdrop-blur-sm">
            <div className="text-corp-gold text-xs font-bold tracking-widest uppercase mb-4">Travel & Tourism</div>
            <h3 className="font-display text-3xl text-white font-bold mb-4">MyTripRaja</h3>
            <p className="text-gray-400 leading-relaxed mb-8">
              A comprehensive online travel and tourism platform. We provide seamless booking experiences, curated tour packages, destination research, and end-to-end travel management across India and beyond.
            </p>
            <a href="https://www.mytripraja.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white font-bold text-xs tracking-widest uppercase pb-1 border-b border-corp-red hover:text-corp-red transition-colors">
              Visit Website
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </a>
          </div>

          <div className="group bg-white/5 border border-white/10 p-10 rounded-sm hover:border-corp-red transition-all duration-500 backdrop-blur-sm">
            <div className="text-corp-gold text-xs font-bold tracking-widest uppercase mb-4">Digital Agency</div>
            <h3 className="font-display text-3xl text-white font-bold mb-4">MarketerRaja</h3>
            <p className="text-gray-400 leading-relaxed mb-8">
              A full-service digital marketing agency dedicated to brand growth. We specialize in search engine optimization, targeted ad campaigns, social media management, and strategic brand positioning.
            </p>
            <a href="https://marketerraja.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white font-bold text-xs tracking-widest uppercase pb-1 border-b border-corp-red hover:text-corp-red transition-colors">
              Visit Website
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CONTACT ──────────────────────────────────────────────────────────────────
function Contact() {
  const [ref, visible] = useInView();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handle = (e) => { e.preventDefault(); setSent(true); setForm({ name: "", email: "", message: "" }); };

  return (
    <section id="contact" className="py-24 lg:py-32 bg-corp-offwhite">
      <div ref={ref} className={`max-w-7xl mx-auto px-6 lg:px-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <div className="flex items-center gap-3 mb-4"><div className="w-8 h-px bg-corp-red" /><span className="text-corp-red text-xs font-bold tracking-[0.25em] uppercase">Contact Us</span></div>
            <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-black text-gray-900 leading-tight mb-6">Let's Start a<br /><span className="text-corp-red">Conversation</span></h2>
            
            <div className="space-y-8 mt-12 border-l-2 border-corp-red/20 pl-6">
              {[
                ["REGISTERED OFFICE", "17/1 DS Apartment, Tiruchengode Road, Sankagiri — 637301, Tamil Nadu"],
                ["CONTACT NUMBER", "+91 8098889088"],
                ["CORPORATE IDENTITY NUMBER", "U79120TZ2025PTC034817"],
                ["GSTIN", "33AAOCR6737N1ZN"],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-gray-900 font-bold text-xs tracking-widest uppercase mb-1.5">{label}</div>
                  <div className="text-gray-600 text-sm font-mono leading-relaxed">{value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-sm p-8 shadow-sm">
            {sent ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-gray-900 font-black text-xl mb-2">Message Received</div>
                <p className="text-gray-500 text-sm font-body">Thank you for reaching out. Our team will contact you shortly.</p>
                <button onClick={() => setSent(false)} className="mt-6 text-corp-red text-sm font-bold tracking-widest uppercase border-b border-corp-red pb-1">Send Another</button>
              </div>
            ) : (
              <form onSubmit={handle} className="space-y-6">
                <div className="text-gray-900 font-black text-lg mb-6 font-display">Send Us an Enquiry</div>
                {["name", "email"].map(field => (
                  <div key={field}>
                    <label className="block text-gray-900 text-xs font-bold tracking-widest uppercase mb-2">{field}</label>
                    <input type={field === "email" ? "email" : "text"} required value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue transition-all font-body bg-white" />
                  </div>
                ))}
                <div>
                  <label className="block text-gray-900 text-xs font-bold tracking-widest uppercase mb-2">Message</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue transition-all resize-none font-body bg-white" />
                </div>
                <button type="submit" className="w-full py-4 bg-corp-red hover:bg-corp-red-dark text-white font-bold text-sm tracking-widest uppercase transition-colors duration-200 rounded-sm shadow-md">Submit Details</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── INTERNSHIP PAGE (UPDATED WITH AUTH & SPAM PREVENTION) ───────────────────
function InternshipPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [form, setForm] = useState({ name: "", phone: "", altPhone: "", college: "", stream: "", year: "1st Year", brand: "MyTripRaja", role: "", duration: "1 Month" });
  
  // New States for Security
  const [verifiedEmail, setVerifiedEmail] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentAppId, setSentAppId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGoogleVerify = async () => {
    setErrorMsg("");
    try {
      const result = await signInWithPopup(auth, provider);
      setVerifiedEmail(result.user.email);
    } catch (error) {
      console.error("Verification failed", error);
      setErrorMsg("Verification failed. Please try again.");
    }
  };

  const handle = async (e) => { 
    e.preventDefault(); 
    setErrorMsg("");
    
    // Strict Phone Validation (Exactly 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(form.phone)) {
      setErrorMsg("Please enter a valid 10-digit primary mobile number.");
      return;
    }
    if (form.altPhone && !phoneRegex.test(form.altPhone)) {
      setErrorMsg("Secondary mobile number must be 10 digits if provided.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Spam Check: Has this Email or Phone already been used?
      const checkRef = collection(db, "applications");
      const emailQuery = await getDocs(query(checkRef, where("email", "==", verifiedEmail)));
      const phoneQuery = await getDocs(query(checkRef, where("phone", "==", form.phone)));

      if (!emailQuery.empty) {
        setErrorMsg("An application with this Gmail account has already been submitted.");
        setIsSubmitting(false);
        return;
      }
      if (!phoneQuery.empty) {
        setErrorMsg("An application with this primary phone number already exists.");
        setIsSubmitting(false);
        return;
      }

      // Generate Unique Application Number (e.g., RDS-2026-4921)
      const uniqueId = "RDS-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);

      // Save to Database
      await addDoc(collection(db, "applications"), {
        ...form,
        email: verifiedEmail,
        applicationId: uniqueId,
        submittedAt: serverTimestamp(),
      });
      
      setSentAppId(uniqueId);
      // We sign them out so the next person using the computer doesn't use their email
      signOut(auth); 

    } catch (error) {
      console.error("Error adding document: ", error);
      setErrorMsg("There was an error submitting your application. Please check your connection and try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-corp-offwhite pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 border border-corp-red/40 bg-corp-red/10 rounded-sm">
            <span className="text-corp-red text-xs font-bold tracking-[0.25em] uppercase">Programme 2026–27</span>
          </div>
          <h1 className="font-display text-4xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
            Work. <span className="text-corp-red">Grow.</span> <span className="text-corp-gold">Lead.</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto font-body">
            Real work. Real clients. Real impact. Join our enterprise and build hands-on skills across Travel Technology & Digital Marketing.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          <div>
            <h3 className="font-display text-2xl font-bold text-gray-900 mb-6">Available Tracks</h3>
            <div className="space-y-4 mb-10">
              <div className="p-5 bg-white border-l-4 border-corp-red shadow-sm">
                <h4 className="font-bold text-gray-900 text-sm tracking-widest uppercase mb-2">1 Month: Short Track</h4>
                <p className="text-gray-600 text-sm">Orientation + guided live tasks + one focused mini project. Receives Internship Certificate.</p>
              </div>
              <div className="p-5 bg-white border-l-4 border-corp-gold shadow-sm">
                <h4 className="font-bold text-gray-900 text-sm tracking-widest uppercase mb-2">3 Months: Standard Track</h4>
                <p className="text-gray-600 text-sm">Full involvement in your chosen role. Own a project from start to finish. Receives Certificate + Live Project Experience Letter.</p>
              </div>
              <div className="p-5 bg-corp-blue border-l-4 border-corp-red shadow-sm">
                <h4 className="font-bold text-white text-sm tracking-widest uppercase mb-2">6 Months: Advanced Track</h4>
                <p className="text-gray-300 text-sm">Deep specialisation. Lead projects independently. Receives Certificate + Letter + Portfolio Projects.</p>
              </div>
            </div>

            <h3 className="font-display text-2xl font-bold text-gray-900 mb-6">Eligibility & Mode</h3>
            <div className="p-6 bg-white border border-gray-200 rounded-sm mb-10">
              <p className="text-gray-600 text-sm mb-4"><strong>Streams:</strong> Any stream welcome (BBA, B.Com, B.Tech, Arts, Diploma, etc.). No prior experience required.</p>
              <p className="text-gray-600 text-sm"><strong>Work Mode:</strong> Offline (In-Office) at our Sankagiri Headquarters to ensure maximum learning and real-time mentorship.</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-sm p-8 shadow-sm relative">
            
            {/* SUCCESS SCREEN */}
            {sentAppId ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <div className="text-gray-900 font-black text-2xl mb-2">Application Received</div>
                <p className="text-gray-500 text-base font-body mb-6">Thank you for applying. Please save your application number below.</p>
                
                <div className="bg-gray-50 border border-gray-200 w-full p-6 rounded-sm mb-6">
                  <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Your Application ID</div>
                  <div className="font-mono text-2xl font-bold text-corp-red">{sentAppId}</div>
                </div>
                
                <p className="text-xs text-gray-400">Our HR team will review your details and contact you shortly.</p>
              </div>

            // VERIFICATION SCREEN (Before Form)
            ) : !verifiedEmail ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="text-gray-900 font-black text-xl mb-4 font-display">Secure Application</div>
                <p className="text-gray-500 text-sm font-body mb-8">To prevent spam, please verify your email address to access the internship application form.</p>
                
                {errorMsg && <div className="text-corp-red text-xs font-bold mb-4 bg-red-50 p-2 rounded w-full">{errorMsg}</div>}
                
                <button onClick={handleGoogleVerify} className="w-full flex items-center justify-center gap-3 py-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-sm tracking-widest uppercase transition-colors rounded-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /><path fill="none" d="M1 1h22v22H1z" /></svg>
                  Verify with Google
                </button>
              </div>

            // ACTUAL FORM
            ) : (
              <form onSubmit={handle} className="space-y-5">
                <div className="flex justify-between items-end border-b border-gray-100 pb-4 mb-6">
                  <div className="text-gray-900 font-black text-xl font-display">Internship Application</div>
                  <div className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded">✓ Verified</div>
                </div>
                
                {errorMsg && <div className="text-corp-red text-xs font-bold bg-red-50 p-3 rounded-sm">{errorMsg}</div>}

                <div>
                  <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Verified Email</label>
                  <input type="text" disabled value={verifiedEmail} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-sm text-sm cursor-not-allowed" />
                </div>

                <div>
                  <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Full Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Primary Phone <span className="text-corp-red">*</span></label>
                    <input type="tel" required placeholder="10 Digits" maxLength="10" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g,'') })} className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue text-sm" />
                  </div>
                  <div>
                    <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Alt Phone (Optional)</label>
                    <input type="tel" placeholder="10 Digits" maxLength="10" value={form.altPhone} onChange={e => setForm({ ...form, altPhone: e.target.value.replace(/\D/g,'') })} className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">College Name & Location</label>
                  <input type="text" required value={form.college} onChange={e => setForm({ ...form, college: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Course / Stream</label>
                    <input type="text" required placeholder="e.g. M.Com, BBA" value={form.stream} onChange={e => setForm({ ...form, stream: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue text-sm" />
                  </div>
                  <div>
                    <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Year of Study</label>
                    <select value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue text-sm bg-white">
                      <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>Final Year</option><option>Graduated</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Preferred Brand</label>
                    <select value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue text-sm bg-white">
                      <option>MyTripRaja (Travel)</option>
                      <option>MarketerRaja (Marketing)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Duration</label>
                    <select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue text-sm bg-white">
                      <option>1 Month</option><option>3 Months</option><option>6 Months</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-900 text-[10px] font-bold tracking-widest uppercase mb-2">Preferred Role (Optional)</label>
                  <input type="text" placeholder="e.g. Social Media, Travel Sales" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue text-sm" />
                </div>

                <button type="submit" disabled={isSubmitting} className={`w-full py-4 mt-4 font-bold text-sm tracking-widest uppercase transition-colors duration-200 rounded-sm shadow-md ${isSubmitting ? 'bg-gray-400 text-white cursor-wait' : 'bg-corp-red hover:bg-corp-red-dark text-white'}`}>
                  {isSubmitting ? 'Processing...' : 'Submit Application'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── DETAILED PAGES (About & Directors) ──────────────────────────────────────
function AboutMorePage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen bg-corp-offwhite pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        <div className="mb-8">
          <div className="w-12 h-1 bg-corp-red mb-6" />
          <h1 className="font-display text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
            Our History & <br/><span className="text-corp-red">Corporate Vision</span>
          </h1>
        </div>
        
        <div className="prose prose-lg max-w-none text-gray-700 font-body leading-relaxed space-y-8">
          <p className="text-xl text-gray-900 font-medium">
            Raja Deepu Sooriya Private Limited was founded in 2025 upon a simple yet powerful premise: combining diverse expertise to create unified, high-performing business solutions.
          </p>
          <p>
            Rooted in Sankagiri, Tamil Nadu, our enterprise is the culmination of a deep-seated partnership between three driven founders. We recognized a growing gap in the market for reliable, transparent, and digitally-forward corporate services, specifically tailored to travel, tourism, and brand marketing.
          </p>
          <div className="p-8 bg-white border-l-4 border-corp-gold shadow-sm my-10">
            <h3 className="font-display text-2xl font-bold text-gray-900 mb-3">The Corporate Mandate</h3>
            <p className="m-0">
              Our mandate is to operate with uncompromising integrity. Whether we are designing international travel packages through MyTripRaja, or scaling local businesses through MarketerRaja, our commitment to corporate governance, financial transparency, and measurable results remains absolute.
            </p>
          </div>
          <p>
            Looking to the future, we are actively expanding our digital footprint and establishing new operational milestones. Our goal is not just to participate in the industries we operate within, but to redefine their standard of service.
          </p>
        </div>
      </div>
    </div>
  );
}

function DirectorPage({ id }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const directorsData = {
    raja: {
      fullName: "Raja",
      role: "Director & Co-Founder",
      bio: "As a founding pillar of the organization, Raja leads the corporate strategy and high-level stakeholder relationship management. With a visionary approach to business expansion, he ensures that the company's long-term objectives align with emerging market trends. His leadership drives the foundational growth of our operating brands, ensuring operational scalability and robust partnership networks.",
      color: "bg-corp-blue"
    },
    deepu: {
      fullName: "Deepadharsan Rajavel",
      role: "Director & Co-Founder",
      bio: "Deepadharsan holds a Master of Commerce and brings deep expertise in corporate governance, financial reporting, and strict GST compliance to the board. With a strong professional interest in sustainable business development and green accounting practices, he ensures that Raja Deepu Sooriya Private Limited operates on a financially sound, transparent, and forward-looking foundation. His operational oversight is critical to the seamless delivery of our digital and travel services.",
      color: "bg-corp-red"
    },
    sooriya: {
      fullName: "Balasooriya",
      role: "Director & Co-Founder",
      bio: "Balasooriya is the technology and innovation champion of the enterprise. He oversees the digital architecture that powers our brands, ensuring that platforms like MyTripRaja and MarketerRaja are equipped with cutting-edge tools and seamless user experiences. His dedication to digital transformation provides the company with its competitive edge in a rapidly evolving market.",
      color: "bg-corp-blue-mid"
    }
  };

  const data = directorsData[id];

  return (
    <div className="min-h-screen bg-corp-offwhite pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className={`w-32 h-32 md:w-48 md:h-48 flex-shrink-0 rounded-sm shadow-lg flex items-center justify-center text-white font-display text-5xl font-black ${data.color}`}>
            {data.fullName.charAt(0)}
          </div>
          <div>
            <div className="text-corp-red text-sm font-bold tracking-widest uppercase mb-2">{data.role}</div>
            <h1 className="font-display text-4xl lg:text-5xl font-black text-gray-900 mb-6">{data.fullName}</h1>
            <div className="w-12 h-1 bg-corp-gold mb-8" />
            <p className="text-gray-700 text-lg leading-relaxed font-body">
              {data.bio}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LEGAL PAGES ──────────────────────────────────────────
function LegalPage({ title, content }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen bg-corp-offwhite pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        <h1 className="font-display text-4xl font-black text-gray-900 mb-8">{title}</h1>
        <div className="prose max-w-none text-gray-700 font-body leading-relaxed space-y-6">
          {content}
        </div>
      </div>
    </div>
  );
}

const legalContent = {
  privacy: (
    <>
      <p>Last Updated: {new Date().toLocaleDateString()}</p>
      <h3 className="text-xl font-bold text-gray-900 mt-6">1. Information We Collect</h3>
      <p>We collect information you provide directly to us when you fill out forms, request support, or communicate with us. This may include your name, email address, phone number, and any other details you choose to share.</p>
      <h3 className="text-xl font-bold text-gray-900 mt-6">2. How We Use Your Information</h3>
      <p>We use the information we collect to provide, maintain, and improve our services, communicate with you, and ensure compliance with our legal obligations.</p>
    </>
  ),
  terms: (
    <>
      <p>Last Updated: {new Date().toLocaleDateString()}</p>
      <h3 className="text-xl font-bold text-gray-900 mt-6">1. Acceptance of Terms</h3>
      <p>By accessing and using the website of Raja Deepu Sooriya Private Limited, you accept and agree to be bound by the terms and provision of this agreement.</p>
      <h3 className="text-xl font-bold text-gray-900 mt-6">2. Intellectual Property</h3>
      <p>All content on this site, including text, graphics, logos, and images, is the property of Raja Deepu Sooriya Private Limited and protected by applicable copyright laws.</p>
    </>
  ),
  disclaimer: (
    <>
      <h3 className="text-xl font-bold text-gray-900 mt-6">General Information</h3>
      <p>The information provided by Raja Deepu Sooriya Private Limited on this website is for general informational purposes only. All information on the site is provided in good faith, however, we make no representation or warranty of any kind.</p>
    </>
  )
};

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer({ setView }) {
  return (
    <footer className="bg-corp-blue border-t-4 border-corp-red">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded bg-corp-red flex items-center justify-center text-white font-black text-sm">RDS</div>
              <div><div className="text-white font-bold text-sm tracking-widest uppercase">Raja Deepu Sooriya</div><div className="text-corp-gold text-[10px] tracking-[0.2em] uppercase mt-0.5">Private Limited</div></div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed font-body max-w-xs mb-5">An enterprise built on integrity, innovation, and shared vision — proudly rooted in Tamil Nadu.</p>
            
            <div className="flex gap-4 mt-6">
              {/* Instagram */}
              <a href="https://www.instagram.com/rajadeepusooriya/?utm_source=ig_web_button_share_sheet" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-sm bg-white/10 hover:bg-corp-red flex items-center justify-center text-white transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              {/* LinkedIn */}
              <a href="https://www.linkedin.com/company/rajadeepusooriya" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-sm bg-white/10 hover:bg-corp-red flex items-center justify-center text-white transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
          </div>
          <div>
            <div className="text-white font-bold text-xs tracking-widest uppercase mb-5">Statutory Details</div>
            <div className="space-y-4">
              {[["CIN", "U79120TZ2025PTC034817"], ["GSTIN", "33AAOCR6737N1ZN"]].map(([k, v]) => (
                <div key={k}><div className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">{k}</div><div className="text-gray-300 text-xs font-mono leading-relaxed mt-0.5">{v}</div></div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-white font-bold text-xs tracking-widest uppercase mb-5">Enterprise Brands</div>
            <div className="space-y-3 mb-8">
              <a href="https://www.mytripraja.com/" target="_blank" rel="noopener noreferrer" className="block text-gray-400 hover:text-corp-gold text-xs transition-colors font-body">MyTripRaja</a>
              <a href="https://marketerraja.com/" target="_blank" rel="noopener noreferrer" className="block text-gray-400 hover:text-corp-gold text-xs transition-colors font-body">MarketerRaja</a>
            </div>
            
            <div className="text-white font-bold text-xs tracking-widest uppercase mb-5">Registered Address</div>
            <address className="text-gray-400 text-xs leading-relaxed not-italic font-body mb-6">17/1 DS Apartment,<br />Tiruchengode Road,<br />Sankagiri — 637301,<br />Tamil Nadu, India</address>
          </div>
        </div>
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-xs font-body text-center sm:text-left">© {new Date().getFullYear()} Raja Deepu Sooriya Private Limited. All rights reserved.</p>
          <div className="flex gap-6">
            <button onClick={() => { setView("privacy"); window.scrollTo(0,0); }} className="text-gray-400 hover:text-white text-xs transition-colors font-body">Privacy Policy</button>
            <button onClick={() => { setView("terms"); window.scrollTo(0,0); }} className="text-gray-400 hover:text-white text-xs transition-colors font-body">Terms of Service</button>
            <button onClick={() => { setView("disclaimer"); window.scrollTo(0,0); }} className="text-gray-400 hover:text-white text-xs transition-colors font-body">Disclaimer</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── FLOATING WHATSAPP BUTTON ─────────────────────────────────────────────────
function WhatsAppButton() {
  return (
    <a 
      href="https://wa.me/918098889088"
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#1ebe5d] rounded-full shadow-lg shadow-green-900/20 flex items-center justify-center text-white transition-transform hover:scale-110"
      aria-label="Chat on WhatsApp"
    >
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.031 0C5.385 0 0 5.388 0 12.035c0 2.12.551 4.195 1.6 6.015L.175 24l6.103-1.602c1.76.953 3.738 1.455 5.753 1.455 6.646 0 12.031-5.388 12.031-12.035S18.677 0 12.031 0zm0 21.848c-1.782 0-3.526-.478-5.056-1.385l-.362-.214-3.754.985.998-3.66-.235-.373C2.607 15.492 2.052 13.788 2.052 12.035 2.052 6.533 6.529 2.056 12.031 2.056c5.498 0 9.977 4.478 9.977 9.979s-4.479 9.979-9.977 9.979h.001zm5.48-7.502c-.3-.151-1.776-.877-2.052-.977-.276-.1-.477-.151-.678.151-.202.302-.778.977-.953 1.178-.176.202-.352.227-.653.076-.302-.151-1.267-.468-2.416-1.491-.892-.794-1.494-1.775-1.67-2.076-.176-.302-.019-.465.132-.616.136-.135.302-.352.453-.528.151-.176.202-.302.302-.502.1-.202.051-.378-.025-.528-.076-.151-.678-1.637-.929-2.24-.242-.587-.488-.507-.678-.516-.176-.008-.378-.008-.579-.008s-.528.076-.804.378c-.276.302-1.054 1.03-1.054 2.512 0 1.482 1.079 2.915 1.23 3.116.151.202 2.124 3.242 5.143 4.544 2.001.865 2.666.93 3.633.784.819-.125 2.531-1.033 2.884-2.031.352-.998.352-1.854.251-2.031-.1-.177-.378-.277-.678-.428z"/>
      </svg>
    </a>
  );
}

// ─── MAIN APP ENTRY ───────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("home");

  return (
    <div className="font-body antialiased relative">
      <Navbar view={view} setView={setView} />
      
      {view === "home" && (
        <>
          <Hero />
          <About setView={setView} />
          <CoreValues />
          <Brands />
          <Contact />
        </>
      )}

      {view === "internships" && <InternshipPage />}
      {view === "about-more" && <AboutMorePage />}
      {view.startsWith("director-") && <DirectorPage id={view.replace("director-", "")} />}
      {["privacy", "terms", "disclaimer"].includes(view) && (
        <LegalPage title={view === "privacy" ? "Privacy Policy" : view === "terms" ? "Terms of Service" : "Disclaimer"} content={legalContent[view]} />
      )}

      <Footer setView={setView} />
      <WhatsAppButton />
    </div>
  );
}
