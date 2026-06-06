/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 0 1px rgba(20, 184, 166, 0.15), 0 20px 60px rgba(15, 23, 42, 0.35)',
      },
      colors: {
        ink: '#08111f',
        panel: '#0f1b2e',
        accent: '#37c7ad',
        warm: '#f59e0b',
      },
    },
  },
  plugins: [],
}
