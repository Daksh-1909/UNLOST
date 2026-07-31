/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#5C321E",
        secondary: "#926347",
        accent: "#C9A07A",
        background: "#E6CAAB",
        surface: "#F3E7D9",
        text: "#3B2418",
        textSecondary: "#6B5B4D",
        textMuted: "#8B7A6A",
        success: "#4E7A52",
        warning: "#B07A1A",
        danger: "#B4463A",
        border: "#D4B79A"
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
