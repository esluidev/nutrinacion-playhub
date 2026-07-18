import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './app/**/*.{vue,js,ts}',
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        display: ['Fredoka', 'sans-serif'],
      },

      colors: {
        brand: {
          // Green - Primary action color (buttons, success, CTA)
          primary: {
            DEFAULT: '#22c55e',
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
          },
          // Teal - Secondary actions, info
          secondary: {
            DEFAULT: '#4ECDC4',
            50: '#edfffe',
            100: '#d6f8f5',
            200: '#adf1eb',
            300: '#7de8e1',
            400: '#4ECDC4',
            500: '#3DBDB4',
            600: '#2E9D95',
            700: '#237B75',
            800: '#1A5B57',
            900: '#123D3B',
          },
          // Yellow - Highlights, stars, rewards
          accent: {
            DEFAULT: '#FFE66D',
            50: '#fffdf0',
            100: '#fff8d6',
            200: '#fff1ad',
            300: '#ffea84',
            400: '#FFE66D',
            500: '#E6CC4D',
            600: '#CCB33E',
            700: '#A68F32',
            800: '#7A6825',
            900: '#524618',
          },
          // Coral - Brand color, decorative
          coral: {
            DEFAULT: '#FF6B6B',
            50: '#fff5f5',
            100: '#ffe5e5',
            200: '#ffcccc',
            300: '#ffb3b3',
            400: '#ff8a8a',
            500: '#FF6B6B',
            600: '#E55050',
            700: '#CC3838',
            800: '#A82929',
            900: '#7A1F1F',
          },
          // Purple - AI/Studio features
          purple: {
            DEFAULT: '#A29BFE',
            50: '#f5f4ff',
            100: '#ebeaff',
            200: '#d7d4ff',
            300: '#c3beff',
            400: '#A29BFE',
            500: '#827BDE',
            600: '#6B62C7',
            700: '#554CAD',
            800: '#403888',
            900: '#2D2860',
          },
          // Dark - Headings, text
          dark: '#2D3436',
          // Backgrounds
          bg: '#f7faf7',
          surface: '#FFFFFF',
        },
      },
    },
  },
}
