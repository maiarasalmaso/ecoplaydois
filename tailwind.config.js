/** @type {import('tailwindcss').Config} */
const withOpacity = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: withOpacity('--theme-slate-50'),
          100: withOpacity('--theme-slate-100'),
          200: withOpacity('--theme-slate-200'),
          300: withOpacity('--theme-slate-300'),
          400: withOpacity('--theme-slate-400'),
          500: withOpacity('--theme-slate-500'),
          600: withOpacity('--theme-slate-600'),
          700: withOpacity('--theme-slate-700'),
          800: withOpacity('--theme-slate-800'),
          900: withOpacity('--theme-slate-900'),
          950: withOpacity('--theme-slate-950'),
        },
        'theme-bg-primary': withOpacity('--theme-bg-primary-rgb'),
        'theme-bg-secondary': withOpacity('--theme-bg-secondary-rgb'),
        'theme-bg-tertiary': withOpacity('--theme-bg-tertiary-rgb'),
        'theme-text-primary': withOpacity('--theme-text-primary-rgb'),
        'theme-text-secondary': withOpacity('--theme-text-secondary-rgb'),
        'theme-text-tertiary': withOpacity('--theme-text-tertiary-rgb'),
        'theme-border': withOpacity('--theme-border-rgb'),
        'theme-border-hover': withOpacity('--theme-border-hover-rgb'),
        'theme-backdrop': withOpacity('--theme-backdrop-rgb'),
        'eco-green': '#4ade80',
        'eco-green-light': '#86efac',
        'eco-green-dark': '#22c55e',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 20px rgba(74, 222, 128, 0.5)' },
          '50%': { opacity: .5, boxShadow: '0 0 10px rgba(74, 222, 128, 0.2)' },
        }
      }
    },
  },
  plugins: [],
}
