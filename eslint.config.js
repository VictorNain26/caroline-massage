import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  // Tous des artefacts : `dist`/`.astro` du build, `design` la maquette,
  // `.wrangler` le bundle workerd que `wrangler dev` écrit sous la racine —
  // il porte du code généré non lintable — et `test-results`/`playwright-report`
  // les traces de Playwright.
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'design/**',
      '.wrangler/**',
      'test-results/**',
      'playwright-report/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,
];
