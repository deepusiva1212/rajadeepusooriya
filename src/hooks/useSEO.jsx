/**
 * src/hooks/useSEO.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Dynamic SEO hook for Raja Deepu Sooriya Private Limited.
 *
 * Updates <title>, meta description, canonical URL, and OG tags every time
 * the user navigates to a new view — critical for single-page apps where
 * the HTML file only loads once.
 *
 * USAGE — add one line to the top of App.jsx:
 *   import { useSEO } from "./hooks/useSEO";
 *
 *   export default function App() {
 *     const [currentView, setCurrentView] = useState("home");
 *     useSEO(currentView);          // ← add this line
 *     ...
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect } from "react";

// ─── Base values ─────────────────────────────────────────────────────────────
const BASE_URL   = "https://www.rajadeepusooriya.com";
const OG_IMAGE   = `${BASE_URL}/og-image.png`;
const SITE_NAME  = "Raja Deepu Sooriya Private Limited";
const TITLE_SUFFIX = " | Raja Deepu Sooriya Pvt Ltd";

// ─── Per-view SEO config ──────────────────────────────────────────────────────
// Keys match your navigateTo() view strings in App.jsx exactly.
const SEO_MAP = {
  home: {
    title:       "Raja Deepu Sooriya Private Limited | DPIIT Startup · Sankagiri, Tamil Nadu",
    description: "Raja Deepu Sooriya Private Limited — DPIIT Recognised Startup (DIPP219259). Operating MyTripRaja (travel technology) and MarketerRaja (digital marketing). CIN: U79120TZ2025PTC034817.",
    canonical:   `${BASE_URL}/`,
    ogTitle:     "Raja Deepu Sooriya Private Limited | DPIIT Recognised Startup",
    ogDesc:      "Innovation-driven enterprise operating MyTripRaja and MarketerRaja. DPIIT Recognised Startup · Sankagiri, Tamil Nadu.",
  },
  internships: {
    title:       "Internship Programme 2026–27" + TITLE_SUFFIX,
    description: "Apply for the Raja Deepu Sooriya internship programme. 1-month, 3-month, and 6-month tracks in Travel Technology (MyTripRaja) and Digital Marketing (MarketerRaja). Sankagiri, Tamil Nadu.",
    canonical:   `${BASE_URL}/internships`,
    ogTitle:     "Internship Programme 2026–27 | Raja Deepu Sooriya Pvt Ltd",
    ogDesc:      "Real work. Real clients. Real impact. Apply now for internships in Travel Tech and Digital Marketing at our Sankagiri HQ.",
  },
  "about-more": {
    title:       "About Us — History & Vision" + TITLE_SUFFIX,
    description: "Learn about Raja Deepu Sooriya Private Limited — founded 2025 by three co-founders with a shared vision for travel technology and digital marketing innovation in Tamil Nadu.",
    canonical:   `${BASE_URL}/about-more`,
    ogTitle:     "About Raja Deepu Sooriya Private Limited",
    ogDesc:      "Our history, corporate mandate, and vision for MyTripRaja and MarketerRaja.",
  },
  "director-raja": {
    title:       "Raja — Director & Co-Founder" + TITLE_SUFFIX,
    description: "Raja is a Director and Co-Founder of Raja Deepu Sooriya Private Limited, leading corporate strategy and stakeholder relationships.",
    canonical:   `${BASE_URL}/director-raja`,
    ogTitle:     "Raja — Director & Co-Founder | Raja Deepu Sooriya Pvt Ltd",
    ogDesc:      "Visionary leader driving corporate strategy and growth across MyTripRaja and MarketerRaja.",
  },
  "director-deepu": {
    title:       "Deepadharsan Rajavel — Director & Co-Founder" + TITLE_SUFFIX,
    description: "Deepadharsan Rajavel (M.Com) is a Director and Co-Founder of Raja Deepu Sooriya Private Limited, specialising in corporate governance, financial reporting, and GST compliance.",
    canonical:   `${BASE_URL}/director-deepu`,
    ogTitle:     "Deepadharsan Rajavel — Director & Co-Founder | RDS Pvt Ltd",
    ogDesc:      "M.Com finance specialist overseeing corporate governance and financial transparency at Raja Deepu Sooriya Private Limited.",
  },
  "director-sooriya": {
    title:       "Balasooriya — Director & Co-Founder" + TITLE_SUFFIX,
    description: "Balasooriya is a Director and Co-Founder of Raja Deepu Sooriya Private Limited, leading technology and digital innovation across the company's brands.",
    canonical:   `${BASE_URL}/director-sooriya`,
    ogTitle:     "Balasooriya — Director & Co-Founder | RDS Pvt Ltd",
    ogDesc:      "Technology champion powering the digital infrastructure of MyTripRaja and MarketerRaja.",
  },
  privacy: {
    title:       "Privacy Policy" + TITLE_SUFFIX,
    description: "Privacy Policy of Raja Deepu Sooriya Private Limited — how we collect, use, and protect your personal information.",
    canonical:   `${BASE_URL}/privacy`,
    ogTitle:     "Privacy Policy | Raja Deepu Sooriya Pvt Ltd",
    ogDesc:      "Our commitment to protecting your personal data.",
  },
  terms: {
    title:       "Terms of Service" + TITLE_SUFFIX,
    description: "Terms of Service governing your use of the Raja Deepu Sooriya Private Limited website.",
    canonical:   `${BASE_URL}/terms`,
    ogTitle:     "Terms of Service | Raja Deepu Sooriya Pvt Ltd",
    ogDesc:      "Terms governing your use of rajadeepusooriya.com.",
  },
  disclaimer: {
    title:       "Disclaimer" + TITLE_SUFFIX,
    description: "Disclaimer for Raja Deepu Sooriya Private Limited — important notices about information accuracy and professional advice.",
    canonical:   `${BASE_URL}/disclaimer`,
    ogTitle:     "Disclaimer | Raja Deepu Sooriya Pvt Ltd",
    ogDesc:      "Important legal notices regarding information on this website.",
  },
  "internship-terms": {
    title:       "Internship Terms & Conditions" + TITLE_SUFFIX,
    description: "Terms and conditions governing the Raja Deepu Sooriya Pvt Ltd internship programme.",
    canonical:   `${BASE_URL}/internship-terms`,
    ogTitle:     "Internship T&C | Raja Deepu Sooriya Pvt Ltd",
    ogDesc:      "Terms governing the 2026–27 internship programme.",
  },
  "internship-privacy": {
    title:       "Internship Data Privacy" + TITLE_SUFFIX,
    description: "How Raja Deepu Sooriya Private Limited handles internship applicant data.",
    canonical:   `${BASE_URL}/internship-privacy`,
    ogTitle:     "Internship Privacy | Raja Deepu Sooriya Pvt Ltd",
    ogDesc:      "Applicant data handling for the RDS internship programme.",
  },
};

// ─── Helper — set or create a <meta> tag ─────────────────────────────────────
function setMeta(attr, attrValue, content) {
  const sel = `meta[${attr}="${attrValue}"]`;
  let el    = document.querySelector(sel);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// ─── Helper — set or create a <link> tag ─────────────────────────────────────
function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

// ─── The hook ─────────────────────────────────────────────────────────────────
export function useSEO(view) {
  useEffect(() => {
    const cfg = SEO_MAP[view] ?? SEO_MAP.home;

    // Page title
    document.title = cfg.title;

    // Primary meta
    setMeta("name", "description", cfg.description);

    // Canonical URL
    setLink("canonical", cfg.canonical);

    // Open Graph
    setMeta("property", "og:title",       cfg.ogTitle);
    setMeta("property", "og:description", cfg.ogDesc);
    setMeta("property", "og:url",         cfg.canonical);
    setMeta("property", "og:image",       OG_IMAGE);
    setMeta("property", "og:site_name",   SITE_NAME);
    setMeta("property", "og:type",        "website");

    // Twitter / X
    setMeta("name", "twitter:title",       cfg.ogTitle);
    setMeta("name", "twitter:description", cfg.ogDesc);
    setMeta("name", "twitter:image",       OG_IMAGE);
    setMeta("name", "twitter:card",        "summary_large_image");

    // Update the browser history URL (no page reload)
    // Maps view names → clean URL paths
    const PATH_MAP = {
      home:               "/",
      internships:        "/internships",
      "about-more":       "/about-more",
      "director-raja":    "/director-raja",
      "director-deepu":   "/director-deepu",
      "director-sooriya": "/director-sooriya",
      privacy:            "/privacy",
      terms:              "/terms",
      disclaimer:         "/disclaimer",
      "internship-terms": "/internship-terms",
      "internship-privacy": "/internship-privacy",
    };
    const path = PATH_MAP[view] ?? "/";
    if (window.location.pathname !== path) {
      window.history.pushState({ view }, cfg.title, path);
    }
  }, [view]);
}

// ─── Back/forward browser button support ─────────────────────────────────────
// Add this to App.jsx to handle browser back/forward:
//
//   useEffect(() => {
//     const onPop = (e) => {
//       if (e.state?.view) setCurrentView(e.state.view);
//     };
//     window.addEventListener("popstate", onPop);
//     return () => window.removeEventListener("popstate", onPop);
//   }, []);
