import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171717",
        muted: "#6b7280",
        line: "#e5e7eb",
        accent: "#d4302a"
      }
    }
  },
  plugins: []
};

export default config;
