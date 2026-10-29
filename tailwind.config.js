/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        htb: {
          bg: '#0a0d14',
          card: '#0f141f',
          panel: '#131926',
          border: '#1e293b',
          green: '#10b981',
          cyan: '#06b6d4',
          red: '#ef4444',
          amber: '#f59e0b',
          purple: '#8b5cf6',
          text: '#94a3b8',
          textBright: '#e2e8f0',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'Monaco', 'monospace'],
      }
    },
  },
  plugins: [],
}
