
export default {
  darkMode: 'class',
  content: ['./index.html','./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      keyframes: {
        'bg-pan': {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'float': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-6px)' },
        },
        'shine': {
          '0%':   { transform: 'translateX(-150%)' },
          '100%': { transform: 'translateX(150%)' },
        },
      },
      animation: {
        'bg-pan-slow': 'bg-pan 18s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shine': 'shine 1.8s linear infinite',
      },
    },
  },
  plugins: [],
};
