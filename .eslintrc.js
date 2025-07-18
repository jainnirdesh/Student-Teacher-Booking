module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'arrow-spacing': 'error',
    'comma-spacing': 'error',
    'key-spacing': 'error',
    'space-before-blocks': 'error',
    'space-infix-ops': 'error'
  },
  globals: {
    'bootstrap': 'readonly',
    'Chart': 'readonly',
    'firebase': 'readonly'
  }
};
