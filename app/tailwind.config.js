import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 'Coach's paper training log' palette — triplets in index.css, alpha-aware
        paper: 'rgb(var(--paper) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        pencil: 'rgb(var(--pencil) / <alpha-value>)',
        marker: 'rgb(var(--marker) / <alpha-value>)',
        rule: 'var(--rule)',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', ...defaultTheme.fontFamily.sans],
        display: ['"Barlow Condensed"', '"Arial Narrow"', ...defaultTheme.fontFamily.sans],
        data: ['"Spline Sans Mono Variable"', '"Spline Sans Mono"', ...defaultTheme.fontFamily.mono],
      },
    },
  },
  plugins: [],
}
