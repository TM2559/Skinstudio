/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./salon-system/index.html",
    "./salon-system/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Skin Studio Design System – semantic palette
        skin: {
          base: '#faf9f6',       // Light background (Warm White)
          dark: '#0c0a09',      // Dark background / Footer
          text: '#1c1917',      // Stone-900 (Main Text)
          muted: '#57534e',      // Stone-600 (Subtext)
          // Gold gradient stops (Champagne Gold)
          'gold-from': '#dec89a',
          'gold-to': '#b08d55',
          // Rose gradient stops (3-point Rose Gold)
          'rose-from': '#B37E76',
          'rose-via': '#D49A91',
          'rose-to': '#B37E76',
          'rose-accent': '#daa59c',  // Icons / text highlights
          heart: '#E57590',          // Heart icon red
          gold: {
            light: '#dec89a',
            DEFAULT: '#c5a572',
            dark: '#b08d55',
            glow: 'rgba(197,165,114,0.4)',
          },
          rose: {
            light: '#D49A91',
            DEFAULT: '#B37E76',
            accent: '#daa59c',
            glow: 'rgba(179,126,118,0.4)',
          },
        },
        pmu: {
          bg: '#0F0F0F',
          card: '#1a1a1a',
          muted: '#A1A1AA',
          gold: '#C6A87C',
          'gold-hover': '#d4b88a',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gold-satin': 'linear-gradient(to bottom, #dec89a, #b08d55)',
        'rose-satin': 'linear-gradient(to bottom, #B37E76, #D49A91, #B37E76)',
      },
      boxShadow: {
        'skin-gold': '0 4px 20px rgba(197,165,114,0.3)',
        'skin-gold-hover': '0 6px 25px rgba(197,165,114,0.5)',
        'skin-rose': '0 4px 20px rgba(179,126,118,0.3)',
        'skin-rose-hover': '0 6px 25px rgba(179,126,118,0.45)',
      },
    },
  },
  plugins: [],
}
