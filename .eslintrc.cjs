// .eslintrc.cjs
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  ignorePatterns: [
    'dist',
    'packages/*/dist',
    'build',
    'coverage',
    '.vite'
  ],
  overrides: [
    // Archivos CLI (Node.js)
    {
      files: ['packages/cli/**/*.{ts,tsx,js}'],
      env: { node: true }
    },
    // Archivos Web/React (Browser)
    {
      files: ['packages/web/**/*.{ts,tsx,js}', 'src/**/*.{ts,tsx,js}'],
      env: { browser: true },
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn'
      }
    }
  ],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off'
  }
};
