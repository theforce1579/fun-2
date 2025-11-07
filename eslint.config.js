import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";

export default [
  {
    ignores: ["dist/**", "node_modules/**"]
  },
  js.configs.recommended,
  reactPlugin.configs.flat.recommended,
  {
    files: ["api/**/*.js", "server/**/*.js", "vite.config.js"],
    languageOptions: {
      globals: {
        process: "readonly",
        Buffer: "readonly",
        console: "readonly",
        fetch: "readonly"
      }
    }
  },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        document: "readonly",
        window: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        console: "readonly"
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      react: reactPlugin
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "no-console": "off"
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  }
];
