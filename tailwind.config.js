/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        schoolRed: '#B31B1B',
        schoolBlue: '#000080',
        tableBg: '#Fdfcf0',
      }
    },
  },
  plugins: [],
}