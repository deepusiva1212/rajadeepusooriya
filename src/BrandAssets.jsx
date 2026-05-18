import { useState } from "react";

export default function BrandAssets() {
  const [copied, setCopied] = useState("");

  const copyHex = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(""), 2000);
  };

  const brands = [
    {
      name: "Raja Deepu Sooriya",
      type: "Master Corporate Entity",
      colors: [{ name: "Corporate Navy", hex: "#0f172a" }, { name: "Executive Gold", hex: "#fbbf24" }, { name: "Pure White", hex: "#ffffff" }],
      font: "Playfair Display & Inter",
      rules: "Flat colors only. Strictly no drop-shadows, gradients, or reflective UI elements on primary logo usage."
    },
    {
      name: "MyTripRaja",
      type: "Travel & Operations",
      colors: [{ name: "Ocean Blue", hex: "#2563eb" }, { name: "Sky Light", hex: "#bae6fd" }, { name: "Sunset Orange", hex: "#f97316" }],
      font: "Inter (Bold weights)",
      rules: "Optimized for high visibility. Use flat solid fills for all digital banners."
    },
    {
      name: "MarketerRaja",
      type: "Digital Intelligence Squad",
      colors: [{ name: "Tech Indigo", hex: "#4f46e5" }, { name: "Growth Emerald", hex: "#10b981" }, { name: "Dark Slate", hex: "#1e293b" }],
      font: "Inter (Medium/Black)",
      rules: "Minimalist and sharp. No 3D effects on vector assets."
    }
  ];

  return (
    <div className="animate-fade-in text-slate-800 space-y-8">
      <div>
        <h3 className="font-display text-2xl font-bold text-slate-900">Brand Asset Library</h3>
        <p className="text-xs text-slate-500 mt-1">Official colors, typography, and design rules for corporate divisions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {brands.map((brand) => (
          <div key={brand.name} className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 border-b border-slate-100 flex-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">{brand.type}</div>
              <h4 className="font-bold text-lg text-slate-900 mb-4">{brand.name}</h4>
              
              <div className="space-y-4">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Official Color Palette</div>
                  <div className="flex gap-2">
                    {brand.colors.map(color => (
                      <div key={color.hex} className="group relative cursor-pointer" onClick={() => copyHex(color.hex)}>
                        <div className="w-10 h-10 rounded-md border border-slate-200 shadow-sm transition-transform active:scale-95" style={{ backgroundColor: color.hex }} />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {copied === color.hex ? "Copied!" : color.hex}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Typography</div>
                  <div className="text-sm font-bold text-slate-700">{brand.font}</div>
                </div>

                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Strict Design Rule</div>
                  <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">"{brand.rules}"</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
