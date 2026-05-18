import { useState, useEffect, useRef } from "react";
import { collection, addDoc, serverTimestamp, doc, runTransaction } from "firebase/firestore";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import emailjs from '@emailjs/browser';
import Background from "./Background";
import ResumeUpload from "./ResumeUpload";
import InternshipPage from "./InternshipPage";
import InternshipTerms from "./InternshipTerms";     
import InternshipPrivacy from "./InternshipPrivacy";
import EmployeePortal from "./EmployeePortal";
import DirectorPortal from "./DirectorPortal";
import PageTransitionBar from "./PageTransitionBar";
import Blog from "./Blog";

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
function Navbar({ view, navigateTo }) {
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
      navigateTo("internships");
    } else if (view !== "home") {
      navigateTo("home");
      setTimeout(() => document.getElementById(l.toLowerCase())?.scrollIntoView({ behavior: "smooth" }), 100);
    } else {
      document.getElementById(l.toLowerCase())?.scrollIntoView({ behavior: "smooth" });
    }
    setOpen(false);
  };

  return (
    // FIX: Softened the shadow from shadow-black/50 to shadow-gray-900/10 for a cleaner look on white pages
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled || view !== "home" ? "bg-corp-blue shadow-md shadow-gray-900/10" : "bg-transparent"}`}>
      <div className="absolute top-0 w-full h-1 bg-corp-red" />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16 lg:h-20 mt-1">
        <button onClick={() => navigateTo("home")} className="flex items-center gap-3 group text-left">
          <div className="w-9 h-9 rounded bg-corp-red flex items-center justify-center text-white font-black text-sm tracking-tight leading-none select-none">RDS</div>
          <div className="hidden sm:block leading-tight">
            <span className="block text-white font-bold text-sm tracking-widest uppercase">Raja Deepu Sooriya</span>
            <span className="block text-corp-gold text-[10px] tracking-[0.2em] uppercase mt-0.5">Private Limited</span>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <button key={l} onClick={(e) => handleNavClick(e, l)} className="text-gray-300 hover:text-white text-sm font-medium tracking-widest uppercase transition-colors duration-200 relative group">
              {l}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-corp-gold group-hover:w-full transition-all duration-300" />
            </button>
          ))}
          <button onClick={(e) => handleNavClick(e, "Contact")} className="ml-4 px-5 py-2 bg-corp-red hover:bg-corp-red-dark text-white text-xs font-bold tracking-widest uppercase transition-colors duration-200 rounded-sm">
            Get In Touch
          </button>
        </nav>

        <button className="md:hidden text-white p-2" onClick={() => setOpen(!open)}>
          <div className="w-5 h-px bg-white mb-1.5 transition-all" style={{ transform: open ? "rotate(45deg) translate(2px,6px)" : "" }} />
          <div className="w-5 h-px bg-white mb-1.5 transition-all" style={{ opacity: open ? 0 : 1 }} />
          <div className="w-5 h-px bg-white transition-all" style={{ transform: open ? "rotate(-45deg) translate(2px,-6px)" : "" }} />
        </button>
      </div>

      <div className={`md:hidden bg-corp-blue border-t border-white/10 overflow-hidden transition-all duration-300 ${open ? "max-h-60" : "max-h-0"}`}>
        {links.map(l => (
          <button key={l} onClick={(e) => handleNavClick(e, l)} className="block w-full text-left px-6 py-3 text-gray-300 hover:text-white text-sm font-medium tracking-widest uppercase border-b border-white/5">
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
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-transparent text-center">
      <div className="relative max-w-4xl mx-auto px-6 pt-28 pb-20 flex flex-col items-center">
        <h1 className="font-display text-5xl sm:text-6xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight mb-8">
          Work. Grow.<br />
          <span className="text-corp-gold">Lead.</span>
        </h1>
        <p className="text-gray-300 text-lg sm:text-xl leading-relaxed max-w-2xl mb-12 font-body font-light">
          Raja Deepu Sooriya Private Limited is a dynamic, innovation-driven enterprise committed to delivering exceptional value across diverse business sectors — founded on trust, integrity, and shared vision.
        </p>
        <div className="flex flex-wrap justify-center gap-5">
          <a href="#about" className="px-8 py-4 bg-corp-red hover:bg-corp-red-dark text-white font-bold text-sm tracking-widest uppercase transition-all duration-200 rounded-sm shadow-xl shadow-corp-red/20">Discover Us</a>
          <a href="#brands" className="px-8 py-4 border border-white/20 hover:border-corp-gold bg-white/5 backdrop-blur-sm text-white font-bold text-sm tracking-widest uppercase transition-all duration-200 rounded-sm">Our Brands</a>
        </div>
      </div>
    </section>
  );
}

// ─── ABOUT ────────────────────────────────────────────────────────────────────
function About({ navigateTo }) {
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
            <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-black text-gray-900 leading-tight mb-6">A Partnership Built on<br /><span className="text-corp-red">Shared Vision</span></h2>
            <p className="text-gray-600 text-base leading-relaxed mb-5 font-body">Raja Deepu Sooriya Private Limited embodies the combined ambition and expertise of three co-founders whose complementary strengths form the backbone of the company.</p>
            <p className="text-gray-600 text-base leading-relaxed mb-8 font-body">Headquartered in Sankagiri, Tamil Nadu, the company operates with a commitment to transparency, corporate governance, and long-term value creation.</p>
            <button onClick={() => navigateTo("about-more")} className="px-6 py-3 border-2 border-corp-blue text-corp-blue font-bold text-xs tracking-widest uppercase hover:bg-corp-blue hover:text-white transition-colors duration-300 rounded-sm">Know More About Us</button>
          </div>
          <div className="space-y-4">
            <div className="text-gray-900 font-bold text-sm tracking-widest uppercase mb-6 flex items-center justify-between">
              <span>Board of Directors</span><span className="text-[10px] text-gray-400 font-normal normal-case">Click profile to view details</span>
            </div>
            {directors.map((d) => (
              <button key={d.name} onClick={() => navigateTo(`director-${d.id}`)} className="w-full text-left flex gap-5 p-5 bg-white border border-gray-200 rounded-sm hover:shadow-lg hover:border-corp-gold hover:-translate-y-1 transition-all duration-300 group">
                <div className={`w-12 h-12 flex-shrink-0 rounded-sm flex items-center justify-center text-white font-black text-lg ${d.color}`}>{d.initial}</div>
                <div>
                  <div className="text-gray-900 font-black text-base group-hover:text-corp-red transition-colors">{d.name}</div>
                  <div className="text-corp-gold text-xs font-bold tracking-widest uppercase mb-1">{d.role}</div>
                  <p className="text-gray-500 text-sm leading-relaxed font-body">{d.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CORE VALUES (ENLARGED) ────────────────────────────────────────────────
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
          <h2 className="font-display text-4xl sm:text-5xl font-black text-gray-900">What Drives Us Forward</h2>
        </div>
        
        {/* FIX: Increased padding (p-10), title size (text-xl), and description size (text-base) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((v, i) => (
            <div key={v.title} className="p-10 bg-corp-offwhite border border-gray-100 rounded-sm hover:border-corp-gold hover:shadow-lg transition-all duration-300 group">
              <div className="text-corp-gold font-display text-5xl font-black mb-6 opacity-30 group-hover:opacity-100 transition-opacity">0{i + 1}</div>
              <h3 className="text-gray-900 font-bold text-xl mb-4">{v.title}</h3>
              <p className="text-gray-600 text-base leading-relaxed font-body">{v.desc}</p>
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
    <section id="brands" className="py-24 lg:py-32 bg-transparent relative overflow-hidden">
      <div ref={ref} className={`relative max-w-7xl mx-auto px-6 lg:px-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-corp-gold" />
          <span className="text-corp-gold text-xs font-bold tracking-[0.25em] uppercase">Our Enterprise</span>
        </div>
        <div className="mb-16">
          <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-black text-white leading-tight">Operating Brands</h2>
          <p className="text-gray-400 text-base leading-relaxed mt-4 max-w-2xl font-body">Raja Deepu Sooriya Private Limited manages and scales specialized brands across multiple business sectors to deliver focused, high-quality services.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="group bg-corp-blue-mid/80 border border-white/10 p-10 rounded-sm hover:border-corp-red transition-all duration-500 backdrop-blur-md">
            <div className="text-corp-gold text-xs font-bold tracking-widest uppercase mb-4">Travel & Tourism</div>
            <h3 className="font-display text-3xl text-white font-bold mb-4">MyTripRaja</h3>
            <p className="text-gray-400 leading-relaxed mb-8">A comprehensive online travel and tourism platform. We provide seamless booking experiences, curated tour packages, destination research, and end-to-end travel management.</p>
            <a href="https://www.mytripraja.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white font-bold text-xs tracking-widest uppercase pb-1 border-b border-corp-red hover:text-corp-red transition-colors">Visit Website</a>
          </div>

          <div className="group bg-corp-blue-mid/80 border border-white/10 p-10 rounded-sm hover:border-corp-red transition-all duration-500 backdrop-blur-md">
            <div className="text-corp-gold text-xs font-bold tracking-widest uppercase mb-4">Digital Agency</div>
            <h3 className="font-display text-3xl text-white font-bold mb-4">MarketerRaja</h3>
            <p className="text-gray-400 leading-relaxed mb-8">A full-service digital marketing agency dedicated to brand growth. We specialize in search engine optimization, targeted ad campaigns, and strategic brand positioning.</p>
            <a href="https://marketerraja.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white font-bold text-xs tracking-widest uppercase pb-1 border-b border-corp-red hover:text-corp-red transition-colors">Visit Website</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CONTACT FORM (ACTIVE) ─────────────────────────────────────────────────────
