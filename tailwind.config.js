/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: {
          yellow: "#CCF900",
          gray: {
            10: "#525252",
            20: "#3A3A3A",
          },
        },
        disabled: {
          gray: "#7F7F7F",
        },
      },
      backgroundImage: {
        "primary-gradient": "linear-gradient(to left, #0d0d0d, #3a3a3a)",
        "primary-gradient-reverse":
          "linear-gradient(to right, #0d0d0d, #3a3a3a)",
      },
      animation: {
        shake: "shake 0.82s cubic-bezier(.36,.07,.19,.97) both infinite",
      },
      keyframes: {
        shake: {
          "10%, 90%": { transform: "translate3d(-1px, 0, 0)" },
          "20%, 80%": { transform: "translate3d(2px, 0, 0)" },
          "30%, 50%, 70%": { transform: "translate3d(-4px, 0, 0)" },
          "40%, 60%": { transform: "translate3d(4px, 0, 0)" },
        },
      },
      screens: {
        "max-xs": { max: "375px" },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};

