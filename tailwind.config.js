/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "corp-blue":       "#051324",   // Deep Navy Background
        "corp-blue-mid":   "#0f2940",   // Lighter Navy for cards
        "corp-red":        "#C8102E",   // Primary Red
        "corp-red-dark":   "#9b0d22",   // Dark Red
        "corp-gold":       "#D4A017",   // Primary Gold
        "corp-offwhite":   "#f8f9fa",   // Clean off-white
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body:    ["'DM Sans'", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest: "0.25em",
      },
      animation: {
        'blob': "blob 15s infinite alternate",
        'blob-reverse': "blob-reverse 20s infinite alternate",
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(40px, -60px) scale(1.1)" },
          "100%": { transform: "translate(-20px, 30px) scale(0.9)" }
        },
        'blob-reverse': {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(-40px, 60px) scale(1.2)" },
          "100%": { transform: "translate(30px, -30px) scale(0.8)" }
        }
      }
    },
  },
  plugins: [],
};
