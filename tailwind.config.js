/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/views/**/*.ejs"],
  theme: {
    extend: {
      colors: {
        // Republican Red as primary color
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#E31837', // Republican Red
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Navy as accent color
        accent: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#1B4B9B', // Traditional Navy
          600: '#0f172a',
          700: '#0f172a',
          800: '#0c1524',
          900: '#0a1221',
          950: '#080f1c',
        }
      }
    },
  },
  plugins: [
    function({ addComponents }) {
      addComponents({
        '.btn': {
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          fontWeight: '500',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 150ms ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)'
          },
          '&:active': {
            transform: 'translateY(0)'
          }
        },
        '.btn-primary': {
          backgroundColor: '#E31837',
          color: 'white',
          '&:hover': {
            backgroundColor: '#b91c1c'
          }
        },
        '.input': {
          width: '100%',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.375rem',
          border: '1px solid #e5e7eb',
          transition: 'border-color 150ms ease-in-out',
          '&:focus': {
            outline: 'none',
            borderColor: '#E31837',
            boxShadow: '0 0 0 3px rgba(227, 24, 55, 0.1)'
          }
        }
      })
    }
  ]
}