function Contact() {
  const [ref, visible] = useInView();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FIX: This now actively saves the enquiry to your Firebase Database!
  const handle = async (e) => { 
    e.preventDefault(); 
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "enquiries"), {
        ...form,
        submittedAt: serverTimestamp(),
      });
      setSent(true); 
      setForm({ name: "", email: "", message: "" }); 
    } catch (error) {
      console.error("Error sending message: ", error);
      alert("There was an error sending your message. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <section id="contact" className="py-24 lg:py-32 bg-corp-offwhite">
      <div ref={ref} className={`max-w-7xl mx-auto px-6 lg:px-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <div className="flex items-center gap-3 mb-4"><div className="w-8 h-px bg-corp-red" /><span className="text-corp-red text-xs font-bold tracking-[0.25em] uppercase">Contact Us</span></div>
            <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-black text-gray-900 leading-tight mb-6">Let's Start a<br /><span className="text-corp-red">Conversation</span></h2>
            
            {/* FIX: Improved layout and added Company Email */}
            <div className="grid sm:grid-cols-2 gap-8 mt-12 border-l-2 border-corp-red/20 pl-6">
              <div>
                <div className="text-gray-900 font-bold text-xs tracking-widest uppercase mb-1.5">Email Address</div>
                <a href="mailto:contact@rajadeepusooriya.com" className="text-corp-blue hover:text-corp-red text-sm font-mono leading-relaxed transition-colors">contact@rajadeepusooriya.com</a>
              </div>
              <div>
                <div className="text-gray-900 font-bold text-xs tracking-widest uppercase mb-1.5">Contact Number</div>
                <a href="tel:+918098889088" className="text-corp-blue hover:text-corp-red text-sm font-mono leading-relaxed transition-colors">+91 8098889088</a>
              </div>
              <div className="sm:col-span-2">
                <div className="text-gray-900 font-bold text-xs tracking-widest uppercase mb-1.5">Registered Office</div>
                <div className="text-gray-600 text-sm font-mono leading-relaxed">17/1 DS Apartment, Tiruchengode Road, Sankagiri — 637301, Tamil Nadu</div>
              </div>
              <div>
                <div className="text-gray-900 font-bold text-xs tracking-widest uppercase mb-1.5">CIN</div>
                <div className="text-gray-600 text-sm font-mono leading-relaxed">U79120TZ2025PTC034817</div>
              </div>
              <div>
                <div className="text-gray-900 font-bold text-xs tracking-widest uppercase mb-1.5">GSTIN</div>
                <div className="text-gray-600 text-sm font-mono leading-relaxed">33AAOCR6737N1ZN</div>
              </div>
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
                <button type="submit" disabled={isSubmitting} className={`w-full py-4 font-bold text-sm tracking-widest uppercase transition-colors duration-200 rounded-sm shadow-md ${isSubmitting ? 'bg-gray-400 text-white cursor-wait' : 'bg-corp-red hover:bg-corp-red-dark text-white'}`}>
                  {isSubmitting ? 'Sending...' : 'Submit Details'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}



// ─── DETAILED PAGES (About & Directors) ──────────────────────────────────────
function AboutMorePage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen pt-32 pb-24 relative">
      <div className="max-w-4xl mx-auto px-6 lg:px-10 relative z-10 bg-white/5 backdrop-blur-sm p-10 rounded-sm border border-white/10">
        <div className="mb-8">
          <div className="w-12 h-1 bg-corp-red mb-6" />
          <h1 className="font-display text-4xl lg:text-5xl font-black text-white leading-tight">Our History & <br/><span className="text-corp-red">Corporate Vision</span></h1>
        </div>
        <div className="prose prose-lg max-w-none text-gray-300 font-body leading-relaxed space-y-8">
          <p className="text-xl text-white font-medium">Raja Deepu Sooriya Private Limited was founded in 2025 upon a simple yet powerful premise: combining diverse expertise to create unified, high-performing business solutions.</p>
          <p>Rooted in Sankagiri, Tamil Nadu, our enterprise is the culmination of a deep-seated partnership between three driven founders. We recognized a growing gap in the market for reliable, transparent, and digitally-forward corporate services, specifically tailored to travel, tourism, and brand marketing.</p>
          <div className="p-8 bg-corp-blue border-l-4 border-corp-gold shadow-sm my-10">
            <h3 className="font-display text-2xl font-bold text-white mb-3">The Corporate Mandate</h3>
            <p className="m-0 text-gray-300">Our mandate is to operate with uncompromising integrity. Whether we are designing international travel packages through MyTripRaja, or scaling local businesses through MarketerRaja, our commitment to corporate governance, financial transparency, and measurable results remains absolute.</p>
          </div>
          <p>Looking to the future, we are actively expanding our digital footprint and establishing new operational milestones. Our goal is not just to participate in the industries we operate within, but to redefine their standard of service.</p>
        </div>
      </div>
    </div>
  );
}

function DirectorPage({ id }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const directorsData = {
    raja: { fullName: "Raja", role: "Director & Co-Founder", bio: "As a founding pillar of the organization, Raja leads the corporate strategy and high-level stakeholder relationship management. With a visionary approach to business expansion, he ensures that the company's long-term objectives align with emerging market trends.", color: "bg-corp-blue" },
    deepu: { fullName: "Deepadharsan Rajavel", role: "Director & Co-Founder", bio: "Deepadharsan holds a Master of Commerce and brings deep expertise in corporate governance, financial reporting, and strict GST compliance to the board. With a strong professional interest in sustainable business development and green accounting practices, he ensures that Raja Deepu Sooriya Private Limited operates on a financially sound, transparent, and forward-looking foundation.", color: "bg-corp-red" },
    sooriya: { fullName: "Balasooriya", role: "Director & Co-Founder", bio: "Balasooriya is the technology and innovation champion of the enterprise. He oversees the digital architecture that powers our brands, ensuring that platforms like MyTripRaja and MarketerRaja are equipped with cutting-edge tools and seamless user experiences.", color: "bg-corp-blue-mid" }
  };
  const data = directorsData[id];

  return (
    <div className="min-h-screen pt-32 pb-24 relative">
      <div className="max-w-4xl mx-auto px-6 lg:px-10 relative z-10 bg-white/5 backdrop-blur-sm p-10 rounded-sm border border-white/10">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className={`w-32 h-32 md:w-48 md:h-48 flex-shrink-0 rounded-sm shadow-lg flex items-center justify-center text-white font-display text-5xl font-black ${data.color}`}>{data.fullName.charAt(0)}</div>
          <div>
            <div className="text-corp-red text-sm font-bold tracking-widest uppercase mb-2">{data.role}</div>
            <h1 className="font-display text-4xl lg:text-5xl font-black text-white mb-6">{data.fullName}</h1>
            <div className="w-12 h-1 bg-corp-gold mb-8" />
            <p className="text-gray-300 text-lg leading-relaxed font-body">{data.bio}</p>
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
    <div className="min-h-screen pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-10 bg-white/5 backdrop-blur-sm p-10 rounded-sm border border-white/10">
        <h1 className="font-display text-4xl font-black text-white mb-8">{title}</h1>
        <div className="prose max-w-none text-gray-300 font-body leading-relaxed space-y-6">{content}</div>
      </div>
    </div>
  );
}
const legalContent = {
  privacy: (<><p>Last Updated: {new Date().toLocaleDateString()}</p><h3 className="text-xl font-bold text-white mt-6">1. Information We Collect</h3><p>We collect information you provide directly to us when you fill out forms, request support, or communicate with us.</p></>),
  terms: (<><p>Last Updated: {new Date().toLocaleDateString()}</p><h3 className="text-xl font-bold text-white mt-6">1. Acceptance of Terms</h3><p>By accessing and using the website of Raja Deepu Sooriya Private Limited, you accept and agree to be bound by the terms and provision of this agreement.</p></>),
  disclaimer: (<><h3 className="text-xl font-bold text-white mt-6">General Information</h3><p>The information provided by Raja Deepu Sooriya Private Limited on this website is for general informational purposes only.</p></>)
};

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer({ navigateTo }) {
  return (
    <footer className="bg-corp-blue border-t-4 border-corp-red relative z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded bg-corp-red flex items-center justify-center text-white font-black text-sm">RDS</div>
              <div><div className="text-white font-bold text-sm tracking-widest uppercase">Raja Deepu Sooriya</div><div className="text-corp-gold text-[10px] tracking-[0.2em] uppercase mt-0.5">Private Limited</div></div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed font-body max-w-xs mb-5">An enterprise built on integrity, innovation, and shared vision — proudly rooted in Tamil Nadu.</p>
            <div className="flex gap-4 mt-6">
              <a href="https://www.instagram.com/rajadeepusooriya" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-sm bg-white/10 hover:bg-corp-red flex items-center justify-center text-white transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
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
            <button onClick={() => navigateTo("privacy")} className="text-gray-400 hover:text-white text-xs transition-colors font-body">Privacy Policy</button>
            <button onClick={() => navigateTo("terms")} className="text-gray-400 hover:text-white text-xs transition-colors font-body">Terms of Service</button>
            <button onClick={() => navigateTo("disclaimer")} className="text-gray-400 hover:text-white text-xs transition-colors font-body">Disclaimer</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── FLOATING WHATSAPP BUTTON ─────────────────────────────────────────────────
function WhatsAppButton() {
  return (
    <a href="https://wa.me/918098889088" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#1ebe5d] rounded-full shadow-lg shadow-green-900/20 flex items-center justify-center text-white transition-transform hover:scale-110" aria-label="Chat on WhatsApp">
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.388 0 12.035c0 2.12.551 4.195 1.6 6.015L.175 24l6.103-1.602c1.76.953 3.738 1.455 5.753 1.455 6.646 0 12.031-5.388 12.031-12.035S18.677 0 12.031 0zm0 21.848c-1.782 0-3.526-.478-5.056-1.385l-.362-.214-3.754.985.998-3.66-.235-.373C2.607 15.492 2.052 13.788 2.052 12.035 2.052 6.533 6.529 2.056 12.031 2.056c5.498 0 9.977 4.478 9.977 9.979s-4.479 9.979-9.977 9.979h.001zm5.48-7.502c-.3-.151-1.776-.877-2.052-.977-.276-.1-.477-.151-.678.151-.202.302-.778.977-.953 1.178-.176.202-.352.227-.653.076-.302-.151-1.267-.468-2.416-1.491-.892-.794-1.494-1.775-1.67-2.076-.176-.302-.019-.465.132-.616.136-.135.302-.352.453-.528.151-.176.202-.302.302-.502.1-.202.051-.378-.025-.528-.076-.151-.678-1.637-.929-2.24-.242-.587-.488-.507-.678-.516-.176-.008-.378-.008-.579-.008s-.528.076-.804.378c-.276.302-1.054 1.03-1.054 2.512 0 1.482 1.079 2.915 1.23 3.116.151.202 2.124 3.242 5.143 4.544 2.001.865 2.666.93 3.633.784.819-.125 2.531-1.033 2.884-2.031.352-.998.352-1.854.251-2.031-.1-.177-.378-.277-.678-.428z"/></svg>
    </a>
  );
}

// ─── MAIN APP ENTRY (WITH BACK BUTTON FIX) ────────────────────────────────────
export default function App() {
  // FIX: Using browser history so the "Back" button works correctly!
  const [view, setView] = useState(() => {
    const path = window.location.pathname.replace("/", "");
    return path || "home";
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace("/", "");
      setView(path || "home");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (newView) => {
    window.history.pushState({}, "", newView === "home" ? "/" : `/${newView}`);
    setView(newView);
    window.scrollTo(0,0);
  };

  return (
    <div className="font-body antialiased relative">
      <Background />

      <PageTransitionBar />
      {!["admin", "employee", "director"].includes(view) && <Navbar view={view} navigateTo={navigateTo} />}
      
      {view === "home" && (
        <>
          <Hero />
          <About navigateTo={navigateTo} />
          <CoreValues />
          <Brands />
          {/* 📰 ADDS LIVE PUBLIC BLOG STREAM */}
            <Blog />
          <Contact />
        </>
      )}

      {view === "internships" && <InternshipPage />}
      {view === "internship-terms" && <InternshipTerms />}     
      {view === "internship-privacy" && <InternshipPrivacy />}
      {view === "about-more" && <AboutMorePage />}
      {view === "employee" && <EmployeePortal />}
      {view === "director" && <DirectorPortal />}
      {view.startsWith("director-") && <DirectorPage id={view.replace("director-", "")} />}
      {["privacy", "terms", "disclaimer"].includes(view) && (
        <LegalPage title={view === "privacy" ? "Privacy Policy" : view === "terms" ? "Terms of Service" : "Disclaimer"} content={legalContent[view]} />
      )}

      {!["admin", "employee", "director"].includes(view) && <Footer />}
      <WhatsAppButton />
    </div>
  );
}
