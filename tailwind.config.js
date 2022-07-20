/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
    colors: {
      themeColor1: '#F0EBE3',
      themeColor2: '#E4DCCF',
      themeColor3: '#7D9D9C',
      themeColor4: '#576F72',
      themeColor5: '#F56C6C',
    }
  },
  plugins: [],
}
