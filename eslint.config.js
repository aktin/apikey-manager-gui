/**
 * ESLint configuration for the Electron + Vue 3 + Vite project.
 *
 * Uses ESLint's modern flat config format (v9+).
 * Applies:
 * - Vue 3 essential rules for Single File Components (.vue)
 * - Recommended rules for TypeScript
 * - Consistent code style (double quotes, semicolons)
 * - Warning for unused variables, ignoring those prefixed with `_`
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files-new
 */
import vue from 'eslint-plugin-vue';
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts', '**/*.vue'],
    ignores: ['node_modules', '.vite', 'dist'],
    languageOptions: {
      parser: parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      }
    },
    plugins: {
      vue,
      '@typescript-eslint': tseslint
    },
    rules: {
      ...vue.configs['vue3-essential'].rules,
      ...tseslint.configs.recommended.rules,

      // Formatting consistency
      quotes: ['error', 'double'],
      semi: ['error', 'always'],

      // Code hygiene
      'no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {argsIgnorePattern: '^_'}]
    }
  }
];
