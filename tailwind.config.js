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
    },
    screens: {
      mobileS: '320px',
      mobileM: '375px',
      mobileL: '425px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    }
  },
  plugins: [],
}
