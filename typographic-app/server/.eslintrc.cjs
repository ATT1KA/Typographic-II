module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:promise/recommended",
    "plugin:import/recommended",
    "plugin:n/recommended",
    "prettier"
  ],
  env: { node: true, es2022: true },
  ignorePatterns: ["dist", "node_modules"],
  rules: {
    "import/no-unresolved": "off",
    "n/no-missing-import": "off"
  }
};
