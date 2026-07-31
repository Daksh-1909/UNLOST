/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",      // Indigo 500
        secondary: "#a855f7",    // Purple 500
        accent: "#ec4899",       // Pink 500
        background: "#0f172a",   // Slate 900
        surface: "#1e293b",      // Slate 800
        text: "#f8fafc",         // Slate 50
        textSecondary: "#cbd5e1", // Slate 300
        textMuted: "#64748b",    // Slate 500
        success: "#22c55e",
        warning: "#eab308",
        danger: "#ef4444",
        border: "#334155"        // Slate 700
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      }
    },
  },
  plugins: [],
}
