import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--color-background, #09090B)",
        foreground: "var(--color-foreground, #FAFAFA)",
        card: {
          DEFAULT: "var(--color-card, #121215)",
          foreground: "var(--color-card-foreground, #FAFAFA)",
        },
        muted: {
          DEFAULT: "var(--color-muted, #18181B)",
          foreground: "var(--color-muted-foreground, #A1A1AA)",
        },
        border: "var(--color-border, #27272A)",
        accent: {
          DEFAULT: "var(--color-accent, #10B981)",
          foreground: "var(--color-on-accent, #09090B)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
