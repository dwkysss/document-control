/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f6fe',
          100: '#ddeafc',
          200: '#c3dbfa',
          300: '#9ac4f6',
          400: '#69a3f0',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0b1a30',
        },
        sidebar: {
          bg: '#0a1628',
          hover: '#13233c',
          active: '#1d4ed8',
          border: '#1b2d49',
          text: '#94a3b8',
          textHover: '#ffffff',
        },
        navy: {
          800: '#0f172a',
          900: '#0b1a30',
          950: '#060d19',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px -2px rgba(11, 26, 48, 0.06), 0 2px 6px -2px rgba(11, 26, 48, 0.04)',
        'elevated': '0 10px 30px -5px rgba(11, 26, 48, 0.1), 0 4px 10px -4px rgba(11, 26, 48, 0.05)',
      }
    },
  },
  plugins: [],
}
