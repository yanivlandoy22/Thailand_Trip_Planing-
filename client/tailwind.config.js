/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          DEFAULT: '#0284c7',
          dark: '#0369a1',
        },
        bgapp: '#f0f4f8',
      },
      fontFamily: {
        heebo: ['Heebo', 'sans-serif'],
        serif: ['"Noto Serif Display"', 'serif'],
      },
      borderRadius: {
        app: '14px',
      },
    },
  },
  plugins: [],
};
