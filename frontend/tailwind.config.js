/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        surface: '#0a0a0f',
        panel: '#111118',
        border: 'rgba(255,255,255,0.08)',
      },
    },
  },
  plugins: [],
};
