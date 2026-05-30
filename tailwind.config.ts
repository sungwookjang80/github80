import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50:  '#FBF5ED',
          100: '#F5E8D5',
          200: '#EDD4B3',
          300: '#E4C091',
          400: '#DBAC6F',
          500: '#D4A373',
          600: '#D4A373',
          700: '#B88A5C',
          800: '#9C7145',
          900: '#7A5330',
          DEFAULT: '#D4A373',
        },
        ocean: {
          50:  '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          DEFAULT: '#0891B2',
        },
        forest: {
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          500: '#22C55E',
          600: '#166534',
          700: '#14532D',
          800: '#052E16',
          DEFAULT: '#166534',
        },
        nomad: {
          bg: '#FFFDF7',
          surface: '#FFFFFF',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

export default config
