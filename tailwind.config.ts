import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        command: {
          bg: "#070B14",
          card: "#0F172A",
          border: "#1E293B",
          subtle: "#334155",
          highlight: "#020617",
        },
        hazard: {
          red: "#EF4444",
          orange: "#F97316",
          yellow: "#EAB308",
          green: "#10B981",
          cyan: "#06B6D4",
          blue: "#3B82F6",
        },
      },
      boxShadow: {
        "glow-red": "0 0 20px -3px rgba(239, 68, 68, 0.4)",
        "glow-orange": "0 0 20px -3px rgba(249, 115, 22, 0.4)",
        "glow-yellow": "0 0 20px -3px rgba(234, 179, 8, 0.4)",
        "glow-cyan": "0 0 20px -3px rgba(6, 182, 212, 0.4)",
        "glow-green": "0 0 20px -3px rgba(16, 185, 129, 0.4)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
