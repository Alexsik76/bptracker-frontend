import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vueParser from 'vue-eslint-parser';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'node_modules/'] },

  js.configs.recommended,

  ...pluginVue.configs['flat/recommended'],

  {
    files: ['src/**/*.ts', 'src/**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        sourceType: 'module',
        ecmaVersion: 2022,
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'no-undef': 'off', // TypeScript handles undefined identifiers
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off', // optional props without defaults are valid TS
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Vitest globals for test files — avoids false no-undef errors
  {
    files: ['src/**/__tests__/**/*.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },

  prettierConfig,
];
