import { useState, useRef, useEffect } from "react";

// ─── Review data ──────────────────────────────────────────────────────────────
const REVIEWS = [
  {
    name:    "Suresh Kumar",
    title:   "Marketing Head",
    company: "Coimbatore Retailers",
    brand:   "MarketerRaja",
    stars:   5,
    stat:    { value: "40%", label: "Growth in reach" },
    text:    "Our digital ad campaigns saw a 40% growth in reach within the first two months of transitioning management to MarketerRaja. Highly analytical team — every rupee spent is tracked.",
  },
  {
    name:    "Ananya Iyer",
    title:   "Operations Lead",
    company: "Traveler Community",
    brand:   "MyTripRaja",
    stars:   5,
    stat:    { value: "15", label: "People, zero issues" },
    text:    "Completely flawless itinerary planning for our 15-person corporate retreat. Everything from the logistics to stays was handled seamlessly. Will rebook without hesitation.",
  },
  {
    name:    "Rajavel P.",
    title:   "Director",
    company: "Industrial Holdings",
    brand:   "MarketerRaja",
    stars:   5,
    stat:    { value: "B2B", label: "Expertise delivered" },
    text:    "Exceptional corporate positioning and brand architecture strategy. They understand B2B deployment perfectly. The team is sharp, responsive, and results-driven.",
  },
];

// ─── Marquee items (doubled for seamless loop) ────────────────────────────────
const MARQUEE_BASE = [
  "✦ MYTRIPRAJA",
  "✦ MARKETERRAJA",
  "✦ RDS ENTERPRISE",
  "✦ DPIIT RECOGNISED",
  "✦ SANKAGIRI · TN",
  "✦ CORPORATE TRAVEL",
  "✦ DIGITAL GROWTH",
  "✦ BRAND STRATEGY",
];

