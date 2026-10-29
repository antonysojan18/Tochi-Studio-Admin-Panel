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
        tochi: {
          canvas: "#FAF6F0",          // Warm Ivory Base
          surface: "#FFFFFF",         // Clean White Surface
          surfaceSubtle: "#F4EDE2",   // Soft Ivory Tint
          border: "#E7DFD3",          // Warm Hairline Border
          borderDark: "#D6CCC0",      // Medium Border
          burgundy: {
            DEFAULT: "#541228",       // Primary Deep Burgundy
            hover: "#6B1733",
            dark: "#3B0D1C",
            light: "#821E42",
            tint: "#F7EEF1",          // Very light burgundy tint for badges/accents
            border: "rgba(84, 18, 40, 0.16)",
          },
          text: {
            DEFAULT: "#1C181B",       // Sharp Near-Black Charcoal
            muted: "#665E64",         // Neutral Muted
            subtle: "#9E959B",        // Subtle Secondary
          },
          emerald: {
            DEFAULT: "#0D7A53",
            tint: "#EDF9F4",
            border: "#B7E7D5",
          },
          amber: {
            DEFAULT: "#B45309",
            tint: "#FEF8EC",
            border: "#FDE4B0",
          },
          blue: {
            DEFAULT: "#1E40AF",
            tint: "#EFF6FF",
            border: "#C7DCFE",
          },
          purple: {
            DEFAULT: "#6B21A8",
            tint: "#FAF5FF",
            border: "#E9D5FF",
          },
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "'JetBrains Mono'",
          "'Fira Code'",
          "Consolas",
          "Menlo",
          "Monaco",
          "monospace",
        ],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(28, 24, 27, 0.05), 0 1px 2px -1px rgba(28, 24, 27, 0.04)",
        elevated: "0 4px 16px -2px rgba(28, 24, 27, 0.08), 0 2px 4px -2px rgba(28, 24, 27, 0.04)",
        modal: "0 20px 40px -8px rgba(28, 24, 27, 0.16), 0 8px 16px -4px rgba(28, 24, 27, 0.08)",
        burgundy: "0 4px 14px -2px rgba(84, 18, 40, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
