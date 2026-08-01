/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        text: "var(--color-text)",
        textSecondary: "var(--color-text-secondary)",
        textMuted: "var(--color-text-muted)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        border: "var(--color-border)"
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #5C321E, #926347, #C9A07A)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      }
    },
  },
  plugins: [],
}
