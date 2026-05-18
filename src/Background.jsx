/**
 * Background.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Raja Deepu Sooriya Private Limited
 * Google Antigravity-style physics background animation.
 *
 * WHAT IT DOES:
 *  • Elements float upward with gentle antigravity (like Google's easter egg)
 *  • Mouse attracts nearby particles (gravity well on hover)
 *  • Click anywhere for an "explosion" burst — particles scatter then drift back up
 *  • Elements bounce off side/bottom walls, escape off the top and respawn below
 *  • Gold connecting lines between close particles (your brand color)
 *  • Floating brand elements: RDS logo pill, ◆ diamonds, ▲ triangles, ● dots
 *  • Fully respects reduced-motion preference
 *  • High-DPI (Retina) aware — crisp on all screens
 *  • Zero dependencies beyond React
 *
 * DROP-IN REPLACEMENT:
 *  This file is a direct drop-in for your existing Background.jsx.
 *  No changes needed in App.jsx — it is already imported as <Background />.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from "react";

// ─── Brand palette (matches your tailwind.config.js exactly) ─────────────────
const BRAND = {
  bg:       "#051324",   // corp-blue  — deep navy background
  gold:     "#D4A017",   // corp-gold  — connecting lines & text elements
  red:      "#C8102E",   // corp-red   — accent particles
  blueMid:  "#0f2940",   // corp-blue-mid — secondary particles
  white:    "rgba(255,255,255,",
};

// ─── Shapes that float up (Google antigravity inspired) ──────────────────────
const SHAPES = ["circle", "diamond", "triangle", "rds-pill", "dot-ring"];

// ─── Physics tuning ──────────────────────────────────────────────────────────
const CFG = {
  COUNT_DESKTOP:   85,
  COUNT_MOBILE:    40,
  ANTIGRAVITY:     0.012,    // upward force per frame (the "floating" feeling)
  MOUSE_RADIUS:    160,      // pixels around cursor that attract particles
  MOUSE_FORCE:     0.00022,  // attraction strength
  REPEL_RADIUS:    65,       // inside this distance: push away (not suck in)
  DAMPING:         0.982,    // velocity bleed per frame (keeps speed stable)
  WALL_BOUNCE:     0.45,     // energy retained on wall hit
  MAX_SPEED:       2.4,
  CONNECT_DIST:    130,      // max distance for gold connecting lines
  LINE_ALPHA_MAX:  0.18,     // max opacity of connecting lines
  TURBULENCE:      0.018,    // per-frame random drift (organic feel)
  SPAWN_SPREAD_X:  0.85,     // fraction of width used for spawn spread
};

// ─────────────────────────────────────────────────────────────────────────────
// Particle class
// ─────────────────────────────────────────────────────────────────────────────
class Particle {
  constructor(W, H, index, total) {
    this.reset(W, H);
    // Stagger initial positions across whole canvas (not just bottom)
    this.y = Math.random() * H;
    this.vy = -(Math.random() * 0.4 + 0.1); // start gently drifting up

    // Shape type cycling
    this.shape   = SHAPES[index % SHAPES.length];
    this.isLabel = this.shape === "rds-pill";

    // Size — labels are bigger
    this.size    = this.isLabel
      ? 22 + Math.random() * 10
      : 3 + Math.random() * 14;

    // Color
    const palette = [BRAND.white + "0.25)", BRAND.white + "0.15)", BRAND.gold, BRAND.red, BRAND.white + "0.18)"];
    this.color   = this.isLabel ? BRAND.gold : palette[index % palette.length];

    // Rotation
    this.angle   = Math.random() * Math.PI * 2;
    this.spin    = (Math.random() - 0.5) * 0.012;

    // Pulse
    this.pulseT  = Math.random() * Math.PI * 2;
    this.pulseS  = 0.006 + Math.random() * 0.006;

    // Mass (affects gravity response)
    this.mass    = this.size * 0.5;

    // Glow flag (a few particles get a soft corona)
    this.glows   = Math.random() > 0.78 && !this.isLabel;
  }

  reset(W, H) {
    // Respawn at random x across bottom, with slight random upward velocity
    this.x   = (Math.random() * CFG.SPAWN_SPREAD_X + (1 - CFG.SPAWN_SPREAD_X) / 2) * W;
    this.y   = H + 20 + Math.random() * 60;
    this.vx  = (Math.random() - 0.5) * 0.6;
    this.vy  = -(Math.random() * 0.5 + 0.15);
  }

  // ── Update physics for this frame ──────────────────────────────────────────
  update(W, H, mouse, explosions) {
    // Antigravity — gentle upward push
    this.vy -= CFG.ANTIGRAVITY * (0.7 + Math.sin(this.pulseT) * 0.3);

    // Mouse gravity / repulsion
    if (mouse.active) {
      const dx   = mouse.x - this.x;
      const dy   = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      if (dist < CFG.MOUSE_RADIUS) {
        const dir   = dist < CFG.REPEL_RADIUS ? -1.8 : 1;   // repel when very close
        const force = dir * CFG.MOUSE_FORCE * this.mass * (CFG.MOUSE_RADIUS - dist);
        this.vx += (force * dx) / dist;
        this.vy += (force * dy) / dist;
      }
    }

    // Explosion bursts (on click)
    for (const exp of explosions) {
      const dx   = this.x - exp.x;
      const dy   = this.y - exp.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist < exp.radius) {
        const force = exp.strength * (1 - dist / exp.radius) / dist;
        this.vx += force * dx;
        this.vy += force * dy;
      }
    }

    // Turbulence (organic drift)
    this.vx += (Math.random() - 0.5) * CFG.TURBULENCE;
    this.vy += (Math.random() - 0.5) * CFG.TURBULENCE;

    // Speed cap
    const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (spd > CFG.MAX_SPEED) { this.vx = (this.vx / spd) * CFG.MAX_SPEED; this.vy = (this.vy / spd) * CFG.MAX_SPEED; }

    // Damping
    this.vx *= CFG.DAMPING;
    this.vy *= CFG.DAMPING;

    // Move
    this.x     += this.vx;
    this.y     += this.vy;
    this.angle += this.spin;
    this.pulseT += this.pulseS;

    // Side walls — bounce
    const r = this.size / 2 + 2;
    if (this.x < r)     { this.x = r;     this.vx =  Math.abs(this.vx) * CFG.WALL_BOUNCE; }
    if (this.x > W - r) { this.x = W - r; this.vx = -Math.abs(this.vx) * CFG.WALL_BOUNCE; }

    // Bottom wall — bounce
    if (this.y > H - r) { this.y = H - r; this.vy = -Math.abs(this.vy) * CFG.WALL_BOUNCE; }

    // Top escape — antigravity exit, respawn at bottom
    if (this.y < -this.size * 5) this.reset(W, H);
  }

  // ── Draw this particle ──────────────────────────────────────────────────────
  draw(ctx) {
    const pulse = 1 + 0.1 * Math.sin(this.pulseT);
    const s     = (this.size / 2) * pulse;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Glow corona
    if (this.glows) {
      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 3);
      grd.addColorStop(0,   `rgba(212,160,23,0.18)`);
      grd.addColorStop(0.5, `rgba(212,160,23,0.06)`);
      grd.addColorStop(1,   `rgba(212,160,23,0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(0, 0, s * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle   = this.color;
    ctx.strokeStyle = this.color;

    switch (this.shape) {
      // ── Filled circle ────────────────────────────────────────────────────
      case "circle":
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fill();
        break;

      // ── Outlined circle (ring) ───────────────────────────────────────────
      case "dot-ring":
        ctx.globalAlpha = 0.35;
        ctx.lineWidth   = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      // ── Rotated square (diamond) ─────────────────────────────────────────
      case "diamond":
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.65, 0);
        ctx.lineTo(0,  s);
        ctx.lineTo(-s * 0.65, 0);
        ctx.closePath();
        ctx.fill();
        break;

      // ── Triangle ─────────────────────────────────────────────────────────
      case "triangle":
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.85,  s * 0.6);
        ctx.lineTo(-s * 0.85, s * 0.6);
        ctx.closePath();
        ctx.fill();
        break;

      // ── RDS pill label (the "brand floating" effect) ─────────────────────
      case "rds-pill": {
        const pad  = 9;
        const text = "RDS";
        const tw   = s * 1.8 + pad * 2;
        const th   = s * 0.9;
        ctx.globalAlpha = 0.22;

        // Pill fill
        ctx.fillStyle = BRAND.gold;
        ctx.beginPath();
        ctx.roundRect(-tw / 2, -th / 2, tw, th, th / 2);
        ctx.fill();

        // Pill border
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = BRAND.gold;
        ctx.lineWidth   = 0.8;
        ctx.stroke();

        // Text
        ctx.globalAlpha = 0.65;
        ctx.fillStyle   = BRAND.gold;
        ctx.font        = `700 ${Math.round(s * 0.7)}px 'DM Sans', system-ui, sans-serif`;
        ctx.textAlign   = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 0, 0);
        break;
      }

      default:
        break;
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Background component
// ─────────────────────────────────────────────────────────────────────────────
export default function Background() {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.fillStyle = BRAND.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let raf;

    // ── State ────────────────────────────────────────────────────────────────
    const state = {
      W: 0, H: 0, dpr: 1,
      particles:  [],
      mouse:      { x: -9999, y: -9999, active: false },
      explosions: [],           // [{x, y, radius, strength, age}]
      t:          0,
    };

    // ── Setup / resize ────────────────────────────────────────────────────────
    const setup = () => {
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.W   = window.innerWidth;
      state.H   = window.innerHeight;

      canvas.width  = state.W * state.dpr;
      canvas.height = state.H * state.dpr;
      canvas.style.width  = `${state.W}px`;
      canvas.style.height = `${state.H}px`;
      ctx.scale(state.dpr, state.dpr);

      const count = state.W < 768 ? CFG.COUNT_MOBILE : CFG.COUNT_DESKTOP;
      state.particles = Array.from({ length: count }, (_, i) =>
        new Particle(state.W, state.H, i, count)
      );
    };

    // ── Draw gold connecting lines between close particles ────────────────────
    const drawConnections = () => {
      const { particles, W: w } = state;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CFG.CONNECT_DIST) {
            const alpha = CFG.LINE_ALPHA_MAX * (1 - dist / CFG.CONNECT_DIST);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(212,160,23,${alpha})`;  // corp-gold
            ctx.lineWidth   = 0.6;
            ctx.stroke();
          }
        }
      }
    };

    // ── Subtle grid overlay (depth layer, very faint) ─────────────────────────
    const drawGrid = (W, H) => {
      const STEP = 70;
      ctx.strokeStyle = "rgba(255,255,255,0.025)";
      ctx.lineWidth   = 0.5;
      for (let x = 0; x < W; x += STEP) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += STEP) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
    };

    // ── Main render loop ──────────────────────────────────────────────────────
    const render = () => {
      const { W, H, particles, mouse, explosions } = state;
      state.t++;

      // Clear with brand bg
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BRAND.bg;
      ctx.fillRect(0, 0, W, H);

      // Subtle grid
      drawGrid(W, H);

      // Advance & decay explosions
      for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].age++;
        if (explosions[i].age > 30) explosions.splice(i, 1);
      }

      // Connections (behind particles)
      drawConnections();

      // Update & draw each particle
      for (const p of particles) {
        p.update(W, H, mouse, explosions);
        p.draw(ctx);
      }

      raf = requestAnimationFrame(render);
    };

    // ── Event handlers ────────────────────────────────────────────────────────
    const onResize = () => {
      setup();
    };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      state.mouse.x      = e.clientX - rect.left;
      state.mouse.y      = e.clientY - rect.top;
      state.mouse.active = true;
    };

    const onMouseLeave = () => {
      state.mouse.active = false;
    };

    const onTouchMove = (e) => {
      const t    = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      state.mouse.x      = t.clientX - rect.left;
      state.mouse.y      = t.clientY - rect.top;
      state.mouse.active = true;
    };

    const onTouchEnd = () => {
      state.mouse.active = false;
    };

    // Click → antigravity explosion burst (the Google easter egg moment)
    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      state.explosions.push({
        x:        e.clientX - rect.left,
        y:        e.clientY - rect.top,
        radius:   220,
        strength: 0.38,
        age:      0,
      });
    };

    // ── Boot ──────────────────────────────────────────────────────────────────
    setup();
    window.addEventListener("resize",    onResize,    { passive: true });
    canvas.addEventListener("mousemove", onMouseMove, { passive: true });
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend",  onTouchEnd);
    window.addEventListener("click",     onClick);

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize",    onResize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend",  onTouchEnd);
      window.removeEventListener("click",     onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}
