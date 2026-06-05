/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F9F9FB",
        },
        brand: {
          green: "#059669",
          "green-light": "#ecfdf5",
          orange: "#f97316",
          "orange-light": "#fff7ed",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(0, 0, 0, 0.03), 0 4px 20px rgba(0, 0, 0, 0.04)",
        "card-hover":
          "0 2px 6px rgba(0, 0, 0, 0.04), 0 12px 36px rgba(0, 0, 0, 0.06)",
        "focus-green": "0 0 0 4px rgba(5, 150, 105, 0.12)",
        "focus-orange": "0 0 0 4px rgba(249, 115, 22, 0.12)",
      },
    },
  },
  plugins: [],
};
