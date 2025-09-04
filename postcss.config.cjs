const plugins = [];
try {
  plugins.push(require('tailwindcss'));
} catch {}
try {
  plugins.push(require('autoprefixer'));
} catch {}

module.exports = { plugins };
