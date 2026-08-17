import { defineConfig, fontProviders } from 'astro/config';
import yaml from '@rollup/plugin-yaml';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://carolinemassagesurmesure.fr',
  build: { inlineStylesheets: 'auto' },
  vite: { plugins: [yaml()] },

  // Les avatars des avis Google. Les autoriser ici les fait télécharger et
  // optimiser au build : le visiteur les reçoit depuis ce domaine, jamais
  // depuis Google. C'est ce qui permet de tenir l'attribution exigée par les
  // règles Places sans contredire la politique de confidentialité du site,
  // qui promet qu'aucune ressource tierce n'est chargée.
  image: {
    remotePatterns: [{ protocol: 'https', hostname: '**.googleusercontent.com' }],
  },

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

  integrations: [sitemap()],
});
