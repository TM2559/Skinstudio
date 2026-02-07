/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pmu: {
          bg: '#0F0F0F',
          card: '#1a1a1a',
          muted: '#A1A1AA',
          gold: '#C6A87C',
          'gold-hover': '#d4b88a',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
