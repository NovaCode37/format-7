import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {

        brand: "#1D4ED8",
        "brand-dark": "#1E3A8A",
        "brand-light": "#EFF6FF",

        accent: {
          DEFAULT: "#F97316",
          light:   "#FFF7ED",
          dark:    "#EA580C",
        },

        success: { DEFAULT: "#059669", light: "#ECFDF5" },
        danger:  { DEFAULT: "#DC2626", light: "#FEF2F2" },

        ink: {
          50:  "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
          950: "#0C0A09",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        heading: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-inter)", "sans-serif"],
      },
      fontSize: {
        "display-sm": ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display":    ["3rem",    { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        "display-lg": ["4rem",    { lineHeight: "1.0",  letterSpacing: "-0.03em" }],
        "display-xl": ["5.5rem",  { lineHeight: "0.98", letterSpacing: "-0.035em" }],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(28, 25, 23, 0.05)",
        card: "0 1px 3px 0 rgba(28, 25, 23, 0.08), 0 1px 2px -1px rgba(28, 25, 23, 0.05)",
        elev: "0 10px 30px -10px rgba(28, 25, 23, 0.15), 0 4px 10px -4px rgba(28, 25, 23, 0.07)",
        focus: "0 0 0 3px rgba(29, 78, 216, 0.2)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
        swift: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(to right, rgba(28,25,23,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(28,25,23,0.03) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
