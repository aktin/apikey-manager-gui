import vue from 'eslint-plugin-vue';
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts', '**/*.vue'],
    languageOptions: {
      parser: parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      vue,
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...vue.configs["vue3-essential"].rules,
      ...tseslint.configs.recommended.rules,
      quotes: ["error", "double"]
    },
  },
];
