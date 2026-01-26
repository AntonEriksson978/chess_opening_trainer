const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...fontFamily.sans],
      },
      borderRadius: {
        DEFAULT: "8px",
        secondary: "4px",
        container: "12px",
      },
      boxShadow: {
        DEFAULT: "0 1px 4px rgba(0, 0, 0, 0.1)",
        hover: "0 2px 8px rgba(0, 0, 0, 0.12)",
      },
      colors: {
        primary: {
          DEFAULT: "#629924",
          hover: "#4d7a1d",
        },
        secondary: {
          DEFAULT: "#6B7280",
          hover: "#4B5563",
        },
        accent: {
          DEFAULT: "#bf811d",
          hover: "#a06f19",
        },
        // Lichess-style board colors
        board: {
          light: "#f0d9b5",
          dark: "#b58863",
          highlight: "#cdd26a",
          selected: "#819669",
        },
        // Dark theme header
        header: {
          DEFAULT: "#262421",
          text: "#bababa",
        },
      },
      spacing: {
        "form-field": "16px",
        section: "32px",
      },
    },
  },
};
