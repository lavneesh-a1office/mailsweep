import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";
import reactRecommended from "eslint-plugin-react/configs/recommended.js";

export default tseslint.config(
  {
    ignores: [
      "dist/",
      "build/",
      ".vite/",
      ".next/",
      ".turbo/",
      "node_modules/",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { import: importPlugin },
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { project: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },

  {
    ...reactRecommended,
    files: ["**/*.{ts,tsx,js,jsx}"],
    settings: { react: { version: "detect" } },
    plugins: { "jsx-a11y": jsxA11y, "react-hooks": reactHooks },
    languageOptions: {
      ...reactRecommended.languageOptions,
      globals: globals.browser,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "react/prop-types": "off",
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "jsx-a11y/anchor-is-valid": "warn",
    },
  },
  {
    name: "next/core-web-vitals",
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: { "@next/next": nextPlugin },
    languageOptions: { globals: globals.browser },
    rules: nextPlugin.configs["core-web-vitals"].rules,
    ...(nextPlugin.configs["core-web-vitals"].settings
      ? { settings: nextPlugin.configs["core-web-vitals"].settings }
      : {}),
  },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: { globals: globals.node },
    extends: [tseslint.configs.disableTypeChecked],
  }
);
