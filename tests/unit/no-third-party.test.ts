import { test, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Le HTML ne suffit pas : une police tierce se déclare aussi bien par une
// `@import` dans un CSS produit que par un `fetch` dans un script.
const EXTENSIONS_SERVIES = ['.html', '.css', '.js'];

function fichiersServis(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? fichiersServis(join(dir, e.name))
      : EXTENSIONS_SERVIES.some((ext) => e.name.endsWith(ext))
        ? [join(dir, e.name)]
        : [],
  );
}

test('aucune référence à un domaine tiers dans les fichiers produits', () => {
  const interdits = ['fonts.googleapis.com', 'fonts.gstatic.com'];
  expect(existsSync('dist'), 'dist/ est absent — lancer `pnpm build` avant `pnpm test`').toBe(true);
  const fichiers = fichiersServis('dist');
  expect(fichiers.length, 'aucun fichier servi trouvé dans dist/ — le build a-t-il été lancé ?').toBeGreaterThan(0);
  for (const fichier of fichiers) {
    const contenu = readFileSync(fichier, 'utf8');
    for (const domaine of interdits) {
      expect(contenu, `${fichier} référence ${domaine}`).not.toContain(domaine);
    }
  }
});
