import { defineConfig, fontProviders } from 'astro/config';
import yaml from '@rollup/plugin-yaml';

export default defineConfig({
  site: 'https://carolinemassagesurmesure.fr',
  build: { inlineStylesheets: 'auto' },
  vite: { plugins: [yaml()] },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Petrona',
      cssVariable: '--font-titre',
      weights: [400, 500, 600],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
    },
    {
      provider: fontProviders.google(),
      name: 'Alegreya Sans',
      cssVariable: '--font-texte',
      weights: [300, 400, 500, 700],
      styles: ['normal'],
      subsets: ['latin'],
    },
  ],
});
