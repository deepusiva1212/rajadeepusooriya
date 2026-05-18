/**
 * scripts/generate-og-image.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates /public/og-image.png (1200×630) — the image shown when your
 * site is shared on WhatsApp, LinkedIn, Twitter, iMessage, etc.
 *
 * SETUP (one-time):
 *   npm install -D canvas
 *   node scripts/generate-og-image.js
 *
 * OUTPUT: public/og-image.png
 *
 * Run this once, commit the PNG, and deploy. Re-run only when branding changes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { createCanvas } = require("canvas");
const fs               = require("fs");
const path             = require("path");

const W = 1200;
const H = 630;

const canvas = createCanvas(W, H);
const ctx    = canvas.getContext("2d");

// ─── Brand colors ──────────────────────────────────────────────────────────
const BG      = "#051324";   // corp-blue
const BGMID   = "#0f2940";   // corp-blue-mid
const RED     = "#C8102E";   // corp-red
const GOLD    = "#D4A017";   // corp-gold
const WHITE   = "#FFFFFF";
const GRAY    = "#9CA3AF";

// ─── Background ────────────────────────────────────────────────────────────
ctx.fillStyle = BG;
ctx.fillRect(0, 0, W, H);

// ─── Left red accent bar ────────────────────────────────────────────────────
ctx.fillStyle = RED;
ctx.fillRect(0, 0, 6, H);

// ─── Top gold line ──────────────────────────────────────────────────────────
ctx.fillStyle = GOLD;
ctx.fillRect(6, 0, W, 3);

// ─── Subtle grid overlay ────────────────────────────────────────────────────
ctx.strokeStyle = "rgba(255,255,255,0.03)";
ctx.lineWidth   = 1;
for (let x = 0; x < W; x += 70) {
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
}
for (let y = 0; y < H; y += 70) {
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
}

// ─── Right decorative circle rings ─────────────────────────────────────────
const cx = 1050, cy = 315;
for (const [r, alpha] of [[280, 0.04], [200, 0.06], [130, 0.07], [70, 0.08]]) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(200,16,46,${alpha})`;
  ctx.lineWidth   = 1;
  ctx.stroke();
}

// ─── RDS badge (top left) ──────────────────────────────────────────────────
const BADGE_X = 72, BADGE_Y = 72, BADGE_W = 80, BADGE_H = 44;
ctx.fillStyle = RED;
roundRect(ctx, BADGE_X, BADGE_Y, BADGE_W, BADGE_H, 4);
ctx.fill();
ctx.fillStyle   = WHITE;
ctx.font        = "bold 20px Arial, sans-serif";
ctx.textAlign   = "center";
ctx.textBaseline = "middle";
ctx.fillText("RDS", BADGE_X + BADGE_W / 2, BADGE_Y + BADGE_H / 2);

// ─── Company name (right of badge) ─────────────────────────────────────────
ctx.textAlign   = "left";
ctx.textBaseline = "top";
ctx.fillStyle   = WHITE;
ctx.font        = "bold 16px Arial, sans-serif";
ctx.fillText("RAJA DEEPU SOORIYA", BADGE_X + BADGE_W + 14, BADGE_Y + 2);
ctx.fillStyle   = GOLD;
ctx.font        = "13px Arial, sans-serif";
ctx.fillText("PRIVATE LIMITED", BADGE_X + BADGE_W + 14, BADGE_Y + 24);

// ─── DPIIT badge ───────────────────────────────────────────────────────────
const DPIIT_X = 72, DPIIT_Y = 148;
ctx.fillStyle = "rgba(200,16,46,0.12)";
roundRect(ctx, DPIIT_X, DPIIT_Y, 320, 32, 3);
ctx.fill();
ctx.strokeStyle = "rgba(200,16,46,0.4)";
ctx.lineWidth   = 1;
roundRect(ctx, DPIIT_X, DPIIT_Y, 320, 32, 3);
ctx.stroke();

// dot
ctx.beginPath();
ctx.arc(DPIIT_X + 14, DPIIT_Y + 16, 4, 0, Math.PI * 2);
ctx.fillStyle = RED;
ctx.fill();

ctx.fillStyle   = "#FCA5A5";
ctx.font        = "bold 12px Arial, sans-serif";
ctx.textAlign   = "left";
ctx.textBaseline = "middle";
ctx.fillText("DPIIT RECOGNISED STARTUP · DIPP219259", DPIIT_X + 26, DPIIT_Y + 16);

// ─── Main headline ─────────────────────────────────────────────────────────
ctx.textAlign   = "left";
ctx.textBaseline = "top";
ctx.fillStyle   = WHITE;
ctx.font        = "bold 74px Georgia, serif";
ctx.fillText("Work. Grow.", 72, 220);

ctx.fillStyle = GOLD;
ctx.fillText("Lead.", 72, 308);

// ─── Subtext ───────────────────────────────────────────────────────────────
ctx.fillStyle   = GRAY;
ctx.font        = "300 22px Arial, sans-serif";
ctx.fillText("Innovation-driven enterprise · Sankagiri, Tamil Nadu", 72, 410);

// ─── Divider ───────────────────────────────────────────────────────────────
ctx.fillStyle = `rgba(255,255,255,0.12)`;
ctx.fillRect(72, 450, 500, 1);

// ─── Brand pills ───────────────────────────────────────────────────────────
drawBrandPill(ctx, 72,  470, "MyTripRaja",    "Travel & Tourism");
drawBrandPill(ctx, 260, 470, "MarketerRaja",  "Digital Marketing");

// ─── Domain watermark (bottom right) ───────────────────────────────────────
ctx.textAlign   = "right";
ctx.textBaseline = "bottom";
ctx.fillStyle   = "rgba(255,255,255,0.18)";
ctx.font        = "14px Arial, sans-serif";
ctx.fillText("www.rajadeepusooriya.com", W - 48, H - 36);

// ─── Write file ────────────────────────────────────────────────────────────
const outDir  = path.join(__dirname, "..", "public");
const outPath = path.join(outDir, "og-image.png");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const buffer = canvas.toBuffer("image/png");
fs.writeFileSync(outPath, buffer);
console.log(`✅  OG image written → ${outPath}`);
console.log(`    Size: ${(buffer.length / 1024).toFixed(1)} KB`);

// ─── Helpers ───────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBrandPill(ctx, x, y, name, category) {
  const W_PILL = 172, H_PILL = 56;
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  roundRect(ctx, x, y, W_PILL, H_PILL, 3);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth   = 1;
  ctx.stroke();

  ctx.fillStyle   = GOLD;
  ctx.font        = "bold 10px Arial";
  ctx.textAlign   = "left";
  ctx.textBaseline = "top";
  ctx.fillText(category.toUpperCase(), x + 12, y + 10);

  ctx.fillStyle   = WHITE;
  ctx.font        = "bold 17px Georgia, serif";
  ctx.textBaseline = "top";
  ctx.fillText(name, x + 12, y + 28);
}
