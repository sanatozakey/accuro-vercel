/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Scan all JS/TS/JSX/TSX files in src
  ],
  theme: {
    extend: {
      colors: {
        // Brand primary colors
        primary: '#2563EB',
        'primary-dark': '#1D4ED8',
        'primary-light': '#DBEAFE',
        // Brand navy
        navy: {
          900: '#001F3F',
        },
        // Brand status colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      // Brand typography scale
      fontSize: {
        'h1-desktop': '48px',
        'h1-mobile': '32px',
        'h2-desktop': '36px',
        'h2-mobile': '24px',
        'h3-desktop': '28px',
        'h3-mobile': '20px',
        'h4-desktop': '24px',
        'h4-mobile': '18px',
      },
      // Brand spacing scale (4px unit system)
      spacing: {
        '4.5': '18px',  // 4.5 * 4px
        '18': '72px',   // 18 * 4px
        '22': '88px',   // 22 * 4px
        '26': '104px',  // 26 * 4px
      },
    },
  },
  plugins: [],
};