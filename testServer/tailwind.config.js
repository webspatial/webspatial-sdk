import daisyui from 'daisyui'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './index.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  daisyui: {
    base: false,
    themes: false, // Disable all themes
  },
  plugins: [daisyui, typography],
}
