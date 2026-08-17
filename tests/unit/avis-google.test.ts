import { describe, it, expect, vi, afterEach } from 'vitest';
import { recupererAvisGoogle } from '../../src/lib/avis-google';

// Un avis tel que Place Details (New) le renvoie.
const avisApi = {
  rating: 5,
  text: { text: 'Un moment suspendu, je recommande.' },
  publishTime: '2026-06-02T09:12:00Z',
  googleMapsUri: 'https://maps.google.com/?cid=1#avis',
  authorAttribution: {
    displayName: 'Claire D.',
    uri: 'https://www.google.com/maps/contrib/1',
    photoUri: 'https://lh3.googleusercontent.com/a/portrait',
  },
};

function repondre(charge: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Forbidden',
    json: async () => charge,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('recupererAvisGoogle', () => {
  it('ne demande rien à Google tant que les identifiants manquent', async () => {
    const fetchEspion = repondre({});
    vi.stubGlobal('fetch', fetchEspion);

    await expect(recupererAvisGoogle()).resolves.toEqual([]);
    expect(fetchEspion).not.toHaveBeenCalled();
  });

  it("porte la clé et le masque de champs, que l'API exige, dans les en-têtes", async () => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY', 'cle-test');
    vi.stubEnv('GOOGLE_PLACE_ID', 'ChIJtest');
    const fetchEspion = repondre({ reviews: [avisApi] });
    vi.stubGlobal('fetch', fetchEspion);

    await recupererAvisGoogle();

    const [url, options] = fetchEspion.mock.calls[0];
    expect(url).toBe('https://places.googleapis.com/v1/places/ChIJtest');
    expect(options.headers['X-Goog-Api-Key']).toBe('cle-test');
    expect(options.headers['X-Goog-FieldMask']).toBe('reviews');
  });

  it("retient l'avatar et le lien de profil, que les règles Places imposent d'afficher", async () => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY', 'cle-test');
    vi.stubEnv('GOOGLE_PLACE_ID', 'ChIJtest');
    vi.stubGlobal('fetch', repondre({ reviews: [avisApi] }));

    const [avis] = await recupererAvisGoogle();

    expect(avis).toEqual({
      auteur: 'Claire D.',
      note: 5,
      texte: 'Un moment suspendu, je recommande.',
      date: '2026-06-02T09:12:00Z',
      url: 'https://maps.google.com/?cid=1#avis',
      avatar: 'https://lh3.googleusercontent.com/a/portrait',
      profil: 'https://www.google.com/maps/contrib/1',
    });
  });

  it("écarte les notes sans texte rédigé, qui n'auraient rien à montrer", async () => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY', 'cle-test');
    vi.stubEnv('GOOGLE_PLACE_ID', 'ChIJtest');
    const sansTexte = { ...avisApi, text: undefined, originalText: undefined };
    vi.stubGlobal('fetch', repondre({ reviews: [sansTexte, avisApi] }));

    await expect(recupererAvisGoogle()).resolves.toHaveLength(1);
  });

  it('casse le build plutôt que de publier une section muette quand Google refuse', async () => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY', 'mauvaise-cle');
    vi.stubEnv('GOOGLE_PLACE_ID', 'ChIJtest');
    vi.stubGlobal('fetch', repondre({}, false, 403));

    await expect(recupererAvisGoogle()).rejects.toThrow('403');
  });
});
