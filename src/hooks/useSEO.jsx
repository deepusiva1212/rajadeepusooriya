/**
 * src/hooks/useSEO.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Dynamic SEO hook — Raja Deepu Sooriya Private Limited
 *
 * Updates <title>, meta description, canonical, OG + Twitter tags on every
 * view change. Does NOT call pushState — App.jsx navigateTo() already does
 * that, so we only handle meta tags here to avoid duplicate history entries.
 *
 * USAGE in App.jsx (one line):
 *   import { useSEO } from "./hooks/useSEO";
 *   ...
 *   export default function App() {
 *     const [view, setView] = useState(...);
 *     useSEO(view);   ← add this right after useState
 *     ...
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect } from "react";

const BASE      = "https://www.rajadeepusooriya.com";
const OG_IMAGE  = `${BASE}/og-image.png`;
const SITE_NAME = "Raja Deepu Sooriya Private Limited";
const SUFFIX    = " | Raja Deepu Sooriya Pvt Ltd";

// ─── Per-view meta config ─────────────────────────────────────────────────────
const SEO = {
  home: {
    title: "Raja Deepu Sooriya Private Limited | DPIIT Startup · Sankagiri, Tamil Nadu",
    desc:  "Raja Deepu Sooriya Private Limited — DPIIT Recognised Startup (DIPP219259). Operating MyTripRaja (travel) and MarketerRaja (digital marketing). CIN: U79120TZ2025PTC034817. Sankagiri, Tamil Nadu.",
    url:   `${BASE}/`,
    ogTitle: "Raja Deepu Sooriya Private Limited | DPIIT Recognised Startup",
    ogDesc:  "Innovation-driven enterprise — MyTripRaja & MarketerRaja. DPIIT Recognised Startup · Tamil Nadu.",
  },
  internships: {
    title: "Internship Programme 2026–27" + SUFFIX,
    desc:  "Apply for RDS internships — 1-month, 3-month, 6-month tracks in Travel Technology (MyTripRaja) and Digital Marketing (MarketerRaja). Offline at Sankagiri HQ.",
    url:   `${BASE}/internships`,
    ogTitle: "Internship Programme 2026–27 | Raja Deepu Sooriya Pvt Ltd",
    ogDesc:  "Real work. Real clients. Real impact. Apply now for internships at our Sankagiri HQ.",
  },
  "about-more": {
    title: "Our History & Corporate Vision" + SUFFIX,
    desc:  "Learn about Raja Deepu Sooriya Private Limited — founded 2025, operating MyTripRaja and MarketerRaja from Sankagiri, Tamil Nadu.",
    url:   `${BASE}/about-more`,
    ogTitle: "About Us — Raja Deepu Sooriya Private Limited",
    ogDesc:  "Our history, corporate mandate, and vision for MyTripRaja and MarketerRaja.",
  },
  "director-raja": {
    title: "Raja — Director & Co-Founder" + SUFFIX,
    desc:  "Raja is a Director and Co-Founder of Raja Deepu Sooriya Private Limited, leading corporate strategy and stakeholder relationships.",
    url:   `${BASE}/director-raja`,
    ogTitle: "Raja — Director & Co-Founder | RDS Pvt Ltd",
    ogDesc:  "Visionary leader driving corporate strategy across MyTripRaja and MarketerRaja.",
  },
  "director-deepu": {
    title: "Deepadharsan Rajavel — Director & Co-Founder" + SUFFIX,
    desc:  "Deepadharsan Rajavel (M.Com) is a Co-Founder specialising in corporate governance, financial reporting, and GST compliance at Raja Deepu Sooriya Private Limited.",
    url:   `${BASE}/director-deepu`,
    ogTitle: "Deepadharsan Rajavel — Director & Co-Founder | RDS Pvt Ltd",
    ogDesc:  "M.Com finance specialist overseeing corporate governance at Raja Deepu Sooriya Private Limited.",
  },
  "director-sooriya": {
    title: "Balasooriya — Director & Co-Founder" + SUFFIX,
    desc:  "Balasooriya is the technology and digital innovation champion at Raja Deepu Sooriya Private Limited, powering MyTripRaja and MarketerRaja.",
    url:   `${BASE}/director-sooriya`,
    ogTitle: "Balasooriya — Director & Co-Founder | RDS Pvt Ltd",
    ogDesc:  "Technology champion powering the digital infrastructure of MyTripRaja and MarketerRaja.",
  },
  "internship-terms": {
    title: "Internship Terms & Conditions" + SUFFIX,
    desc:  "Terms and conditions governing the Raja Deepu Sooriya Pvt Ltd internship programme 2026–27.",
    url:   `${BASE}/internship-terms`,
    ogTitle: "Internship Terms & Conditions | RDS Pvt Ltd",
    ogDesc:  "Terms governing the RDS internship programme.",
  },
  "internship-privacy": {
    title: "Internship Data Privacy" + SUFFIX,
    desc:  "How Raja Deepu Sooriya Private Limited handles internship applicant personal data.",
    url:   `${BASE}/internship-privacy`,
    ogTitle: "Internship Privacy Policy | RDS Pvt Ltd",
    ogDesc:  "Applicant data handling for the RDS internship programme.",
  },
  privacy: {
    title: "Privacy Policy" + SUFFIX,
    desc:  "Privacy Policy of Raja Deepu Sooriya Private Limited — how we collect, use, and protect your personal information.",
    url:   `${BASE}/privacy`,
    ogTitle: "Privacy Policy | Raja Deepu Sooriya Pvt Ltd",
    ogDesc:  "Our commitment to protecting your personal data.",
  },
  terms: {
    title: "Terms of Service" + SUFFIX,
    desc:  "Terms of Service governing your use of the Raja Deepu Sooriya Private Limited website.",
    url:   `${BASE}/terms`,
    ogTitle: "Terms of Service | Raja Deepu Sooriya Pvt Ltd",
    ogDesc:  "Terms governing your use of rajadeepusooriya.com.",
  },
  disclaimer: {
    title: "Disclaimer" + SUFFIX,
    desc:  "Important disclaimer notices from Raja Deepu Sooriya Private Limited regarding website information accuracy.",
    url:   `${BASE}/disclaimer`,
    ogTitle: "Disclaimer | Raja Deepu Sooriya Pvt Ltd",
    ogDesc:  "Important legal notices regarding information on this website.",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setMeta(attr, key, value) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

// ─── The hook ─────────────────────────────────────────────────────────────────
export function useSEO(view) {
  useEffect(() => {
    const cfg = SEO[view] ?? SEO.home;

    // Title
    document.title = cfg.title;

    // Primary
    setMeta("name", "description", cfg.desc);

    // Canonical
    setCanonical(cfg.url);

    // Open Graph
    setMeta("property", "og:title",       cfg.ogTitle);
    setMeta("property", "og:description", cfg.ogDesc);
    setMeta("property", "og:url",         cfg.url);
    setMeta("property", "og:image",       OG_IMAGE);
    setMeta("property", "og:image:width",  "1200");
    setMeta("property", "og:image:height", "630");
    setMeta("property", "og:site_name",   SITE_NAME);
    setMeta("property", "og:type",        "website");

    // Twitter / X
    setMeta("name", "twitter:title",       cfg.ogTitle);
    setMeta("name", "twitter:description", cfg.ogDesc);
    setMeta("name", "twitter:image",       OG_IMAGE);
    setMeta("name", "twitter:card",        "summary_large_image");

    // NOTE: We do NOT call pushState here.
    // App.jsx navigateTo() already handles the URL — calling it twice
    // would create duplicate history entries and break the back button.
  }, [view]);
}
