import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';

const lire = (chemin: string) => parse(readFileSync(chemin, 'utf8'));

describe('cabinet', () => {
  const cabinet = lire('src/content/cabinet.yaml');

  it('expose un téléphone au format E.164', () => {
    expect(cabinet.telephone).toMatch(/^\+33\d{9}$/);
  });

  it('borne les prix dans un intervalle cohérent', () => {
    expect(cabinet.prixMin).toBeLessThan(cabinet.prixMax);
  });
});

describe('soins', () => {
  const soins = readdirSync('src/content/soins').map((f) =>
    lire(`src/content/soins/${f}`),
  );

  it('en compte cinq', () => {
    expect(soins).toHaveLength(5);
  });

  it("n'en désigne qu'un seul comme signature", () => {
    expect(soins.filter((s) => s.signature)).toHaveLength(1);
  });

  it('donne des ordres uniques', () => {
    const ordres = soins.map((s) => s.ordre);
    expect(new Set(ordres).size).toBe(ordres.length);
  });

  it('respecte la fourchette de prix annoncée par le cabinet', () => {
    const cabinet = lire('src/content/cabinet.yaml');
    const prix = soins.flatMap((s) => s.tarifs.map((t: { prix: number }) => t.prix));
    expect(Math.min(...prix)).toBe(cabinet.prixMin);
    expect(Math.max(...prix)).toBe(cabinet.prixMax);
  });
});

describe('faq', () => {
  const questions = readdirSync('src/content/faq').map((f) =>
    lire(`src/content/faq/${f}`),
  );

  it('en compte sept', () => {
    expect(questions).toHaveLength(7);
  });

  it('donne des ordres uniques', () => {
    const ordres = questions.map((q) => q.ordre);
    expect(new Set(ordres).size).toBe(ordres.length);
  });
});

describe('sections', () => {
  const attendues = [
    'hero', 'soins', 'tarifs', 'parcours',
    'cabinet', 'avis', 'faq', 'contact',
  ];

  it('couvre les huit sections ancrées de la page', () => {
    const presentes = readdirSync('src/content/sections')
      .filter((f) => f.endsWith('.yaml'))
      .map((f) => f.replace('.yaml', ''))
      .sort();
    expect(presentes).toEqual([...attendues].sort());
  });

  it('donne un titre non vide à chacune', () => {
    for (const id of attendues) {
      const section = lire(`src/content/sections/${id}.yaml`);
      expect(section.titre, `section ${id}`).toBeTruthy();
    }
  });
});
