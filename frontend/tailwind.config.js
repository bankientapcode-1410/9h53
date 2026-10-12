/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        smart: {
          navy: '#1A2332',
          blue: '#1A44D8',
          cyan: '#00BCD4',
          red: '#E30019',
          bg: '#F8F9FA',
          border: '#E5E7EB',
        }
      },
      fontFamily: {
        sans: ['"Inter"', '"Be Vietnam Pro"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
