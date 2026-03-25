import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#1A428A",
        teal: "#3CABD2",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "var(--font-be-vietnam)", "sans-serif"],
        heading: ["var(--font-jakarta)", "var(--font-dm-sans)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
