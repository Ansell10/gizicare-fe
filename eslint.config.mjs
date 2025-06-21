import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = {
  overrides: [
    {
      files: ['*.js', '*.ts', '*.tsx'], // Menetapkan aturan untuk file JS, TS, dan TSX
      extends: [
        "next/core-web-vitals",    // Menambahkan aturan Next.js untuk web vitals
        "next/typescript"          // Menambahkan aturan untuk TypeScript di Next.js
      ],
      plugins: [
        "next",                    // Plugin untuk Next.js
        "@typescript-eslint"       // Plugin untuk TypeScript
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "off", // Nonaktifkan aturan no-explicit-any
        "react/no-unescaped-entities": "off",        // Nonaktifkan aturan no-unescaped-entities
        "@typescript-eslint/no-unused-vars": "warn", // Menambahkan aturan no-unused-vars
        "react-hooks/exhaustive-deps": "warn",      // Menambahkan aturan exhaustive-deps untuk React hooks
        "next/next/no-img-element": "warn"          // Menambahkan aturan no-img-element untuk penggunaan gambar di Next.js
      }
    }
  ]
};

export default eslintConfig;
