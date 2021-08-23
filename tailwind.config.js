/* eslint-disable */

const colors = require("tailwindcss/colors");

module.exports = {
  mode: "jit",
  purge: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    fontFamily: {
      sans: ["'Inter'", "sans-serif"],
      serif: ["Times", "serif"],
    },
    extend: {
      colors: {
        gray: colors.trueGray,
      },
    },
  },
};
