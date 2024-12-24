const typescriptPlugin = require("@typescript-eslint/eslint-plugin"); // Подключаем плагин через require
const typescriptParser = require("@typescript-eslint/parser"); // Подключаем плагин через require

module.exports = [
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["./*", "../*"],
        },
      ],
    },
    ignores: ["dist/**/*", "node_modules/**/*"],
  },
];
