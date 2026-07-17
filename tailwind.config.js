/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink:    { DEFAULT: '#122A22', 900:'#0B1D17', 800:'#122A22', 700:'#1B3B30' },
        canopy: { 50:'#EEF5EF', 100:'#D7E9DA', 300:'#84B492', 500:'#2F6B4F', 600:'#245A41', 700:'#1B4633', 800:'#123024' },
        moss:   { 400:'#8DA891', 500:'#6E8F72' },
        mist:   { DEFAULT:'#F6F3E9', 100:'#FBF9F2' },
        amber:  { 400:'#E3A34D', 600:'#C6842E' },
        coral:  { 500:'#D1482F', 600:'#B93A24' },
        gold:   { 500:'#B8933B' }
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace']
      }
    }
  },
  plugins: [],
}
