/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "corp-blue":       "#0A2342",   // Deep Navy — primary background / navbar
        "corp-blue-mid":   "#1B3F72",   // Slate Blue — card backgrounds, secondary panels
        "corp-blue-light": "#2563EB",   // Bright Blue — accents, links
        "corp-red":        "#9B1C1C",   // Deep Crimson — CTA buttons, accents
        "corp-red-mid":    "#B91C1C",   // Crimson hover state
        "corp-red-bright": "#DC2626",   // Bright Red — badges, highlights
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],   // Bold headings
        body:    ["'DM Sans'", "system-ui", "sans-serif"],     // Clean body copy
      },
      letterSpacing: {
        widest: "0.25em",
      },
    },
  },
  plugins: [],
};
