import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Brand colors
        sunny: {
          DEFAULT: "#FFD93D",
          light: "#FFE066",
          dark: "#E8C235",
        },
        electric: {
          DEFAULT: "#6C9FFF",
          light: "#8BB4FF",
          dark: "#5A8FEE",
        },
        coral: {
          DEFAULT: "#FF6B6B",
          light: "#FF8A8A",
          dark: "#E85555",
        },
        mint: {
          DEFAULT: "#6BCB77",
          light: "#8AD994",
          dark: "#5AB869",
        },
        lavender: {
          DEFAULT: "#B794F6",
          light: "#CAADFF",
          dark: "#A07DE8",
        },
        peachy: {
          DEFAULT: "#FFAB76",
          light: "#FFBC8E",
          dark: "#E8956C",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
