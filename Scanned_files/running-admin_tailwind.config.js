/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            50: "#eafef2",
            100: "#d0fce0",
            200: "#a4f7c6",
            300: "#6eeaa6",
            400: "#38d682",
            500: "#1abb66",
            600: "#0e9651",
            700: "#0c7742",
            800: "#0d5e37",
            900: "#0a4d2f",
            950: "#052b1a",
          },
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
        },
      },
    },
    plugins: [],
  }