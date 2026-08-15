import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';

describe('avis', () => {
  const fichiers = readdirSync('src/content/avis').filter((f) => f.endsWith('.yaml'));

  it('ne contient aucun avis tant que de vrais avis ne sont pas fournis', () => {
    expect(fichiers).toHaveLength(0);
  });
});
