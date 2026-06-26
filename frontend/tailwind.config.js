/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        "glow-red":    "0 0 20px rgba(239,68,68,0.35)",
        "glow-red-lg": "0 0 40px rgba(239,68,68,0.45)",
        "glow-red-sm": "0 0 10px rgba(239,68,68,0.25)",
        "card":        "0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
        "modal":       "0 25px 50px rgba(0,0,0,0.75), 0 0 0 1px rgba(239,68,68,0.22)",
      },
      backgroundImage: {
        "gradient-red": "linear-gradient(135deg, #EF4444 0%, #DC2626 60%, #B91C1C 100%)",
        "gradient-red-hover": "linear-gradient(135deg, #F87171 0%, #EF4444 60%, #DC2626 100%)",
      },
      colors: {
        surface: {
          DEFAULT: "rgba(16,16,16,0.90)",
          deep:    "#030303",
          card:    "#181818",
          raised:  "#222222",
        },
      },
      animation: {
        "fade-in":    "fade-in 0.2s ease-out both",
        "slide-up":   "slide-up 0.2s ease-out both",
        "scale-in":   "scale-in 0.15s ease-out both",
      },
      keyframes: {
        "fade-in":  { from: { opacity: "0" },                           to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "scale-in": { from: { opacity: "0", transform: "scale(0.95)" },     to: { opacity: "1", transform: "scale(1)" } },
      },
    },
  },
  plugins: [],
};
