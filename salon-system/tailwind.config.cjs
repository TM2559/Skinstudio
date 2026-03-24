/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
