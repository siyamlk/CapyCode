/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Pulled directly from CapyCode's mascot palette (see docs/ART_STYLE.md)
        capy: {
          outline: "#5A3A28",
          darkfur: "#8B5E3C",
          mainfur: "#C49A6C",
          lightfur: "#E8C9A6",
          belly: "#F7E6CB",
          eyes: "#2B211C",
          blush: "#F7B6C2",
          scarf: "#87A97A",
          scarfshade: "#5F8C56",
          cup: "#FFFFFF",
          tea: "#B07A4A",
          steam: "#EDE9E4",
          cream: "#FDF6EC",
        },
      },
      fontFamily: {
        cozy: ["'Quicksand'", "system-ui", "sans-serif"],
        pixel: ["'Press Start 2P'", "monospace"],
      },
      borderRadius: {
        cozy: "1.25rem",
      },
      boxShadow: {
        cozy: "0 4px 14px rgba(90, 58, 40, 0.15)",
      },
    },
  },
  plugins: [],
};
