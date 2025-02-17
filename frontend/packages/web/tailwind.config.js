/* eslint-env node */
module.exports = {
  content: ["./index.html", "./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        'fira': ['Fira Sans', 'sans-serif'],
      },
      colors: {
        violet: "#6E3A85", // Shine Violet
        purple: {
          DEFAULT: "#431E5A", // Purple Jump
          100: "#894DA0", // Wine Purple
        },
        black: {
          DEFAULT: "#000000", // Black
          200: "#000000B3", // Black Glass
        },
        green: "#559C71", // Soft Green
        blue: "#5E6DEC", // Soft Blue
        red: "#CE2828", // Soft Red
        white: {
          DEFAULT: "#FFFFFF", // White
          200: "#E2E8F0", // Gray
          300: "#FFFFFFBF", // Transparent White 2
          400: "#FFFFFF80", // Transparent White
          500: "#FCFCFC33", // Glass 1
          550: "#FFFFFF26", // White 15%
          600: "#FFFFFF1A", // Glass 2
        },
        'custom-start': 'rgba(60, 26, 59, 0.46)',
        'custom-end': 'rgba(139, 64, 171, 0.46)',
      },
      backgroundImage: {
        jump: "linear-gradient(90deg, #510B72 0%, #740B0B 100%) fixed", // Jump Gradient
        jump2: "linear-gradient(90deg, #AE00FF 0%, #FF1100 100%) fixed", // Jump Gradient 2
        guide:
          "linear-gradient(90deg, #CCA3FE 0%, rgba(174,89,240,1) 22%, rgba(138,101,243,1) 100%)",
      },
      borderRadius: {
        none: 0,
        sm: ".625rem",
        lg: "1.25rem",
      },
      lineHeight: {
        3.5: ".875rem",
        4.5: "1.125rem",
      },
      letterSpacing: {
        tighter: "-.06rem",
        tight: "-.04rem",
        DEFAULT: "-.027rem",
        normal: "0",
      },
      fontSize: {
        3: ".75rem",
        3.5: ".875rem",
        4: "1rem",
        4.5: "1.125rem",
        5: "1.25rem",
        6: "1.5rem",
      },
      spacing: {
        4.5: "1.125rem",
        17: "4.25rem",
      },
      animation: {
        enter: "enter 200ms ease-out",
        "slide-in": "slide-in 1.2s cubic-bezier(.41,.73,.51,1.02)",
        leave: "leave 150ms ease-in forwards",
      },
      keyframes: {
        enter: {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        leave: {
          "0%": { transform: "scale(1)", opacity: 1 },
          "100%": { transform: "scale(0.9)", opacity: 0 },
        },
        "slide-in": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/line-clamp")],
};
