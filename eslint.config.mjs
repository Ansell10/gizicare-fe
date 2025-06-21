import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// Mengimpor aturan ESLint menggunakan import
import eslintRecommended from 'eslint/conf/eslint-recommended.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: Object.fromEntries(
      Object.keys(eslintRecommended.rules).map(rule => [
        rule,
        "warn",
      ])
    ),
  },
];

export default eslintConfig;
