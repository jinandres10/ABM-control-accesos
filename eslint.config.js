import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import tsParser from '@typescript-eslint/parser';

export default [

  // ✅ reglas base JS
  js.configs.recommended,

  // ✅ reglas oficiales Svelte
  ...svelte.configs['flat/recommended'],

  // ✅ soporte TypeScript dentro de .svelte
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tsParser
      }
    }
  },

  // ✅ ENTORNO NAVEGADOR (SOLUCION DEFINITIVA)
  {
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        console: 'readonly'
      }
    }
  }
];