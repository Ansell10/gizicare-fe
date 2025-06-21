import { defineConfig } from "eslint-define-config";

export default defineConfig({
  plugins: [
    "next", // Menambahkan plugin Next.js
    "@typescript-eslint", // Menambahkan plugin TypeScript
    "react" // Menambahkan plugin React
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "off", // Mematikan aturan no-explicit-any
    "react/no-unescaped-entities": "off", // Mematikan aturan react/no-unescaped-entities
    "@typescript-eslint/no-unused-vars": "warn", // Menambahkan aturan no-unused-vars
    "react-hooks/exhaustive-deps": "warn", // Menambahkan aturan exhaustive-deps
    "next/next/no-img-element": "warn" // Menambahkan aturan no-img-element
  }
});
