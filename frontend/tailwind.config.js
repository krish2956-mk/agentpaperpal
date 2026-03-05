/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gray: {
          950: "#0a0a0f",
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite",
        "fill-bar": "fillBar 1s ease-out forwards",
        "fade-in": "fadeIn 0.3s ease-in",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fillBar: {
          from: { width: "0%" },
          to: { width: "var(--bar-width)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
