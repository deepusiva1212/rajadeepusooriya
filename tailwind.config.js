/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "corp-blue":       "#051528",   // Darker Navy for a more premium look
        "corp-blue-mid":   "#0E2A50",   // Slate Blue
        "corp-blue-light": "#1D4ED8",   // Bright Blue
        "corp-red":        "#A11212",   // Sharper Crimson
        "corp-red-mid":    "#C81E1E",   // Crimson hover
        "corp-red-bright": "#E02424",   // Bright Red
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
