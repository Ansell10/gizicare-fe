import { defineConfig } from "eslint-define-config";

export default defineConfig({
  extends: ["next/core-web-vitals", "next/typescript"],
  plugins: ["next", "@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "react/no-unescaped-entities": "off",
    "@typescript-eslint/no-unused-vars": "warn", // Menambahkan aturan no-unused-vars
    "react-hooks/exhaustive-deps": "warn", // Menambahkan aturan exhaustive-deps
    "next/next/no-img-element": "warn" // Menambahkan aturan no-img-element
  },
});
