/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mt-navy': '#0f172a',
        'mt-deep': '#1e293b',
        'mt-card': '#1a2332',
        'mt-accent': '#6366f1',
        'mt-teal': '#2dd4bf',
        'mt-amber': '#f59e0b',
        'mt-rose': '#fb7185',
        'mt-sky': '#38bdf8',
        'mt-emerald': '#34d399',
      },
      fontFamily: {
        'jakarta': ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        'inter': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
