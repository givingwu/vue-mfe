module.exports = {
  env: {
    browser: true,
    es6: true,
    amd: true,
    node: true
  },
  extends: 'eslint:recommended',
  // "extends": "standard",
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2018,
    allowImportExportEverywhere: false,
    codeFrame: true
  },
  rules: {
    indent: ['warning', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    // 这一行代码就是允许console.log 设置
    'no-console': 'off',
    'no-debugger': 'off'
  }
}
