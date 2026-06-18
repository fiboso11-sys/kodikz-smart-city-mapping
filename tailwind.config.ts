import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#020617",
          900: "#0a1628",
          800: "#0f1f38",
        },
        gold: {
          DEFAULT: "#c9a227",
          light: "#e8c547",
          dark: "#8a6d12",
        },
        "dm-red": {
          DEFAULT: "#c8102e",
          light: "#e8354d",
        },
        "gis-blue": {
          DEFAULT: "#1d4ed8",
          light: "#38bdf8",
        },
        municipality: {
          DEFAULT: "#1d4ed8",
          light: "#38bdf8",
          dark: "#1e3a8a",
        },
      },
      boxShadow: {
        command: "0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(201,162,39,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
