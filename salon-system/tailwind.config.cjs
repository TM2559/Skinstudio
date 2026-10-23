/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Jost', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"EB Garamond"', 'Georgia', 'serif'],
      },
      colors: {
      // Identita Skin Studio (IDENTITA.md): teplé „mramorové“ šedé místo studené Tailwind palety
      stone: {
        50: '#F7F4F0', 100: '#EEE8E1', 200: '#E2DAD1', 300: '#D8CFC5', 400: '#B3A79C',
        500: '#6B615A', 600: '#5C534D', 700: '#4D4540', 800: '#2E2925', 900: '#1F1B18', 950: '#14110F',
      },
      zinc: {
        50: '#F7F4F0', 100: '#EEE8E1', 200: '#E2DAD1', 300: '#D8CFC5', 400: '#B3A79C',
        500: '#6B615A', 600: '#5C534D', 700: '#4D4540', 800: '#2E2925', 900: '#1F1B18', 950: '#14110F',
      },
      neutral: {
        50: '#F7F4F0', 100: '#EEE8E1', 200: '#E2DAD1', 300: '#D8CFC5', 400: '#B3A79C',
        500: '#6B615A', 600: '#5C534D', 700: '#4D4540', 800: '#2E2925', 900: '#1F1B18', 950: '#14110F',
      },
      slate: {
        50: '#F7F4F0', 100: '#EEE8E1', 200: '#E2DAD1', 300: '#D8CFC5', 400: '#B3A79C',
        500: '#6B615A', 600: '#5C534D', 700: '#4D4540', 800: '#2E2925', 900: '#1F1B18', 950: '#14110F',
      },
      gray: {
        50: '#F7F4F0', 100: '#EEE8E1', 200: '#E2DAD1', 300: '#D8CFC5', 400: '#B3A79C',
        500: '#6B615A', 600: '#5C534D', 700: '#4D4540', 800: '#2E2925', 900: '#1F1B18', 950: '#14110F',
      },

        'skin-gold-from': '#D9B56B',
        'skin-gold-to': '#8C6A2E',
        'skin-rose-from': '#CDA09A',
        'skin-rose-via': '#B98680',
        'skin-rose-to': '#8E605B',
        'skin-rose-light': '#D9A9A3',
        'skin-base': '#F6F1EC',
        'skin-text': '#2F2F2F',
      },
      boxShadow: {
        'skin-gold': '0 10px 24px rgba(140, 106, 46, 0.22)',
        'skin-gold-hover': '0 14px 30px rgba(140, 106, 46, 0.30)',
        'skin-rose': '0 10px 24px rgba(142, 96, 91, 0.24)',
        'skin-rose-hover': '0 14px 30px rgba(142, 96, 91, 0.30)',
      },
    },
  },
  plugins: [],
};
