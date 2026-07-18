/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf8f0',
          100: '#f9eddb',
          200: '#f2d8b0',
          300: '#e9be7c',
          400: '#e0a34e',
          500: '#d98c2c',
          600: '#c97821',
          700: '#a75e1d',
          800: '#864b1f',
          900: '#6d3e1c',
        },
        accent: {
          50: '#f0f7f4',
          100: '#dbede2',
          200: '#b9dcc8',
          300: '#8ac3a6',
          400: '#5aa682',
          500: '#3a8a68',
          600: '#2b6f53',
          700: '#235944',
          800: '#1e4838',
          900: '#1a3b2f',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
