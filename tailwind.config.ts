/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'cyan-light': '#7FEFEF',
        'teal': '#33D1CC',
        'yellow': '#FFED66',
        'peach': '#FFB380',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-palette': 'linear-gradient(to bottom, #7FEFEF, #33D1CC, #FFED66, #FFB380)',
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false
  }
}
