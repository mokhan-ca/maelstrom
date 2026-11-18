import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', '.wrangler/', 'node_modules/'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.vitest } },
  },
];
