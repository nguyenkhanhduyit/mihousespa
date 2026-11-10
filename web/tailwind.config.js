/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf6f4',
          100: '#fbe9e4',
          200: '#f7cfc5',
          300: '#efaa99',
          400: '#e27f68',
          500: '#d95f45',
          600: '#c24630',
          700: '#a13726',
          800: '#822f23',
          900: '#6a2a21',
        },
        ink: {
          50: '#f7f7f8',
          100: '#ececf0',
          200: '#d5d5dd',
          300: '#b1b1bf',
          400: '#86869a',
          500: '#67677c',
          600: '#525263',
          700: '#43434f',
          800: '#3a3a44',
          900: '#24242c',
        },
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 8px 24px rgba(16,24,40,.06)',
        'card-hover': '0 2px 4px rgba(16,24,40,.06), 0 16px 40px rgba(16,24,40,.10)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
