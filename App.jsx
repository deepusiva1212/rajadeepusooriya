import { useState, useEffect, useRef } from "react";

// ─── Color tokens (mirrors tailwind.config.js) ───────────────────────────────
// corp-blue : #0A2342   corp-blue-mid : #1B3F72   corp-blue-light : #2563EB
// corp-red  : #9B1C1C   corp-red-mid  : #B91C1C   corp-red-bright : #DC2626

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
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = ["About", "Services", "Contact"];

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-corp-blue shadow-xl shadow-black/30" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16 lg:h-20">
        {/* Logo */}
        <a href="#hero" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded bg-corp-red flex items-center justify-center text-white font-black text-sm tracking-tight leading-none select-none">
            RDS
          </div>
          <div className="hidden sm:block leading-tight">
            <span className="block text-white font-bold text-sm tracking-widest uppercase">Raja Deepu Sooriya</span>
            <span className="block text-blue-300 text-[10px] tracking-[0.2em] uppercase">Private Limited</span>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase()}`}
              className="text-blue-200 hover:text-white text-sm font-medium tracking-widest uppercase transition-colors duration-200 relative group">
              {l}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-corp-red group-hover:w-full transition-all duration-300" />
            </a>
          ))}
          <a href="#contact"
            className="ml-4 px-5 py-2 bg-corp-red hover:bg-corp-red-mid text-white text-xs font-bold tracking-widest uppercase transition-colors duration-200 rounded-sm">
            Get In Touch
          </a>
        </nav>

        {/* Mobile burger */}
        <button className="md:hidden text-white p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          <div className="w-5 h-px bg-white mb-1.5 transition-all" style={{ transform: open ? "rotate(45deg) translate(2px,6px)" : "" }} />
          <div className="w-5 h-px bg-white mb-1.5 transition-all" style={{ opacity: open ? 0 : 1 }} />
          <div className="w-5 h-px bg-white transition-all" style={{ transform: open ? "rotate(-45deg) translate(2px,-6px)" : "" }} />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden bg-corp-blue border-t border-white/10 overflow-hidden transition-all duration-300 ${open ? "max-h-60" : "max-h-0"}`}>
        {links.map(l => (
          <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)}
            className="block px-6 py-3 text-blue-200 hover:text-white text-sm font-medium tracking-widest uppercase border-b border-white/5">
            {l}
          </a>
        ))}
      </div>
    </header>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden bg-corp-blue">
      {/* Geometric background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-[480px] h-[480px] border border-white/5 rounded-full" />
        <div className="absolute -top-12 -right-12 w-[360px] h-[360px] border border-white/5 rounded-full" />
        <div className="absolute top-1/2 -left-40 w-[600px] h-[600px] bg-corp-blue-mid/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-corp-red/10 rounded-full blur-3xl" />
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Red accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-corp-red to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-28 pb-20 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 border border-corp-red/40 bg-corp-red/10 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-corp-red animate-pulse" />
            <span className="text-corp-red-bright text-xs font-bold tracking-[0.25em] uppercase">DPIIT Recognised Startup</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-black text-white leading-[1.05] tracking-tight mb-6">
            Building Tomorrow's<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-corp-red-bright to-red-400">
              Business Legacy
            </span>
          </h1>

          <p className="text-blue-200 text-base sm:text-lg leading-relaxed max-w-lg mb-10 font-body">
            Raja Deepu Sooriya Private Limited is a dynamic, innovation-driven enterprise committed to delivering exceptional value across diverse business sectors — founded on trust, integrity, and shared vision.
          </p>

          <div className="flex flex-wrap gap-4">
            <a href="#about"
              className="px-7 py-3 bg-corp-red hover:bg-corp-red-mid text-white font-bold text-sm tracking-widest uppercase transition-all duration-200 rounded-sm shadow-lg shadow-corp-red/20">
              Discover Us
            </a>
            <a href="#contact"
              className="px-7 py-3 border border-white/20 hover:border-white/50 text-white font-bold text-sm tracking-widest uppercase transition-all duration-200 rounded-sm">
              Contact Us
            </a>
          </div>

          {/* Stats row */}
          <div className="flex gap-8 mt-14 pt-8 border-t border-white/10">
            {[["2025", "Founded"], ["DIPP219259", "Cert. No."], ["TN", "Tamil Nadu"]].map(([val, label]) => (
              <div key={label}>
                <div className="text-white font-black text-xl tracking-tight">{val}</div>
                <div className="text-blue-400 text-xs font-medium tracking-widest uppercase mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — abstract card */}
        <div className="hidden lg:flex justify-end">
          <div className="relative w-[400px] h-[460px]">
            <div className="absolute inset-0 bg-corp-blue-mid/50 border border-white/10 rounded-sm backdrop-blur-sm" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-corp-red via-corp-red-bright to-transparent rounded-t-sm" />
            <div className="relative p-8 h-full flex flex-col justify-between">
              <div>
                <div className="text-blue-400 text-xs tracking-[0.2em] uppercase font-medium mb-4">Corporate Identity</div>
                {[
                  ["CIN", "U79120TZ2025PTC034817"],
                  ["GSTIN", "33AAOCR6737N1ZN"],
                  ["Status", "Active · Private Limited"],
                  ["Incorporation", "2025, Tamil Nadu"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-start py-3 border-b border-white/8 last:border-0">
                    <span className="text-blue-400 text-xs font-medium tracking-wider uppercase">{k}</span>
                    <span className="text-white text-xs font-mono text-right max-w-[55%] leading-relaxed">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-corp-red/10 border border-corp-red/20 rounded-sm">
                <div className="text-corp-red-bright text-xs font-bold tracking-widest uppercase mb-1">Registered Address</div>
                <div className="text-blue-200 text-xs leading-relaxed font-body">
                  17/1 DS Apartment, Tiruchengode Road,<br />
                  Sankagiri — 637301, Tamil Nadu
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <div className="w-px h-10 bg-gradient-to-b from-white/0 to-white/30" />
        <span className="text-white/30 text-[10px] tracking-widest uppercase">Scroll</span>
      </div>
    </section>
  );
}

// ─── ABOUT ────────────────────────────────────────────────────────────────────
function About() {
  const [ref, visible] = useInView();
  const directors = [
    {
      initial: "R", name: "Raja", role: "Director & Co-Founder",
      desc: "Visionary leader driving corporate strategy and stakeholder relationships with over a decade of entrepreneurial experience.",
      color: "corp-blue"
    },
    {
      initial: "D", name: "Deepu", role: "Director & Co-Founder",
      desc: "Operations specialist ensuring seamless delivery, process excellence, and sustainable business growth.",
      color: "corp-red"
    },
    {
      initial: "S", name: "Sooriya", role: "Director & Co-Founder",
      desc: "Technology and innovation champion, building digital capabilities that power the company's competitive edge.",
      color: "corp-blue-mid"
    },
  ];

  return (
    <section id="about" className="py-24 lg:py-32 bg-neutral-50">
      <div ref={ref} className={`max-w-7xl mx-auto px-6 lg:px-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        {/* Section label */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-corp-red" />
          <span className="text-corp-red text-xs font-bold tracking-[0.25em] uppercase">About Us</span>
        </div>
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-black text-corp-blue leading-tight mb-6">
              A Partnership Built on<br />
              <span className="text-corp-red">Shared Vision</span>
            </h2>
            <p className="text-gray-600 text-base leading-relaxed mb-5 font-body">
              Raja Deepu Sooriya Private Limited was incorporated in 2025 as a DPIIT-recognised startup, embodying the combined ambition and expertise of three co-founders whose complementary strengths form the backbone of the company.
            </p>
            <p className="text-gray-600 text-base leading-relaxed mb-8 font-body">
              Headquartered in Sankagiri, Tamil Nadu, the company operates with a commitment to transparency, corporate governance, and long-term value creation for all stakeholders.
            </p>

            {/* Key pillars */}
            <div className="grid grid-cols-2 gap-4">
              {[
                ["⚖️", "Integrity First", "Every decision anchored in ethics and accountability."],
                ["🚀", "Innovation-Led", "Leveraging technology to stay ahead of the curve."],
                ["🤝", "Client-Centric", "Partnerships built on trust and measurable outcomes."],
                ["🌱", "Sustainable Growth", "Long-term thinking in every business decision."],
              ].map(([icon, title, desc]) => (
                <div key={title} className="p-4 bg-white border border-gray-100 rounded-sm hover:border-corp-blue/30 hover:shadow-md transition-all duration-200">
                  <div className="text-xl mb-2">{icon}</div>
                  <div className="text-corp-blue font-bold text-sm mb-1">{title}</div>
                  <div className="text-gray-500 text-xs leading-relaxed font-body">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Directors */}
          <div className="space-y-4">
            <div className="text-corp-blue font-bold text-sm tracking-widest uppercase mb-6">Board of Directors</div>
            {directors.map((d, i) => (
              <div key={d.name}
                className={`flex gap-5 p-5 bg-white border border-gray-100 rounded-sm hover:shadow-lg hover:border-corp-blue/20 transition-all duration-300`}
                style={{ transitionDelay: `${i * 100}ms` }}>
                <div className={`w-12 h-12 flex-shrink-0 rounded-sm flex items-center justify-center text-white font-black text-lg ${d.color === "corp-red" ? "bg-corp-red" : d.color === "corp-blue-mid" ? "bg-corp-blue-mid" : "bg-corp-blue"}`}>
                  {d.initial}
                </div>
                <div>
                  <div className="text-corp-blue font-black text-base">{d.name}</div>
                  <div className="text-corp-red text-xs font-bold tracking-widest uppercase mb-2">{d.role}</div>
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
    {
      icon: "📊", title: "Business Consulting",
      desc: "Strategic advisory services that help businesses navigate complexity, optimise operations, and unlock new growth pathways.",
      tag: "Advisory"
    },
    {
      icon: "💻", title: "Technology Solutions",
      desc: "Custom digital transformation, software development, and IT infrastructure support tailored to your business needs.",
      tag: "Tech"
    },
    {
      icon: "📦", title: "Trade & Distribution",
      desc: "Reliable supply chain management and product distribution across Tamil Nadu and beyond, built on a robust partner network.",
      tag: "Commerce"
    },
    {
      icon: "🏗️", title: "Project Management",
      desc: "End-to-end project execution with transparent governance, milestone tracking, and quality assurance at every stage.",
      tag: "Operations"
    },
    {
      icon: "📋", title: "Compliance & Legal",
      desc: "Corporate governance, regulatory compliance, and statutory filing support to keep your business on solid legal footing.",
      tag: "Governance"
    },
    {
      icon: "🌐", title: "Digital Marketing",
      desc: "Data-driven marketing strategies, brand positioning, and digital presence management that deliver measurable ROI.",
      tag: "Growth"
    },
  ];

  return (
    <section id="services" className="py-24 lg:py-32 bg-corp-blue relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-[0.04]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dot" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot)" />
        </svg>
      </div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div ref={ref} className={`relative max-w-7xl mx-auto px-6 lg:px-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-corp-red" />
          <span className="text-corp-red text-xs font-bold tracking-[0.25em] uppercase">Our Services</span>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-8 mb-16">
          <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-black text-white leading-tight">
            Business Sectors &<br />Service Offerings
          </h2>
          <p className="text-blue-300 text-base leading-relaxed self-end font-body">
            Our diversified service portfolio enables us to serve clients across multiple sectors with consistency, quality, and professional rigour.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <div key={s.title}
              className="group relative p-6 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 hover:border-corp-red/40 transition-all duration-300 cursor-default"
              style={{ transitionDelay: `${i * 60}ms` }}>
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

  const handle = (e) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" className="py-24 lg:py-32 bg-white">
      <div ref={ref} className={`max-w-7xl mx-auto px-6 lg:px-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-corp-red" />
              <span className="text-corp-red text-xs font-bold tracking-[0.25em] uppercase">Contact Us</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-black text-corp-blue leading-tight mb-6">
              Let's Start a<br />
              <span className="text-corp-red">Conversation</span>
            </h2>
            <p className="text-gray-600 text-base leading-relaxed mb-10 font-body">
              Whether you have a business inquiry, partnership proposal, or simply wish to learn more about our services, our team is ready to assist you promptly.
            </p>

            <div className="space-y-5">
              {[
                ["📍", "Registered Office", "17/1 DS Apartment, Tiruchengode Road, Sankagiri — 637301, Tamil Nadu"],
                ["🏛️", "CIN", "U79120TZ2025PTC034817"],
                ["🔑", "GSTIN", "33AAOCR6737N1ZN"],
              ].map(([icon, label, value]) => (
                <div key={label} className="flex gap-4">
                  <div className="w-10 h-10 flex-shrink-0 bg-corp-blue/5 rounded-sm flex items-center justify-center text-lg">{icon}</div>
                  <div>
                    <div className="text-corp-blue font-bold text-xs tracking-widest uppercase mb-0.5">{label}</div>
                    <div className="text-gray-600 text-sm font-mono leading-relaxed">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-neutral-50 border border-gray-100 rounded-sm p-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-2xl mb-4">✅</div>
                <div className="text-corp-blue font-black text-xl mb-2">Message Received</div>
                <p className="text-gray-500 text-sm font-body">Thank you for reaching out. Our team will get back to you within 1–2 business days.</p>
                <button onClick={() => setSent(false)} className="mt-6 text-corp-red text-sm font-bold underline underline-offset-2">Send Another</button>
              </div>
            ) : (
              <form onSubmit={handle} className="space-y-5">
                <div className="text-corp-blue font-black text-lg mb-6">Send Us a Message</div>
                {["name", "email"].map(field => (
                  <div key={field}>
                    <label className="block text-corp-blue text-xs font-bold tracking-widest uppercase mb-2">{field}</label>
                    <input
                      type={field === "email" ? "email" : "text"}
                      required
                      value={form[field]}
                      onChange={e => setForm({ ...form, [field]: e.target.value })}
                      placeholder={field === "name" ? "Your full name" : "your@email.com"}
                      className="w-full px-4 py-3 border border-gray-200 rounded-sm bg-white text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:border-corp-blue focus:ring-1 focus:ring-corp-blue/20 transition-all font-body"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-corp-blue text-xs font-bold tracking-widest uppercase mb-2">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder="How can we help you?"
                    className="w-full px-4 py-3 border border-gray-200 rounded-sm bg-white text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:border-corp-blue focus:ring-1 focus:ring-corp-blue/20 transition-all resize-none font-body"
                  />
                </div>
                <button type="submit"
                  className="w-full py-3.5 bg-corp-red hover:bg-corp-red-mid text-white font-bold text-sm tracking-widest uppercase transition-colors duration-200 rounded-sm shadow-lg shadow-corp-red/20">
                  Submit Enquiry
                </button>
                <p className="text-gray-400 text-xs text-center font-body">Your information is handled with strict confidentiality.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-corp-blue border-t-4 border-corp-red">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded bg-corp-red flex items-center justify-center text-white font-black text-sm">RDS</div>
              <div>
                <div className="text-white font-bold text-sm tracking-widest uppercase">Raja Deepu Sooriya</div>
                <div className="text-blue-400 text-[10px] tracking-[0.2em] uppercase">Private Limited</div>
              </div>
            </div>
            <p className="text-blue-300 text-sm leading-relaxed font-body max-w-xs mb-5">
              A DPIIT-recognised startup built on integrity, innovation, and shared vision — proudly rooted in Tamil Nadu.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-corp-red/30 bg-corp-red/10 rounded-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-corp-red-bright" />
              <span className="text-corp-red-bright text-[10px] font-bold tracking-[0.2em] uppercase">DPIIT Recognised Startup · DIPP219259</span>
            </div>
          </div>

          {/* Statutory */}
          <div>
            <div className="text-white font-bold text-xs tracking-widest uppercase mb-5">Statutory Details</div>
            <div className="space-y-3">
              {[
                ["CIN", "U79120TZ2025PTC034817"],
                ["GSTIN", "33AAOCR6737N1ZN"],
                ["Cert. No.", "DIPP219259"],
                ["State", "Tamil Nadu · India"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-blue-500 text-[10px] font-bold tracking-widest uppercase">{k}</div>
                  <div className="text-blue-200 text-xs font-mono leading-relaxed mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Address + Links */}
          <div>
            <div className="text-white font-bold text-xs tracking-widest uppercase mb-5">Registered Address</div>
            <address className="text-blue-300 text-xs leading-relaxed not-italic font-body mb-6">
              17/1 DS Apartment,<br />
              Tiruchengode Road,<br />
              Sankagiri — 637301,<br />
              Tamil Nadu, India
            </address>
            <div className="text-white font-bold text-xs tracking-widest uppercase mb-3">Quick Links</div>
            <div className="space-y-2">
              {["About Us", "Services", "Contact"].map(l => (
                <a key={l} href={`#${l.split(" ")[0].toLowerCase()}`}
                  className="block text-blue-300 hover:text-white text-xs transition-colors font-body">{l}</a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-blue-400 text-xs font-body text-center sm:text-left">
            © {new Date().getFullYear()} Raja Deepu Sooriya Private Limited. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Disclaimer"].map(l => (
              <a key={l} href="#" className="text-blue-500 hover:text-blue-300 text-xs transition-colors font-body">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="font-body antialiased">
      <Navbar />
      <Hero />
      <About />
      <Services />
      <Contact />
      <Footer />
    </div>
  );
}
