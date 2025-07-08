import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Wymuszaj podwójne cudzysłowy
      quotes: ["error", "double", { allowTemplateLiterals: true }],

      // Wymagaj średników
      semi: ["error", "always"],

      // Spójność indentacji (2 spacje)
      indent: ["error", 2, { SwitchCase: 1 }],

      // Usuń końcowe spacje
      "no-trailing-spaces": "error",

      // Maksymalnie jedna pusta linia pod rząd
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],

      // Wymagaj pustej linii na końcu pliku
      "eol-last": ["error", "always"],

      // Konsekwentne używanie przecinków
      "comma-dangle": ["error", "always-multiline"],

      // Spacje wokół operatorów
      "space-infix-ops": "error",

      // Spacje przed i po klamrach
      "object-curly-spacing": ["error", "always"],

      // Spacje w tablicach
      "array-bracket-spacing": ["error", "never"],

      // Spacje w funkcjach
      "space-before-function-paren": [
        "error",
        {
          anonymous: "always",
          named: "never",
          asyncArrow: "always",
        },
      ],

      // Konsekwentne używanie const/let
      "prefer-const": "error",
      "no-var": "error",

      // Unikaj console.log w produkcji
      "no-console": "warn",

      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Bardziej restrykcyjne podejście do any
      "@typescript-eslint/no-explicit-any": "warn",

      // Wymagaj return type dla funkcji
      "@typescript-eslint/explicit-function-return-type": "off",

      // React specific rules
      "react/prop-types": "off", // TypeScript handles this
      "react/react-in-jsx-scope": "off", // Next.js doesn't require this
      "react/no-unescaped-entities": [
        "error",
        {
          forbid: [">", "}", '"'],
        },
      ],

      // Hook rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
