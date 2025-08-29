/** @type {import('eslint').Linter.Config} */
export default {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  ignorePatterns: ['dist/**'],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'off'
  }
};
