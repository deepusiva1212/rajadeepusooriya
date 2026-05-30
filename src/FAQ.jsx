/**
 * src/FAQ.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FAQ section for the RDS homepage.
 * Questions exactly match the FAQPage JSON-LD schema in index.html so Google
 * can show rich snippet answers directly in search results.
 *
 * PLACEMENT in App.jsx — between <Brands /> and <Blog />:
 *   <Brands />
 *   <FAQ />       ← add this line
 *   <Blog />
 *   <Contact />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useRef, useEffect } from "react";

// ─── FAQ data — MUST match index.html FAQPage JSON-LD exactly ────────────────
const FAQS = [
  {
    q: "What is Raja Deepu Sooriya Private Limited?",
    a: "Raja Deepu Sooriya Private Limited is a DPIIT Recognised Startup (DIPP219259) incorporated in 2025, operating two brands: MyTripRaja — a comprehensive travel and tourism platform — and MarketerRaja — a full-service digital marketing agency. CIN: U79120TZ2025PTC034817. Headquartered in Sankagiri, Tamil Nadu.",
  },
  {
    q: "What is the CIN of Raja Deepu Sooriya Private Limited?",
    a: "The Corporate Identification Number (CIN) of Raja Deepu Sooriya Private Limited is U79120TZ2025PTC034817. The company is also registered under GSTIN 33AAOCR6737N1ZN and holds DPIIT Startup Recognition Certificate No. DIPP219259.",
  },
  {
    q: "Does Raja Deepu Sooriya Private Limited offer internships?",
    a: "Yes. We offer a structured internship programme across three tracks: 1-month (Short Track), 3-month (Standard Track), and 6-month (Advanced Track). Interns work on live projects at our Sankagiri headquarters across Travel Technology (MyTripRaja) and Digital Marketing (MarketerRaja). All tracks receive an Internship Certificate; longer tracks receive additional Live Project Experience Letters.",
  },
  {
    q: "What brands does Raja Deepu Sooriya operate?",
    a: "Raja Deepu Sooriya Private Limited operates two enterprise brands: MyTripRaja (mytripraja.com) — a comprehensive online travel and tourism platform providing seamless booking experiences and curated tour packages — and MarketerRaja (marketerraja.com) — a full-service digital marketing agency specialising in SEO, targeted ad campaigns, social media management, and strategic brand positioning.",
  },
];

// ─── AnimatedAccordion item ───────────────────────────────────────────────────
function AccordionItem({ item, index, isOpen, onToggle }) {
  const bodyRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (bodyRef.current) {
      setHeight(isOpen ? bodyRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div
      className={`border border-white/10 rounded-sm overflow-hidden transition-all duration-300 ${
        isOpen
          ? "bg-white/8 border-corp-gold/40"
          : "bg-white/4 hover:bg-white/6 hover:border-white/20"
      }`}
    >
      {/* Question button */}
      <button
        onClick={() => onToggle(index)}
        className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left group"
        aria-expanded={isOpen}
      >
        {/* Number + question */}
        <div className="flex items-start gap-4 min-w-0">
          <span
            className={`font-display font-black text-lg leading-none mt-0.5 flex-shrink-0 transition-colors duration-200 ${
              isOpen ? "text-corp-gold" : "text-white/20 group-hover:text-white/40"
            }`}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            className={`font-body font-semibold text-base leading-snug transition-colors duration-200 ${
              isOpen ? "text-white" : "text-gray-300 group-hover:text-white"
            }`}
          >
            {item.q}
          </span>
        </div>

        {/* Chevron icon */}
        <span
          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 transition-all duration-300 ${
            isOpen
              ? "bg-corp-gold text-corp-blue rotate-180"
              : "bg-white/10 text-white/50 group-hover:bg-white/20"
          }`}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="w-3 h-3"
          >
            <path d="M3 5.5l5 5 5-5" />
          </svg>
        </span>
      </button>

      {/* Answer — animated height */}
      <div
        style={{ height: `${height}px`, transition: "height 0.32s cubic-bezier(0.4,0,0.2,1)" }}
        className="overflow-hidden"
      >
        <div ref={bodyRef} className="px-6 pb-6 pt-0">
          {/* Gold left accent bar */}
          <div className="flex gap-4">
            <div className="w-px flex-shrink-0 bg-corp-gold/50 self-stretch ml-[1.875rem]" />
            <p className="text-gray-400 text-sm leading-relaxed font-body">{item.a}</p>
          </div>

          {/* Inline links for relevant items */}
          {index === 2 && (
            <div className="mt-4 ml-[calc(1.875rem+1rem+1px)]">
              <button
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("rds-navigate", { detail: "internships" })
                  )
                }
                className="inline-flex items-center gap-1.5 text-corp-gold text-xs font-bold tracking-widest uppercase border-b border-corp-gold/40 pb-0.5 hover:border-corp-gold transition-colors"
              >
                Apply for Internship
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                  <path d="M2 6h8M6 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
          {index === 3 && (
            <div className="mt-4 ml-[calc(1.875rem+1rem+1px)] flex flex-wrap gap-4">
              <a
                href="https://www.mytripraja.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-corp-gold text-xs font-bold tracking-widest uppercase border-b border-corp-gold/40 pb-0.5 hover:border-corp-gold transition-colors"
              >
                Visit MyTripRaja
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                  <path d="M2 6h8M6 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a
                href="https://marketerraja.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-corp-gold text-xs font-bold tracking-widest uppercase border-b border-corp-gold/40 pb-0.5 hover:border-corp-gold transition-colors"
              >
                Visit MarketerRaja
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                  <path d="M2 6h8M6 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main FAQ section ─────────────────────────────────────────────────────────
export default function FAQ({ navigateTo }) {
  const [openIndex, setOpenIndex] = useState(0); // first item open by default
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // Listen for internal navigation events from AccordionItem
  useEffect(() => {
    const handler = (e) => { if (navigateTo) navigateTo(e.detail); };
    window.addEventListener("rds-navigate", handler);
    return () => window.removeEventListener("rds-navigate", handler);
  }, [navigateTo]);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section
      id="faq"
      className="py-24 lg:py-32 bg-corp-blue relative overflow-hidden"
    >
      {/* Faint background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="faq-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#faq-grid)" />
        </svg>
      </div>

      {/* Top separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div
        ref={sectionRef}
        className={`relative max-w-7xl mx-auto px-6 lg:px-10 transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Header */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          {/* Left — label + headline + subtext */}
          <div className="lg:sticky lg:top-28">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-corp-gold" />
              <span className="text-corp-gold text-xs font-bold tracking-[0.25em] uppercase">
                Frequently Asked
              </span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-black text-white leading-tight mb-6">
              Questions &<br />
              <span className="text-corp-gold">Answers</span>
            </h2>

            <p className="text-gray-400 text-base leading-relaxed font-body mb-8 max-w-sm">
              Everything you need to know about Raja Deepu Sooriya Private
              Limited, our brands, and how to work with us.
            </p>

            {/* Statutory quick-ref card */}
            <div className="bg-white/5 border border-white/10 rounded-sm p-5 space-y-3">
              {[
                ["CIN",   "U79120TZ2025PTC034817"],
                ["GSTIN", "33AAOCR6737N1ZN"],
                ["DPIIT", "DIPP219259"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-gray-500 text-[10px] font-bold tracking-[0.18em] uppercase flex-shrink-0">
                    {label}
                  </span>
                  <span className="text-gray-300 text-xs font-mono truncate">{value}</span>
                </div>
              ))}
            </div>

            {/* Google rich result hint */}
            <p className="mt-5 text-gray-600 text-[11px] font-body leading-relaxed">
              These answers appear directly in Google search results as rich snippets.
            </p>
          </div>

          {/* Right — accordion */}
          <div className="space-y-3">
            {FAQS.map((item, i) => (
              <AccordionItem
                key={i}
                item={item}
                index={i}
                isOpen={openIndex === i}
                onToggle={toggle}
              />
            ))}

            {/* Bottom CTA */}
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigateTo && navigateTo("internships")}
                className="flex-1 py-3.5 bg-corp-red hover:bg-corp-red-dark text-white font-bold text-xs tracking-widest uppercase rounded-sm transition-colors duration-200 text-center"
              >
                Apply for Internship
              </button>
              <a
                href="#contact"
                className="flex-1 py-3.5 border border-white/20 hover:border-corp-gold text-white font-bold text-xs tracking-widest uppercase rounded-sm transition-colors duration-200 text-center"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom separator */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </section>
  );
}
