/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-black': '#050505',
        'brand-dark': '#0a0a0a',
        'brand-gray': '#1a1a1a',
        'brand-green': '#00ff41',
        'brand-purple': '#7d00ff',
      },
      fontFamily: {
        'gaming': ['"Orbitron"', 'sans-serif'],
        'body': ['"Rajdhani"', 'sans-serif']
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee': 'marquee 20s linear infinite',
      }
    },
  },
  plugins: [],
}