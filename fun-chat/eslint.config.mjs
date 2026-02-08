import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  { linterOptions: { noInlineConfig: true } },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      unicorn,
      prettier,
    },
    rules: {
      ...unicorn.configs.recommended.rules,
      ...prettierConfig.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
      'no-magic-numbers': ['warn', { 
        ignore: [0, 1, -1, 2, 7, 10, 100, 200, 500, 1000, 2000, 3000, 5000], 
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true,
        detectObjects: false,
        enforceConst: true,
        ignoreNumericLiteralTypes: true,
        ignoreEnums: true,
        ignoreReadonlyClassProperties: true,
      }],
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
      'prettier/prettier': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MemberExpression[property.name="querySelector"]',
          message: 'querySelector is not allowed. Use createElement and appendChild instead.',
        },
        {
          selector: 'MemberExpression[property.name="querySelectorAll"]',
          message: 'querySelectorAll is not allowed. Use createElement and appendChild instead.',
        },
        {
          selector: 'MemberExpression[property.name="getElementById"]',
          message: 'getElementById is not allowed. Use createElement and appendChild instead.',
        },
        {
          selector: 'MemberExpression[property.name="getElementsByClassName"]',
          message: 'getElementsByClassName is not allowed. Use createElement and appendChild instead.',
        },
        {
          selector: 'MemberExpression[property.name="getElementsByTagName"]',
          message: 'getElementsByTagName is not allowed. Use createElement and appendChild instead.',
        },
        {
          selector: 'MemberExpression[property.name="innerHTML"]',
          message: 'innerHTML is not allowed. Use createElement and textContent/innerText instead.',
        },
        {
          selector: 'MemberExpression[property.name="outerHTML"]',
          message: 'outerHTML is not allowed. Use createElement and appendChild instead.',
        },
      ],
    },
  },
  {
    ignores: [
      'dist',
      'eslint.config.mjs',
      'vite.config.ts',
      'vite.config.d.ts',
      'vite.config.js',
      'node_modules',
      '*.config.js',
    ],
  }
);
