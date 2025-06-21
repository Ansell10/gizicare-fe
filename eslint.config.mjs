import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": "warn", // Menambahkan aturan no-unused-vars
      "react-hooks/exhaustive-deps": "warn", // Menambahkan aturan exhaustive-deps
      "next/next/no-img-element": "warn" // Menambahkan aturan no-img-element
    },
  },
];

export default eslintConfig;
