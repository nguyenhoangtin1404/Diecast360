/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        /** Lamborghini Vault showcase — matches loaded Google Font */
        almarai: ['Almarai', "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "corporate-card": "0 4px 20px -2px rgb(var(--shop-primary-rgb) / 0.1)",
        "corporate-card-hover":
          "0 10px 25px -5px rgb(var(--shop-primary-rgb) / 0.15), 0 8px 10px -6px rgb(var(--shop-primary-rgb) / 0.1)",
        "corporate-btn": "0 4px 14px 0 rgb(var(--shop-primary-rgb) / 0.3)",
        "corporate-glow": "0 0 20px rgb(var(--shop-primary-rgb) / 0.35)",
      },
      colors: {
        /** Lamborghini Vault — neon accent (#EFFF04); use vault-* to avoid clashing with shadcn `primary` */
        vault: {
          primary: "#EFFF04",
          accentDark: "#0A0A0A",
          feature: "#1A1A1A",
        },
        accentDark: "#0A0A0A",
        shop: "rgb(var(--shop-primary-rgb) / <alpha-value>)",
        shopAccent: "rgb(var(--shop-accent-rgb) / <alpha-value>)",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      keyframes: {
        "blob-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(24px, -16px) scale(1.03)" },
          "66%": { transform: "translate(-12px, 12px) scale(0.98)" },
        },
      },
      animation: {
        "blob-drift": "blob-drift 18s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
