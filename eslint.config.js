// ESLint "flat config". It lints our TypeScript source for likely mistakes.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Never lint these: build output, dependencies, the browser UI, example
  // specs, and the templates (which contain {{placeholders}}, not valid code).
  {
    ignores: ["dist/", "node_modules/", "templates/", "public/", "examples/"],
  },

  // Base recommended rules for JS and TypeScript.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Our source files and a couple of pragmatic rule tweaks.
  {
    files: ["src/**/*.ts"],
    rules: {
      // We intentionally use `any` for loosely-typed OpenAPI spec parsing.
      "@typescript-eslint/no-explicit-any": "off",
      // Allow unused function args that start with _ (e.g. (_req, res)).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  }
);
