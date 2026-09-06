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
        // Core backgrounds
        bg: {
          base: "#090910",
          surface: "#0f0f1a",
          elevated: "#14141f",
          card: "#12121d",
          hover: "#1a1a2e",
        },
        // Purple primary
        primary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          DEFAULT: "#7c3aed",
        },
        // Violet accent
        violet: {
          DEFAULT: "#a855f7",
          light: "#c084fc",
          dark: "#6d28d9",
        },
        // Pink accent
        pink: {
          DEFAULT: "#ec4899",
          light: "#f472b6",
          dark: "#be185d",
        },
        // Text
        text: {
          primary: "#ffffff",
          secondary: "#a1a1b5",
          muted: "#6b6b8a",
          dim: "#3d3d5c",
        },
        // Functional
        live: "#ef4444",
        gold: "#f59e0b",
        success: "#10b981",
        border: {
          DEFAULT: "#1e1e32",
          light: "#2a2a45",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "purple-gradient": "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)",
        "purple-subtle": "linear-gradient(135deg, #7c3aed20 0%, #a855f720 100%)",
        "card-gradient": "linear-gradient(180deg, #14141f 0%, #0f0f1a 100%)",
        "reveal-gradient": "linear-gradient(135deg, #6d28d9 0%, #7c3aed 40%, #a855f7 70%, #ec4899 100%)",
        "live-gradient": "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)",
      },
      boxShadow: {
        "purple-glow": "0 0 20px rgba(124,58,237,0.4)",
        "purple-sm": "0 0 10px rgba(124,58,237,0.25)",
        "card": "0 4px 24px rgba(0,0,0,0.4)",
        "modal": "0 8px 48px rgba(0,0,0,0.6)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
