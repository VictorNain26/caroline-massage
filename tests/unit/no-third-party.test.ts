import { test, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function fichiersHtml(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? fichiersHtml(join(dir, e.name))
      : e.name.endsWith('.html')
        ? [join(dir, e.name)]
        : [],
  );
}

test('aucune référence à un domaine tiers dans le HTML produit', () => {
  const interdits = ['fonts.googleapis.com', 'fonts.gstatic.com'];
  expect(existsSync('dist'), 'dist/ est absent — lancer `pnpm build` avant `pnpm test`').toBe(true);
  const fichiers = fichiersHtml('dist');
  expect(fichiers.length, 'aucun fichier HTML trouvé dans dist/ — le build a-t-il été lancé ?').toBeGreaterThan(0);
  for (const fichier of fichiers) {
    const contenu = readFileSync(fichier, 'utf8');
    for (const domaine of interdits) {
      expect(contenu, `${fichier} référence ${domaine}`).not.toContain(domaine);
    }
  }
});
