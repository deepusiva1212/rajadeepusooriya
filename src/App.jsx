import { useState, useEffect, useRef } from "react";

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
function Navbar({ setView }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = ["About", "Brands", "Contact"];

  const handleNavClick = (e, l) => {
    e.preventDefault();
    setView("home");
    setTimeout(() => {
      document.getElementById(l.toLowerCase())?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    setOpen(false);
  };

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-corp-black shadow-xl shadow-black/50" : "bg-transparent"}`}>
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

      <div className={`md:hidden bg-corp-black border-t border-white/10 overflow-hidden transition-all duration-300 ${open ? "max-h-60" : "max-h-0"}`}>
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
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-corp-black text-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-corp-red/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-corp-gold/5 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 pt-28 pb-20 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 border border-corp-red/40 bg-corp-red/10 rounded-sm">
          <span className="w-2 h-2 rounded-full bg-corp-red animate-pulse" />
          <span className="text-corp-red-light text-xs font-bold tracking-[0.25em] uppercase">DPIIT Recognised Startup</span>
        </div>

        <h1 className="font-display text-5xl sm:text-6xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight mb-8">
          Work. Grow.<br />
          <span className="text-corp-gold">Lead.</span>
        </h1>

        <p className="text-gray-300 text-lg sm:text-xl leading-relaxed max-w-2xl mb-12 font-body font-light">
          Raja Deepu Sooriya Private Limited is a dynamic, innovation-driven enterprise committed to delivering exceptional value across diverse business sectors — founded on trust, integrity, and shared vision.
        </p>

        <div className="flex flex-wrap justify-center gap-5">
          <a href="#about"
            className="px-8 py-4 bg-corp-red hover:bg-corp-red-dark text-white font-bold text-sm tracking-widest uppercase transition-all duration-200 rounded-sm shadow-xl shadow-corp-red/20">
            Discover Us
          </a>
          <a href="#brands"
            className="px-8 py-4 border border-white/20 hover:border-corp-gold bg-white/5 backdrop-blur-sm text-white font-bold text-sm tracking-widest uppercase transition-all duration-200 rounded-sm">
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
function About() {
  const [ref, visible] = useInView();
  const directors = [
    { initial: "R", name: "Raja", role: "Director & Co-Founder", desc: "Visionary leader driving corporate strategy and stakeholder relationships.", color: "bg-corp-black" },
    { initial: "D", name: "Deepu", role: "Director & Co-Founder", desc: "Operations specialist ensuring seamless delivery, process excellence, and growth.", color: "bg-corp-red" },
    { initial: "S", name: "Sooriya", role: "Director & Co-Founder", desc: "Technology and innovation champion, building digital capabilities.", color: "bg-corp-black" },
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
            <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-black text-corp-black leading-tight mb-6">
              A Partnership Built on<br /><span className="text-corp-red">Shared Vision</span>
            </h2>
            <p className="text-gray-600 text-base leading-relaxed mb-5 font-body">
              Raja Deepu Sooriya Private Limited was incorporated in 2025 as a DPIIT-recognised startup, embodying the combined ambition and expertise of three co-founders whose complementary strengths form the backbone of the company.
            </p>
            <p className="text-gray-600 text-base leading-relaxed mb-8 font-body">
              Headquartered in Sankagiri, Tamil Nadu, the company operates with a commitment to transparency, corporate governance, and long-term value creation.
            </p>
          </div>
          <div className="space-y-4">
            <div className="text-corp-black font-bold text-sm tracking-widest uppercase mb-6">Board of Directors</div>
            {directors.map((d) => (
              <div key={d.name} className="flex gap-5 p-5 bg-white border border-gray-200 rounded-sm hover:shadow-lg hover:border-corp-gold transition-all duration-300">
                <div className={`w-12 h-12 flex-shrink-0 rounded-sm flex items-center justify-center text-white font-black text-lg ${d.color}`}>
                  {d.initial}
                </div>
                <div>
                  <div className="text-corp-black font-black text-base">{d.name}</div>
                  <div className="text-corp-red text-xs font-bold tracking-widest uppercase mb-1">{d.role}</div>
                  <p className="text-gray-500 text-sm leading-relaxed font-body">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── BRANDS ─────────────────────────────────────────────────────────────────
function Brands() {
  const [ref, visible] = useInView();

  return (
    <section id="brands" className="py-24 lg:py-32 bg-corp-black relative overflow-hidden">
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
          {/* Brand 1 */}
          <div className="group bg-white/5 border border-white/10 p-10 rounded-sm hover:border-corp-red transition-all duration-500">
            <div className="text-corp-gold text-xs font-bold tracking-widest uppercase mb-4">Travel & Tourism</div>
            <h3 className="font-display text-3xl text-white font-bold mb-4">MyTripRaja</h3>
            <p className="text-gray-400 leading-relaxed mb-8">
              A comprehensive online travel and tourism platform. We provide seamless booking experiences, curated tour packages, destination research, and end-to-end travel management across India and beyond.
            </p>
            <a href="https://www.mytripraja.com/" target="_blank" rel="noopener noreferrer" 
               className="inline-flex items-center gap-2 text-white font-bold text-xs tracking-widest uppercase pb-1 border-b border-corp-red hover:text-corp-red transition-colors">
              Visit Website
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </a>
          </div>

          {/* Brand 2 */}
          <div className="group bg-white/5 border border-white/10 p-10 rounded-sm hover:border-corp-red transition-all duration-500">
            <div className="text-corp-gold text-xs font-bold tracking-widest uppercase mb-4">Digital Agency</div>
            <h3 className="font-display text-3xl text-white font-bold mb-4">MarketerRaja</h3>
            <p className="text-gray-400 leading-relaxed mb-8">
              A full-service digital marketing agency dedicated to brand growth. We specialize in search engine optimization, targeted ad campaigns, social media management, and strategic brand positioning.
            </p>
            <a href="https://marketerraja.com/" target="_blank" rel="noopener noreferrer" 
               className="inline-flex items-center gap-2 text-white font-bold text-xs tracking-widest uppercase pb-1 border-b border-corp-red hover:text-corp-red transition-colors">
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
    <section id="contact" className="py-24 lg:py-32 bg-white">
      <div ref={ref} className={`max-w-7xl mx-auto px-6 lg:px-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <div className="flex items-center gap-3 mb-4"><div className="w-8 h-px bg-corp-red" /><span className="text-corp-red text-xs font-bold tracking-[0.25em] uppercase">Contact Us</span></div>
            <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-black text-corp-black leading-tight mb-6">Let's Start a<br /><span className="text-corp-red">Conversation</span></h2>
            
            <div className="space-y-8 mt-12 border-l-2 border-corp-red/20 pl-6">
              {[
                ["REGISTERED OFFICE", "17/1 DS Apartment, Tiruchengode Road, Sankagiri — 637301, Tamil Nadu"],
                ["CONTACT NUMBER", "+91 8098889088"],
                ["CORPORATE IDENTITY NUMBER", "U79120TZ2025PTC034817"],
                ["GSTIN", "33AAOCR6737N1ZN"],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-corp-black font-bold text-xs tracking-widest uppercase mb-1.5">{label}</div>
                  <div className="text-gray-600 text-sm font-mono leading-relaxed">{value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-corp-offwhite border border-gray-200 rounded-sm p-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-corp-black font-black text-xl mb-2">Message Received</div>
                <p className="text-gray-500 text-sm font-body">Thank you for reaching out. Our team will contact you shortly.</p>
                <button onClick={() => setSent(false)} className="mt-6 text-corp-red text-sm font-bold tracking-widest uppercase border-b border-corp-red pb-1">Send Another</button>
              </div>
            ) : (
              <form onSubmit={handle} className="space-y-6">
                <div className="text-corp-black font-black text-lg mb-6 font-display">Send Us an Enquiry</div>
                {["name", "email"].map(field => (
                  <div key={field}>
                    <label className="block text-corp-black text-xs font-bold tracking-widest uppercase mb-2">{field}</label>
                    <input type={field === "email" ? "email" : "text"} required value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:border-corp-black focus:ring-1 focus:ring-corp-black transition-all font-body bg-white" />
                  </div>
                ))}
                <div>
                  <label className="block text-corp-black text-xs font-bold tracking-widest uppercase mb-2">Message</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:border-corp-black focus:ring-1 focus:ring-corp-black transition-all resize-none font-body bg-white" />
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

// ─── LEGAL PAGES ──────────────────────────────────────────
function LegalPage({ title, content }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen bg-corp-offwhite pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        <h1 className="font-display text-4xl font-black text-corp-black mb-8">{title}</h1>
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
      <h3 className="text-xl font-bold text-corp-black mt-6">1. Information We Collect</h3>
      <p>We collect information you provide directly to us when you fill out forms, request support, or communicate with us. This may include your name, email address, phone number, and any other details you choose to share.</p>
      <h3 className="text-xl font-bold text-corp-black mt-6">2. How We Use Your Information</h3>
      <p>We use the information we collect to provide, maintain, and improve our services, communicate with you, and ensure compliance with our legal obligations.</p>
      <h3 className="text-xl font-bold text-corp-black mt-6">3. Contact Us</h3>
      <p>If you have any questions about this Privacy Policy, please contact us at our registered office in Sankagiri, Tamil Nadu.</p>
    </>
  ),
  terms: (
    <>
      <p>Last Updated: {new Date().toLocaleDateString()}</p>
      <h3 className="text-xl font-bold text-corp-black mt-6">1. Acceptance of Terms</h3>
      <p>By accessing and using the website of Raja Deepu Sooriya Private Limited, you accept and agree to be bound by the terms and provision of this agreement.</p>
      <h3 className="text-xl font-bold text-corp-black mt-6">2. Intellectual Property</h3>
      <p>All content on this site, including text, graphics, logos, and images, is the property of Raja Deepu Sooriya Private Limited and protected by applicable copyright laws.</p>
      <h3 className="text-xl font-bold text-corp-black mt-6">3. Governing Law</h3>
      <p>These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in Tamil Nadu.</p>
    </>
  ),
  disclaimer: (
    <>
      <h3 className="text-xl font-bold text-corp-black mt-6">General Information</h3>
      <p>The information provided by Raja Deepu Sooriya Private Limited on this website is for general informational purposes only. All information on the site is provided in good faith, however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.</p>
      <h3 className="text-xl font-bold text-corp-black mt-6">External Links</h3>
      <p>The site may contain links to other websites. Such external links are not investigated, monitored, or checked for accuracy by us.</p>
    </>
  )
};

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer({ setView }) {
  return (
    <footer className="bg-corp-black border-t-4 border-corp-red">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded bg-corp-red flex items-center justify-center text-white font-black text-sm">RDS</div>
              <div><div className="text-white font-bold text-sm tracking-widest uppercase">Raja Deepu Sooriya</div><div className="text-corp-gold text-[10px] tracking-[0.2em] uppercase mt-0.5">Private Limited</div></div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed font-body max-w-xs mb-5">A DPIIT-recognised startup built on integrity, innovation, and shared vision — proudly rooted in Tamil Nadu.</p>
            
            <div className="flex gap-4 mt-6">
              {/* Instagram Link */}
              <a href="https://www.instagram.com/rajadeepusooriya/?utm_source=ig_web_button_share_sheet" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-sm bg-white/5 hover:bg-corp-red flex items-center justify-center text-white transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>
          <div>
            <div className="text-white font-bold text-xs tracking-widest uppercase mb-5">Statutory Details</div>
            <div className="space-y-4">
              {[["CIN", "U79120TZ2025PTC034817"], ["GSTIN", "33AAOCR6737N1ZN"], ["Cert. No.", "DIPP219259"]].map(([k, v]) => (
                <div key={k}><div className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">{k}</div><div className="text-gray-300 text-xs font-mono leading-relaxed mt-0.5">{v}</div></div>
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
          <p className="text-gray-500 text-xs font-body text-center sm:text-left">© {new Date().getFullYear()} Raja Deepu Sooriya Private Limited. All rights reserved.</p>
          <div className="flex gap-6">
            <button onClick={() => setView("privacy")} className="text-gray-400 hover:text-white text-xs transition-colors font-body">Privacy Policy</button>
            <button onClick={() => setView("terms")} className="text-gray-400 hover:text-white text-xs transition-colors font-body">Terms of Service</button>
            <button onClick={() => setView("disclaimer")} className="text-gray-400 hover:text-white text-xs transition-colors font-body">Disclaimer</button>
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
      {view === "home" ? (
        <>
          <Navbar setView={setView} />
          <Hero />
          <About />
          <Brands />
          <Contact />
        </>
      ) : (
        <>
          <Navbar setView={setView} />
          <LegalPage 
            title={view === "privacy" ? "Privacy Policy" : view === "terms" ? "Terms of Service" : "Disclaimer"} 
            content={legalContent[view]} 
          />
        </>
      )}
      <Footer setView={setView} />
      <WhatsAppButton />
    </div>
  );
}
