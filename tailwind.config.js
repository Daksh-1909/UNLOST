/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        surface: '#1e293b',
        'surface-hover': '#334155',
        primary: {
          light: '#a5b4fc',
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
        },
        secondary: {
          light: '#f472b6',
          DEFAULT: '#ec4899',
          dark: '#db2777',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
        'radial-glow': 'radial-gradient(circle at 50% 0%, #1e293ba6 0%, transparent 70%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      }
    },
  },
  plugins: [],
}
