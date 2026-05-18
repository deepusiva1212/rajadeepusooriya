import { useState } from "react";

export default function Testimonials() {
  const [activeBrand, setActiveBrand] = useState("All");

  const reviews = [
    { name: "Suresh Kumar", company: "Coimbatore Retailers", brand: "MarketerRaja", text: "Our digital ad campaigns saw a 40% growth in reach within the first two months of transitioning management to MarketerRaja. Highly analytical team." },
    { name: "Ananya Iyer", company: "Traveler Community", brand: "MyTripRaja", text: "Completely flawless itinerary planning for our 15-person corporate retreat. Everything from the logistics to stays was handled seamlessly." },
    { name: "Rajavel P.", company: "Industrial Holdings", brand: "MarketerRaja", text: "Exceptional corporate positioning and brand architecture strategy. They understand B2B deployment perfectly." },
  ];

  const filteredReviews = activeBrand === "All" ? reviews : reviews.filter(r => r.brand === activeBrand);

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900 border-t border-b border-slate-200/60 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* BRAND LOGO SCROLLING RIBBON */}
        <div className="mb-16 overflow-hidden relative w-full">
          <div className="absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-900 z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-slate-50 to-transparent dark:from-slate-900 z-10 pointer-events-none" />
          
          <div className="flex gap-16 items-center whitespace-nowrap animate-[marquee_25s_linear_infinite] font-display font-black text-xl tracking-widest text-slate-300 dark:text-slate-700 uppercase">
            <span>✦ MYTRIPRAJA</span>
            <span>✦ MARKETERRAJA</span>
            <span>✦ RDS ENTERPRISE</span>
            <span>✦ COIMBATORE TRAVELS</span>
            <span>✦ DIGITAL INTEL</span>
            <span>✦ MYTRIPRAJA</span>
            <span>✦ MARKETERRAJA</span>
            <span>✦ RDS ENTERPRISE</span>
          </div>
        </div>

        {/* REVIEWS GRID HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase sm:text-3xl">Corporate Social Proof</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">Verified feedback from our active business ecosystems.</p>
          
          <div className="flex justify-center gap-2 mt-6">
            {["All", "MyTripRaja", "MarketerRaja"].map(b => (
              <button 
                key={b} 
                onClick={() => setActiveBrand(b)}
                className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${activeBrand === b ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* REVIEW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredReviews.map((rev, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-sm transition-all flex flex-col justify-between">
              <p className="text-slate-600 dark:text-slate-300 text-sm italic leading-relaxed">"{rev.text}"</p>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{rev.name}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{rev.company}</div>
                </div>
                <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">{rev.brand}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
