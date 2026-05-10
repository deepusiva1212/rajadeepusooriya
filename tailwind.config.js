/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "corp-black":      "#0a0a0a",   // Primary Dark Background
        "corp-red":        "#C8102E",   // Primary Red
        "corp-red-dark":   "#9b0d22",   // Dark Red
        "corp-red-light":  "#ff2244",   // Bright Accent Red
        "corp-gold":       "#D4A017",   // Primary Gold
        "corp-gold-light": "#f0c040",   // Light Gold Accent
        "corp-offwhite":   "#f9f6f1",   // Warm Off-White for light sections
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body:    ["'DM Sans'", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest: "0.25em",
      },
    },
  },
  plugins: [],
};
