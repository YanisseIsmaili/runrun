/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // THEME VERT PRINCIPAL
        primary: {
          50: "#f0fdf4",
          100: "#dcfce7", 
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        // COULEURS ÉMERAUDE POUR LES ACCENTS
        emerald: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        // COULEURS SECONDAIRES (restent inchangées)
        secondary: {
          50: "#f2f7fb",
          100: "#e5eef5",
          200: "#c6dcea",
          300: "#94bfd9",
          400: "#5c9cc2",
          500: "#3980aa",
          600: "#2c6690",
          700: "#265274",
          800: "#244661",
          900: "#223c53",
          950: "#162736",
        },
        // COULEURS SYSTÈME
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        // COULEURS SPÉCIALES POUR LE THÈME VERT
        'green-gradient': {
          'from': '#16a34a',
          'via': '#10b981',
          'to': '#15803d',
        },
        'green-light': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
        }
      },
      // GRADIENTS PERSONNALISÉS
      backgroundImage: {
        'green-gradient': 'linear-gradient(135deg, #16a34a 0%, #10b981 50%, #15803d 100%)',
        'green-gradient-hover': 'linear-gradient(135deg, #15803d 0%, #059669 50%, #14532d 100%)',
        'green-light-gradient': 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%)',
        'green-card-gradient': 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
        'green-badge-gradient': 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
        'green-success-gradient': 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        'green-alert-gradient': 'linear-gradient(135deg, rgba(240, 253, 244, 0.9) 0%, rgba(236, 253, 245, 0.9) 100%)',
      },
      // OMBRES PERSONNALISÉES
      boxShadow: {
        'green': '0 10px 25px rgba(34, 197, 94, 0.1)',
        'green-lg': '0 15px 35px rgba(34, 197, 94, 0.15)',
        'green-xl': '0 25px 50px rgba(34, 197, 94, 0.3)',
        'green-button': '0 4px 12px rgba(34, 197, 94, 0.2)',
        'green-hover': '0 10px 25px rgba(34, 197, 94, 0.3)',
      },
      // ANIMATIONS PERSONNALISÉES
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in-right': 'slideInFromRight 0.3s ease-out',
        'slide-in-left': 'slideInFromLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'green-pulse': 'greenPulse 2s infinite',
        'bounce-gentle': 'bounce 1s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      // KEYFRAMES PERSONNALISÉES
      keyframes: {
        fadeIn: {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(10px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
        },
        slideInFromRight: {
          '0%': { 
            opacity: '0', 
            transform: 'translateX(20px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateX(0)' 
          },
        },
        slideInFromLeft: {
          '0%': { 
            opacity: '0', 
            transform: 'translateX(-20px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateX(0)' 
          },
        },
        scaleIn: {
          '0%': { 
            opacity: '0', 
            transform: 'scale(0.95)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'scale(1)' 
          },
        },
        greenPulse: {
          '0%, 100%': { 
            boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)' 
          },
          '50%': { 
            boxShadow: '0 0 0 10px rgba(34, 197, 94, 0)' 
          },
        },
      },
      // TRANSITIONS PERSONNALISÉES
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
        'colors-transform': 'color, background-color, border-color, text-decoration-color, fill, stroke, transform',
      },
      // LARGEURS ET HAUTEURS PERSONNALISÉES
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // POLICES PERSONNALISÉES
      fontFamily: {
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      // TAILLES DE POLICE PERSONNALISÉES
      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '0.75rem' }],
        '2.5xl': ['1.75rem', { lineHeight: '2rem' }],
        '3.5xl': ['2rem', { lineHeight: '2.25rem' }],
      },
      // RAYONS DE BORDURE PERSONNALISÉS
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      // BACKDROP BLUR PERSONNALISÉ
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [
    // Plugin pour les formulaires
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    // Plugin pour la typographie
    require('@tailwindcss/typography'),
    // Plugin personnalisé pour les utilitaires du thème vert
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.bg-green-gradient': {
          background: 'linear-gradient(135deg, #16a34a 0%, #10b981 50%, #15803d 100%)',
        },
        '.bg-green-gradient-hover': {
          background: 'linear-gradient(135deg, #15803d 0%, #059669 50%, #14532d 100%)',
        },
        '.bg-green-light-gradient': {
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%)',
        },
        '.text-gradient-green': {
          background: 'linear-gradient(135deg, #16a34a, #10b981)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.border-green-gradient': {
          border: '1px solid transparent',
          background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #16a34a, #10b981) border-box',
        },
        '.glass-green': {
          'backdrop-filter': 'blur(10px)',
          background: 'linear-gradient(135deg, rgba(240, 253, 244, 0.8) 0%, rgba(236, 253, 245, 0.8) 100%)',
        },
        '.scrollbar-green': {
          'scrollbar-width': 'thin',
          'scrollbar-color': 'rgba(34, 197, 94, 0.3) transparent',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(135deg, #bbf7d0, #86efac)',
            'border-radius': '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(135deg, #86efac, #4ade80)',
          },
        },
      }
      addUtilities(newUtilities)
    }
  ],
}