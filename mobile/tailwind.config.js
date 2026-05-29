/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef5ff',
          100: '#d9e7ff',
          200: '#b7d2ff',
          300: '#86b3ff',
          400: '#4f8cff',
          500: '#2b6cff',
          600: '#1f52f5',
          700: '#1b3fd0',
          800: '#1c37a8',
          900: '#1c3286',
        },
      },
    },
  },
  plugins: [],
};
