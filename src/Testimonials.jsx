import { useState } from "react";

const reviews = [
  {
    name: "Suresh Kumar",
    company: "Coimbatore Retailers",
    brand: "MarketerRaja",
    text: "Our digital ad campaigns saw a 40% growth in reach within the first two months of transitioning management to MarketerRaja. Highly analytical team.",
    stars: 5,
  },
  {
    name: "Ananya Iyer",
    company: "Traveler Community",
    brand: "MyTripRaja",
    text: "Completely flawless itinerary planning for our 15-person corporate retreat. Everything from the logistics to stays was handled seamlessly.",
    stars: 5,
  },
  {
    name: "Rajavel P.",
    company: "Industrial Holdings",
    brand: "MarketerRaja",
    text: "Exceptional corporate positioning and brand architecture strategy. They understand B2B deployment perfectly.",
    stars: 5,
  },
];

const MARQUEE_ITEMS = [
  "✦ MYTRIPRAJA",
  "✦ MARKETERRAJA",
  "✦ RDS ENTERPRISE",
  "✦ COIMBATORE TRAVELS",
  "✦ DIGITAL INTEL",
  "✦ MYTRIPRAJA",
  "✦ MARKETERRAJA",
  "✦ RDS ENTERPRISE",
];

export default function Testimonials() {
  const [activeBrand, setActiveBrand] = useState("All");
  const filtered =
    activeBrand === "All"
      ? reviews
      : reviews.filter((r) => r.brand === activeBrand);

  return (
    <section className="py-20 bg-corp-offwhite border-t border-b border-gray-200">
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track { animation: marquee 25s linear infinite; }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="mb-16 overflow-hidden relative w-full">
          <div className="absolute left-0 top-0 h-full w-20 pointer-events-none z-10"
            style={{ background: "linear-gradient(to right, #f8f9fa, transparent)" }} />
          <div className="absolute right-0 top-0 h-full w-20 pointer-events-none z-10"
            style={{ background: "linear-gradient(to left, #f8f9fa, transparent)" }} />

          <div className="flex gap-16 items-center whitespace-nowrap marquee-track
                          font-display font-black text-xl tracking-widest text-gray-300 uppercase">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        </div>

        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-px bg-corp-red" />
            <span className="text-corp-red text-xs font-bold tracking-[0.25em] uppercase">
              What They Say
            </span>
            <div className="w-8 h-px bg-corp-red" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            Corporate Social Proof
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Verified feedback from our active business ecosystems.
          </p>

          <div className="flex justify-center gap-2 mt-6 flex-wrap">
            {["All", "MyTripRaja", "MarketerRaja"].map((b) => (
              <button
                key={b}
                onClick={() => setActiveBrand(b)}
                className={`px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest transition-all border ${
                  activeBrand === b
                    ? "bg-corp-blue text-white border-corp-blue"
                    : "bg-white text-gray-600 border-gray-200 hover:border-corp-blue"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((rev, i) => (
            <div
              key={i}
              className="bg-white p-7 rounded-sm border border-gray-200 shadow-sm
                         hover:shadow-md hover:border-corp-gold transition-all duration-300
                         flex flex-col justify-between"
            >
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: rev.stars }).map((_, s) => (
                  <svg key={s} className="w-4 h-4" viewBox="0 0 20 20" fill="#D4A017">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 text-sm italic leading-relaxed flex-1">
                "{rev.text}"
              </p>
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-900 text-sm">{rev.name}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    {rev.company}
                  </div>
                </div>
                <span
                  className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${
                    rev.brand === "MyTripRaja"
                      ? "text-corp-blue bg-blue-50"
                      : "text-corp-red bg-red-50"
                  }`}
                >
                  {rev.brand}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
