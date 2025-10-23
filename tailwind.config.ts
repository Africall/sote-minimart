import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "#4A7FD9",
          dark: "#1A3A6B",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          light: "#FF5864",
          dark: "#C62B36",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        /* Brand helpers */
        "royal-blue": {
          50: "#EFF4FF",
          100: "#DBE7FE",
          500: "#2E5AAC",
          600: "#1A3A6B",
          700: "#132B50",
        },
        "vibrant-red": {
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#E63946",
          600: "#C62B36",
          700: "#A61E2A",
        },

        /* POS legacy palette (kept) */
        pos: {
          primary: "#1a365d",
          secondary: "#319795",
          accent: "#e53e3e",
          light: "#f7fafc",
          dark: "#2d3748",
        },
      },

      /* New gradients & shadows */
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, #2E5AAC 0%, #4A7FD9 100%)",
        "gradient-secondary":
          "linear-gradient(135deg, #E63946 0%, #FF5864 100%)",
        "gradient-accent":
          "linear-gradient(135deg, #2E5AAC 0%, #E63946 100%)",
        "gradient-sidebar":
          "linear-gradient(180deg, #1A3A6B 0%, #2E5AAC 100%)",
      },
      boxShadow: {
        "glow-primary": "0 0 20px rgba(46, 90, 172, 0.40)",
        "glow-secondary": "0 0 20px rgba(230, 57, 70, 0.40)",
        elegant: "0 4px 20px rgba(0,0,0,0.08)",
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      /* Existing + new motion */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "gradient-shift": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        float: "float 3s ease-in-out infinite",
        "scale-in": "scale-in 0.3s ease-out",
        "gradient-shift": "gradient-shift 3s ease infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
