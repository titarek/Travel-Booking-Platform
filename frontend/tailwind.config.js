/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38a8f6',
          500: '#0e8ce4', // Primary ShareTrip-style vibrant azure blue
          600: '#026fc4',
          700: '#03589f',
          800: '#074b83',
          900: '#0c3f6d',
          950: '#082847',
        },
        accent: {
          500: '#ff6b35', // Warm booking orange/coral for call-to-actions
          600: '#ea580c',
        }
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(16, 24, 40, 0.08), 0 2px 6px -2px rgba(16, 24, 40, 0.04)',
        'float': '0 12px 36px -4px rgba(14, 140, 228, 0.16)',
      }
    },
  },
  plugins: [],
}
