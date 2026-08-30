import { describe, it, expect, vi, afterEach } from 'vitest';
import { getFicheAvis, getAvis } from '../../src/lib/content';

// Fichier à part : la mémoïsation vit dans le module `content`, et une fois la
// fiche retenue elle l'est pour tout le processus. Un test qui la partagerait
// avec d'autres cas mesurerait l'ordre d'exécution, pas le comportement.

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('getFicheAvis', () => {
  it("n'interroge Places qu'une fois, quel que soit le nombre de pages qui demandent", async () => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY', 'cle-test');
    vi.stubEnv('GOOGLE_PLACE_ID', 'ChIJtest');
    const fetchEspion = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ reviews: [], rating: 4.8, userRatingCount: 42 }),
    });
    vi.stubGlobal('fetch', fetchEspion);

    // L'accueil demande les avis pour décider de sa frise, la section pour se
    // rendre : deux appels, une seule requête, facturée au tarif le plus haut
    // de Places.
    await Promise.all([getFicheAvis(), getAvis(), getFicheAvis()]);

    expect(fetchEspion).toHaveBeenCalledTimes(1);
  });

  it('retient la note de la fiche et son total, et non ceux des avis rendus', async () => {
    const fiche = await getFicheAvis();

    expect(fiche.note).toBe(4.8);
    expect(fiche.total).toBe(42);
  });
});
