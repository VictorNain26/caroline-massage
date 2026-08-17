import type { Avis } from './content';

// Place Details (New). L'en-tête de masque est obligatoire — sans lui l'API
// répond une erreur — et n'admet aucune espace dans la liste.
// https://developers.google.com/maps/documentation/places/web-service/place-details
const ENDPOINT = 'https://places.googleapis.com/v1/places';
const MASQUE = 'reviews';

interface AttributionGoogle {
  displayName?: string;
  uri?: string;
  photoUri?: string;
}

interface AvisApi {
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  publishTime?: string;
  googleMapsUri?: string;
  authorAttribution?: AttributionGoogle;
}

function convertir(avis: AvisApi): Avis | null {
  const auteur = avis.authorAttribution?.displayName;
  // `text` est la version localisée, absente quand l'auteur n'a rien rédigé ;
  // un avis sans texte n'a rien à montrer dans cette section.
  const texte = avis.text?.text ?? avis.originalText?.text;
  if (!auteur || !texte || !avis.rating || !avis.publishTime || !avis.googleMapsUri) return null;

  return {
    auteur,
    note: avis.rating,
    texte,
    date: avis.publishTime,
    // Les règles Places imposent que chaque avis reste consultable sur Google
    // Maps, et que l'auteur soit crédité avec son avatar, son nom et le lien
    // vers son profil.
    // https://developers.google.com/maps/documentation/places/web-service/policies
    url: avis.googleMapsUri,
    avatar: avis.authorAttribution?.photoUri,
    profil: avis.authorAttribution?.uri,
  };
}

/**
 * Sans clé ni identifiant de fiche, renvoie une liste vide : la section avis
 * ne se rend pas et le site se construit normalement. C'est l'état tant que
 * les identifiants ne sont pas fournis.
 *
 * En revanche, si les deux sont présents, un appel qui échoue casse le build
 * plutôt que de publier une page silencieusement amputée de ses avis.
 */
export async function recupererAvisGoogle(): Promise<Avis[]> {
  const cle = import.meta.env.GOOGLE_PLACES_API_KEY;
  const fiche = import.meta.env.GOOGLE_PLACE_ID;
  if (!cle || !fiche) return [];

  const reponse = await fetch(`${ENDPOINT}/${fiche}`, {
    headers: {
      'X-Goog-Api-Key': cle,
      'X-Goog-FieldMask': MASQUE,
    },
  });

  if (!reponse.ok) {
    throw new Error(
      `Places API : ${reponse.status} ${reponse.statusText}. ` +
        `Vérifier GOOGLE_PLACES_API_KEY, ses restrictions et GOOGLE_PLACE_ID.`,
    );
  }

  const donnees: { reviews?: AvisApi[] } = await reponse.json();
  // L'API en renvoie cinq au maximum.
  return (donnees.reviews ?? []).map(convertir).filter((avis) => avis !== null);
}