// ─── Star row component ───────────────────────────────────────────────────────
function Stars({ count = 5 }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className="w-4 h-4"
          fill={i < count ? "#D4A017" : "none"}
          stroke={i < count ? "#D4A017" : "#D1D5DB"}
          strokeWidth="1"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────
function ReviewCard({ rev, visible, delay }) {
  const initial    = rev.name.charAt(0).toUpperCase();
  const isMyTrip   = rev.brand === "MyTripRaja";

  return (
    <div
      className="flex flex-col bg-white rounded-sm border border-gray-200
                 shadow-sm hover:shadow-xl hover:border-corp-gold hover:-translate-y-1
                 transition-all duration-300 overflow-hidden"
      style={{
        opacity:          visible ? 1 : 0,
        transform:        visible ? "translateY(0)" : "translateY(24px)",
        transition:       `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms,
                          box-shadow 0.2s ease, border-color 0.2s ease`,
      }}
    >
      {/* Top accent bar — brand colour */}
      <div className={`h-1 w-full ${isMyTrip ? "bg-corp-blue" : "bg-corp-red"}`} />

      <div className="p-7 flex flex-col flex-1">

        {/* Stars + brand pill row */}
        <div className="flex items-center justify-between mb-5">
          <Stars count={rev.stars} />
          <span
            className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm ${
              isMyTrip
                ? "text-corp-blue bg-blue-50"
                : "text-corp-red bg-red-50"
            }`}
          >
            {rev.brand}
          </span>
        </div>

        {/* Decorative quote mark */}
        <div
          className="font-display font-black text-7xl leading-none mb-2 select-none"
          style={{ color: "#D4A017", opacity: 0.18 }}
          aria-hidden="true"
        >
          "
        </div>

        {/* Review text */}
        <p className="text-gray-600 text-sm leading-relaxed font-body flex-1 -mt-6 relative z-10">
          {rev.text}
        </p>

        {/* Stat highlight */}
        <div
          className="mt-6 mb-5 px-4 py-3 rounded-sm flex items-center gap-4"
          style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.15)" }}
        >
          <div className="text-corp-gold font-display font-black text-2xl leading-none">
            {rev.stat.value}
          </div>
          <div className="text-gray-500 text-xs font-medium leading-tight">
            {rev.stat.label}
          </div>
        </div>

        {/* Author row */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          {/* Avatar */}
          <div
            className={`w-10 h-10 flex-shrink-0 rounded-sm flex items-center justify-center
                        text-white font-black text-base ${isMyTrip ? "bg-corp-blue" : "bg-corp-red"}`}
          >
            {initial}
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-tight">{rev.name}</div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5">
              {rev.title} · {rev.company}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Testimonials() {
  const [activeBrand, setActiveBrand] = useState("All");
  const [visible,     setVisible]     = useState(false);
  const sectionRef                    = useRef(null);
  const marqueeRef                    = useRef(null);

  // Scroll-reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // Marquee pause on hover
  const pauseMarquee  = () => { if (marqueeRef.current) marqueeRef.current.style.animationPlayState = "paused"; };
  const resumeMarquee = () => { if (marqueeRef.current) marqueeRef.current.style.animationPlayState = "running"; };

  const filtered =
    activeBrand === "All"
      ? REVIEWS
      : REVIEWS.filter(r => r.brand === activeBrand);

  return (
    <section
      ref={sectionRef}
      className="py-24 bg-white border-t border-b border-gray-200"
      id="testimonials"
    >
      {/* ── Keyframe injected inline (marquee not in tailwind.config) ───── */}
      <style>{`
        @keyframes rds-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .rds-marquee-track {
          animation: rds-marquee 28s linear infinite;
          will-change: transform;
        }
        .rds-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* ── Scrolling brand ribbon ───────────────────────────────────── */}
        <div
          className="relative overflow-hidden mb-16"
          onMouseEnter={pauseMarquee}
          onMouseLeave={resumeMarquee}
        >
          {/* Left fade — white background */}
          <div
            className="absolute left-0 top-0 h-full w-24 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right, #ffffff, transparent)" }}
          />
          {/* Right fade */}
          <div
            className="absolute right-0 top-0 h-full w-24 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to left, #ffffff, transparent)" }}
          />

          {/* Track — content duplicated for seamless loop */}
          <div
            ref={marqueeRef}
            className="rds-marquee-track flex items-center whitespace-nowrap"
            style={{ gap: "3rem" }}
          >
            {/* First copy */}
            {MARQUEE_BASE.map((item, i) => (
              <span
                key={`a-${i}`}
                className="font-display font-black text-lg tracking-widest uppercase"
                style={{ color: i % 3 === 1 ? "#D4A017" : "#E5E7EB" }}
              >
                {item}
              </span>
            ))}
            {/* Duplicate for seamless loop */}
            {MARQUEE_BASE.map((item, i) => (
              <span
                key={`b-${i}`}
                className="font-display font-black text-lg tracking-widest uppercase"
                style={{ color: i % 3 === 1 ? "#D4A017" : "#E5E7EB" }}
                aria-hidden="true"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* ── Section header ───────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-px bg-corp-red" />
            <span className="text-corp-red text-xs font-bold tracking-[0.25em] uppercase">
              Client Feedback
            </span>
            <div className="w-8 h-px bg-corp-red" />
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-black text-gray-900 mb-3">
            Corporate Social Proof
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
            Verified feedback from clients across MyTripRaja and MarketerRaja.
          </p>

          {/* Filter pills */}
          <div className="flex justify-center gap-2 mt-8 flex-wrap">
            {["All", "MyTripRaja", "MarketerRaja"].map(b => (
              <button
                key={b}
                onClick={() => setActiveBrand(b)}
                className={`px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-widest
                            transition-all duration-200 border ${
                  activeBrand === b
                    ? "bg-corp-blue text-white border-corp-blue shadow-md shadow-corp-blue/20"
                    : "bg-white text-gray-600 border-gray-200 hover:border-corp-blue hover:text-corp-blue"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* ── Review cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((rev, i) => (
            <ReviewCard
              key={rev.name}
              rev={rev}
              visible={visible}
              delay={i * 120}
            />
          ))}
        </div>

        {/* ── Bottom trust bar ─────────────────────────────────────────── */}
        <div className="mt-14 pt-10 border-t border-gray-100 flex flex-wrap justify-center gap-10">
          {[
            { value: "100%", label: "Client satisfaction target" },
            { value: "2",    label: "Operational brands" },
            { value: "5★",   label: "Average review rating" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="font-display font-black text-3xl text-corp-blue leading-none">
                {value}
              </div>
              <div className="text-gray-400 text-xs font-medium uppercase tracking-widest mt-1.5">
                {label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
