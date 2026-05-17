import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['node_modules', 'dist'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.ts'],

    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
