/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea6a0a',
          700: '#c2550b',
          800: '#9a3e0e',
          900: '#7c3010',
        },
        surface: {
          50: '#f8f8f8',
          100: '#f0f0f0',
          200: '#e0e0e0',
          700: '#2d2d2d',
          800: '#1e1e1e',
          900: '#111111',
          950: '#0a0a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
