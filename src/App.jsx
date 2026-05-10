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

  const links = ["About", "Services", "Contact"];

  const handleNavClick = (e, l) => {
    e.preventDefault();
    setView("home");
    setTimeout(() => {
      document.getElementById(l.toLowerCase())?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    setOpen(false);
  };

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-corp-blue shadow-xl shadow-black/30" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16 lg:h-20">
        <button onClick={() => { setView("home"); window.scrollTo(0,0); }} className="flex items-center gap-3 group text-left">
          <div className="w-9 h-9 rounded bg-corp-red flex items-center justify-center text-white font-black text-sm tracking-tight leading-none select-none">
            RDS
          </div>
          <div className="hidden sm:block leading-tight">
            <span className="block text-white font-bold text-sm tracking-widest uppercase">Raja Deepu Sooriya</span>
            <span className="block text-blue-300 text-[10px] tracking-[0.2em] uppercase">Private Limited</span>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <button key={l} onClick={(e) => handleNavClick(e, l)}
              className="text-blue-200 hover:text-white text-sm font-medium tracking-widest uppercase transition-colors duration-200 relative group">
              {l}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-corp-red group-hover:w-full transition-all duration-300" />
            </button>
          ))}
          <button onClick={(e) => handleNavClick(e, "Contact")}
            className="ml-4 px-5 py-2 bg-corp-red hover:bg-corp-red-mid text-white text-xs font-bold tracking-widest uppercase transition-colors duration-200 rounded-sm">
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
            className="block w-full text-left px-6 py-3 text-blue-200 hover:text-white text-sm font-medium tracking-widest uppercase border-b border-white/5">
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
      {/* Animated Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-corp-blue-light/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-corp-red/20 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
        {/* Grid lines */}
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
          <span className="text-corp-red-bright text-xs font-bold tracking-[0.25em] uppercase">DPIIT Recognised Startup</span>
        </div>

        <h1 className="font-display text-5xl sm:text-6xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight mb-8">
          Building Tomorrow's<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-corp-red-bright to-red-400">
            Business Legacy
          </span>
        </h1>

        <p className="text-blue-100 text-lg sm:text-xl leading-relaxed max-w-2xl mb-12 font-body font-light">
          Raja Deepu Sooriya Private Limited is a dynamic, innovation-driven enterprise committed to delivering exceptional value across diverse business sectors — founded on trust, integrity, and shared vision.
        </p>

        <div className="flex flex-wrap justify-center gap-5">
          <a href="#about"
            className="px-8 py-4 bg-corp-red hover:bg-corp-red-mid text-white font-bold text-sm tracking-widest uppercase transition-all duration-200 rounded-sm shadow-xl shadow-corp-red/20">
            Discover Us
          </a>
          <a href="#contact"
            className="px-8 py-4 border border-white/20 hover:border-white/50 bg-white/5 backdrop-blur-sm text-white font-bold text-sm tracking-widest uppercase transition-all duration-200 rounded-sm">
            Contact Us
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
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
    { initial: "R", name: "Raja", role: "Director & Co-Founder", desc: "Visionary leader driving corporate strategy and stakeholder relationships.", color: "corp-blue" },
    { initial: "D", name: "Deepu", role: "Director & Co-Founder", desc: "Operations specialist ensuring seamless delivery, process excellence, and growth.", color: "corp-red" },
    { initial: "S", name: "Sooriya", role: "Director & Co-Founder", desc: "Technology and innovation champion, building digital capabilities.", color: "corp-blue-mid" },
  ];

  return (
    <section id="about" className="py-24 lg:py-32 bg-neutral-50">
      <div ref={ref} className={`max-w-7xl mx-auto px-6 lg:px-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-corp-red" />
          <span className="text-corp-red text-xs font-bold tracking-[0.25em] uppercase">About Us</span>
        </div>
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-black text-corp-blue leading-tight mb-6">
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
            <div className="text-corp-blue font-bold text-sm tracking-widest uppercase mb-6">Board of Directors</div>
            {directors.map((d, i) => (
              <div key={d.name} className="flex gap-5 p-5 bg-white border border-gray-100 rounded-sm hover:shadow-lg hover:border-corp-blue/20 transition-all duration-300">
                <div className={`w-12 h-12 flex-shrink-0 rounded-sm flex items-center justify-center text-white font-black text-lg ${d.color === "corp-red" ? "bg-corp-red" : d.color === "corp-blue-mid" ? "bg-corp-blue-mid" : "bg-corp-blue"}`}>
                  {d.initial}
                </div>
                <div>
                  <div className="text-corp-blue font-black text-base">{d.name}</div>
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

// ─── SERVICES ─────────────────────────────────────────────────────────────────
function Services() {
  const [ref, visible] = useInView();
  const services = [
    { icon: "📊", title: "Business Consulting", desc: "Strategic advisory services that help businesses navigate complexity and optimise operations.", tag: "Advisory" },
    { icon: "💻", title: "Technology Solutions", desc: "Custom digital transformation and software development tailored to your needs.", tag: "Tech" },
    { icon: "📦", title: "Trade & Distribution", desc: "Reliable supply chain management and product distribution built on a robust network.", tag: "Commerce" },
    { icon: "🏗️", title: "Project Management", desc: "End-to-end project execution with transparent governance and quality assurance.", tag: "Operations" },
    { icon: "📋", title: "Compliance & Legal", desc: "Corporate governance and regulatory compliance support to keep your business solid.", tag: "Governance" },
    { icon: "🌐", title: "Digital Marketing", desc: "Data-driven marketing strategies and brand positioning that deliver measurable ROI.", tag: "Growth" },
  ];

  return (
    <section id="services" className="py-24 lg:py-32 bg-corp-blue relative overflow-hidden">
      <div ref={ref} className={`relative max-w-7xl mx-auto px-6 lg:px-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-corp-red" />
          <span className="text-corp-red text-xs font-bold tracking-[0.25em] uppercase">Our Services</span>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-8 mb-16">
          <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-black text-white leading-tight">Business Sectors &<br />Service Offerings</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <div key={s.title} className="group relative p-6 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 hover:border-corp-red/40 transition-all duration-300">
              <div className="absolute top-0 left-0 w-0 h-px bg-corp-red group-hover:w-full transition-all duration-500" />
              <div className="flex items-start justify-between mb-4">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-corp-red-bright bg-corp-red/10 px-2 py-0.5 rounded-sm">{s.tag}</span>
              </div>
              <h3 className="text-white font-bold text-base mb-2">{s.title}</h3>
              <p className="text-blue-300 text-sm leading-relaxed font-body">{s.desc}</p>
            </div>
          ))}
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
            <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-black text-corp-blue leading-tight mb-6">Let's Start a<br /><span className="text-corp-red">Conversation</span></h2>
            <div className="space-y-6 mt-10">
              {[
                ["📍", "Registered Office", "17/1 DS Apartment, Tiruchengode Road, Sankagiri — 637301, Tamil Nadu"],
                ["🏛️", "CIN", "U79120TZ2025PTC034817"],
                ["🔑", "GSTIN", "33AAOCR6737N1ZN"],
              ].map(([icon, label, value]) => (
                <div key={label} className="flex gap-4">
                  <div className="w-12 h-12 flex-shrink-0 bg-corp-blue/5 rounded-sm flex items-center justify-center text-xl">{icon}</div>
                  <div><div className="text-corp-blue font-bold text-xs tracking-widest uppercase mb-1">{label}</div><div className="text-gray-600 text-sm font-mono leading-relaxed">{value}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-neutral-50 border border-gray-100 rounded-sm p-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-2xl mb-4">✅</div>
                <div className="text-corp-blue font-black text-xl mb-2">Message Received</div>
                <button onClick={() => setSent(false)} className="mt-6 text-corp-red text-sm font-bold underline underline-offset-2">Send Another</button>
              </div>
            ) : (
              <form onSubmit={handle} className="space-y-5">
                <div className="text-corp-blue font-black text-lg mb-6">Send Us a Message</div>
                {["name", "email"].map(field => (
                  <div key={field}>
                    <label className="block text-corp-blue text-xs font-bold tracking-widest uppercase mb-2">{field}</label>
                    <input type={field === "email" ? "email" : "text"} required value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} placeholder={field === "name" ? "Your full name" : "your@email.com"} className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue/20 transition-all font-body" />
                  </div>
                ))}
                <div>
                  <label className="block text-corp-blue text-xs font-bold tracking-widest uppercase mb-2">Message</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="How can we help you?" className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-corp-blue focus:ring-1 focus:ring-corp-blue/20 transition-all resize-none font-body" />
                </div>
                <button type="submit" className="w-full py-3.5 bg-corp-red hover:bg-corp-red-mid text-white font-bold text-sm tracking-widest uppercase transition-colors duration-200 rounded-sm shadow-lg shadow-corp-red/20">Submit Enquiry</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── LEGAL PAGES (Simulated Routing) ──────────────────────────────────────────
function LegalPage({ title, content }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen bg-neutral-50 pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        <h1 className="font-display text-4xl font-black text-corp-blue mb-8">{title}</h1>
        <div className="prose prose-blue max-w-none text-gray-600 font-body leading-relaxed space-y-6">
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
      <h3 className="text-xl font-bold text-corp-blue mt-6">1. Information We Collect</h3>
      <p>We collect information you provide directly to us when you fill out forms, request support, or communicate with us. This may include your name, email address, phone number, and any other details you choose to share.</p>
      <h3 className="text-xl font-bold text-corp-blue mt-6">2. How We Use Your Information</h3>
      <p>We use the information we collect to provide, maintain, and improve our services, communicate with you, and ensure compliance with our legal obligations.</p>
      <h3 className="text-xl font-bold text-corp-blue mt-6">3. Contact Us</h3>
      <p>If you have any questions about this Privacy Policy, please contact us at our registered office in Sankagiri, Tamil Nadu.</p>
    </>
  ),
  terms: (
    <>
      <p>Last Updated: {new Date().toLocaleDateString()}</p>
      <h3 className="text-xl font-bold text-corp-blue mt-6">1. Acceptance of Terms</h3>
      <p>By accessing and using the website of Raja Deepu Sooriya Private Limited, you accept and agree to be bound by the terms and provision of this agreement.</p>
      <h3 className="text-xl font-bold text-corp-blue mt-6">2. Intellectual Property</h3>
      <p>All content on this site, including text, graphics, logos, and images, is the property of Raja Deepu Sooriya Private Limited and protected by applicable copyright laws.</p>
      <h3 className="text-xl font-bold text-corp-blue mt-6">3. Governing Law</h3>
      <p>These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in Tamil Nadu.</p>
    </>
  ),
  disclaimer: (
    <>
      <h3 className="text-xl font-bold text-corp-blue mt-6">General Information</h3>
      <p>The information provided by Raja Deepu Sooriya Private Limited on this website is for general informational purposes only. All information on the site is provided in good faith, however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.</p>
      <h3 className="text-xl font-bold text-corp-blue mt-6">External Links</h3>
      <p>The site may contain links to other websites. Such external links are not investigated, monitored, or checked for accuracy by us.</p>
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
              <div><div className="text-white font-bold text-sm tracking-widest uppercase">Raja Deepu Sooriya</div><div className="text-blue-400 text-[10px] tracking-[0.2em] uppercase">Private Limited</div></div>
            </div>
            <p className="text-blue-300 text-sm leading-relaxed font-body max-w-xs mb-5">A DPIIT-recognised startup built on integrity, innovation, and shared vision — proudly rooted in Tamil Nadu.</p>
            
            {/* Social Icons */}
            <div className="flex gap-4 mt-6">
              <a href="#" className="w-8 h-8 rounded-sm bg-white/5 hover:bg-corp-red flex items-center justify-center text-white transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-sm bg-white/5 hover:bg-corp-red flex items-center justify-center text-white transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-sm bg-white/5 hover:bg-corp-red flex items-center justify-center text-white transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>
          <div>
            <div className="text-white font-bold text-xs tracking-widest uppercase mb-5">Statutory Details</div>
            <div className="space-y-3">
              {[["CIN", "U79120TZ2025PTC034817"], ["GSTIN", "33AAOCR6737N1ZN"], ["Cert. No.", "DIPP219259"]].map(([k, v]) => (
                <div key={k}><div className="text-blue-500 text-[10px] font-bold tracking-widest uppercase">{k}</div><div className="text-blue-200 text-xs font-mono leading-relaxed mt-0.5">{v}</div></div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-white font-bold text-xs tracking-widest uppercase mb-5">Registered Address</div>
            <address className="text-blue-300 text-xs leading-relaxed not-italic font-body mb-6">17/1 DS Apartment,<br />Tiruchengode Road,<br />Sankagiri — 637301,<br />Tamil Nadu, India</address>
          </div>
        </div>
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-blue-400 text-xs font-body text-center sm:text-left">© {new Date().getFullYear()} Raja Deepu Sooriya Private Limited. All rights reserved.</p>
          <div className="flex gap-6">
            <button onClick={() => setView("privacy")} className="text-blue-500 hover:text-blue-300 text-xs transition-colors font-body">Privacy Policy</button>
            <button onClick={() => setView("terms")} className="text-blue-500 hover:text-blue-300 text-xs transition-colors font-body">Terms of Service</button>
            <button onClick={() => setView("disclaimer")} className="text-blue-500 hover:text-blue-300 text-xs transition-colors font-body">Disclaimer</button>
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
      href="https://wa.me/YOUR_PHONE_NUMBER_HERE" // <-- REPLACE WITH YOUR NUMBER
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
          <Services />
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
