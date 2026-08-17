import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  // Tous des artefacts : `dist`/`.astro` du build, `design` la maquette, et
  // `.wrangler` le bundle workerd que `wrangler dev` écrit sous la racine —
  // il porte du code généré non lintable.
  {
    ignores: ['dist/**', '.astro/**', 'design/**', '.wrangler/**'],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,
];
