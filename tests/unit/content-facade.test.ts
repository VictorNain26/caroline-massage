import { describe, it, expect } from 'vitest';
import {
  getCabinet,
  getSoins,
  getFaq,
  getAvis,
  getSection,
} from '../../src/lib/content';

describe('getSoins', () => {
  it('retourne les cinq soins triés par ordre croissant', async () => {
    const soins = await getSoins();
    expect(soins.map((s) => s.ordre)).toEqual([1, 2, 3, 4, 5]);
    expect(soins.map((s) => s.id)).toEqual([
      'decouverte', 'cible', 'pieds', 'thai-huile', 'signature',
    ]);
  });
});

describe('getFaq', () => {
  it('retourne les huit questions triées par ordre croissant', async () => {
    const faq = await getFaq();
    expect(faq.map((q) => q.ordre)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('getSection', () => {
  const attendues = [
    'hero', 'soins', 'tarifs', 'parcours',
    'cabinet', 'avis', 'faq', 'contact',
  ];

  it('résout chacune des huit sections avec un titre non vide', async () => {
    for (const id of attendues) {
      const section = await getSection(id);
      expect(section.titre, `section ${id}`).toBeTruthy();
    }
  });

  it('rejette un identifiant inconnu', async () => {
    await expect(getSection('inexistant')).rejects.toThrow();
  });
});

describe('getAvis', () => {
  it("retourne un tableau vide tant qu'aucun avis authentique n'est fourni", async () => {
    expect(await getAvis()).toEqual([]);
  });
});

describe('getCabinet', () => {
  it('retourne les données du cabinet', async () => {
    const cabinet = await getCabinet();
    expect(cabinet.ville).toBe('Carquefou');
    expect(cabinet.telephone).toBe('+33667989710');
  });
});
