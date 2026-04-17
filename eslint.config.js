import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [

  js.configs.recommended,
  ...svelte.configs['flat/recommended'],

  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tsParser
      }
    }
  },

  // ✅ ENTORNO NAVEGADOR COMPLETO
  {
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  }
];