/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0f172a",   // deep slate (trust)
        accent: "#2563eb",    // civic blue
        surface: "#f8fafc",   // soft background
      },
    },
  },
  plugins: [],
};
