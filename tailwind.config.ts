// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "dnx-blue": "#1e40af",
        "dnx-light-blue": "#3b82f6",
        "dnx-orange": "#f97316",
        "dnx-light-orange": "#fb923c",
      },
    },
  },
  plugins: [],
};
export default config;
