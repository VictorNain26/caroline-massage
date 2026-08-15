import { existsSync, copyFileSync, mkdirSync } from 'node:fs';

// getViteConfig() resolves astro:content under Vitest's own "serve" command,
// which makes Astro look for the dev-mode data store in .astro/ instead of
// the node_modules/.astro/ store that `astro build` produces. Only `astro
// dev` populates the former. Bridging the two lets `pnpm build && pnpm test`
// exercise the real, build-synced content without starting a dev server.
export default function setup() {
  const source = 'node_modules/.astro/data-store.json';
  const destination = '.astro/data-store.json';
  if (existsSync(source) && !existsSync(destination)) {
    mkdirSync('.astro', { recursive: true });
    copyFileSync(source, destination);
  }
}
