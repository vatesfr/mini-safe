module.exports = {
  env: { browser: true, es6: true, node: true },
  extends: ["standard", "standard-jsx", "prettier"],
  parserOptions: {
    ecmaVersion: 8,
    sourceType: "module",
  },

  rules: {
    // prefer let/const over var
    "no-var": "error",

    // prefer const over let when possible
    //
    // should be included in standard: https://github.com/standard/eslint-config-standard/pull/133/
    "prefer-const": "error",

    // detect incorrect import/require
    "node/no-extraneous-import": "error",
    "node/no-extraneous-require": "error",
    "node/no-missing-require": "error",
    "node/no-missing-import": "error",
  },
};
