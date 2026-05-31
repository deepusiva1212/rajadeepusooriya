export default function Background() {
  return (
    <div className="fixed inset-0 z-[-1] bg-slate-950 overflow-hidden pointer-events-none">
      
      {/* Subtle Corporate Blue Ambient Glow */}
      <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-blue-900/30 blur-[120px]" />
      
      {/* Subtle Brand Red Ambient Glow */}
      <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-red-900/10 blur-[120px]" />
      
      {/* Subtle Brand Gold Ambient Glow */}
      <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-yellow-600/5 blur-[100px]" />

      {/* Elegant Architectural Grid (Fades out at the edges for depth) */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)'
        }}
      />
      
    </div>
  );
}
