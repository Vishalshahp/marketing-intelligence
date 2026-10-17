/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#14243A',
          hover: '#0F1A2A',
          light: '#1F3452'
        },
        blue: {
          DEFAULT: '#356AE6',
          hover: '#2954C2',
          light: '#EBF1FD'
        },
        teal: {
          DEFAULT: '#16B8A6',
          hover: '#0D9488',
          light: '#E6FAF8'
        },
        canvas: '#F5F7FB',
        surface: '#FFFFFF',
        border: '#E2E8F0',
        text: '#182230',
        muted: '#667085',
        success: {
          DEFAULT: '#16804A',
          light: '#EDF7F1'
        },
        warning: {
          DEFAULT: '#9A5B00',
          light: '#FFF9EB'
        },
        error: {
          DEFAULT: '#B42318',
          light: '#FDF2F2'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
