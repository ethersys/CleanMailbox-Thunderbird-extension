const js = require("@eslint/js");

module.exports = [
  { ignores: ["node_modules/**", "*.xpi", "cleanmailbox.xpi"] },
  {
    files: ["lib/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        browser: "readonly",
        console: "readonly",
        document: "readonly",
      },
    },
    rules: js.configs.recommended.rules,
  },
  {
    files: ["**/*.js"],
    ignores: ["lib/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        browser: "readonly",
        console: "readonly",
        document: "readonly",
        window: "readonly",
        alert: "readonly",
        fetch: "readonly",
        XMLHttpRequest: "readonly",
        btoa: "readonly",
        Promise: "readonly",
        Array: "readonly",
        Object: "readonly",
        Set: "readonly",
        JSON: "readonly",
        Error: "readonly",
        require: "readonly",
        process: "readonly",
        module: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
    rules: js.configs.recommended.rules,
  },
];
