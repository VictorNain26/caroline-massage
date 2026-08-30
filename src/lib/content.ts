import { getCollection } from 'astro:content';
import cabinetData from '../content/cabinet.yaml';
import { recupererFicheGoogle, type FicheGoogle } from './avis-google';

export interface Tarif { duree: number; prix: number }
export interface Soin { id: string; nom: string; sousTitre: string; description: string; tarifs: Tarif[]; signature: boolean; ordre: number }
export interface Question { id: string; question: string; reponse: string; ordre: number }
// avatar et profil ne sont renseignés que par l'API Places, qui impose de
// créditer l'auteur ; les avis saisis à la main dans src/content/avis/ n'en
// ont pas.
export interface Avis { auteur: string; note: number; texte: string; date: string; url: string; avatar?: string; profil?: string }
export interface Bloc { titre: string; texte: string }
export interface Entree { libelle: string; texte: string }
export interface Citation { texte: string; auteur: string }
export interface Section { id: string; surtitre?: string; titre: string; paragraphes: string[]; blocs?: Bloc[]; entrees?: Entree[]; citation?: Citation }
export interface Cabinet {
  telephone: string; telephoneAffiche: string; email: string; ville: string;
  joursOuverture: string[]; heureOuverture: string; heureFermeture: string;
  instagram: string;
  prixMin: number; prixMax: number;
  // Renseignés par la cliente ; le pied de page et les mentions légales ne
  // rendent chaque champ que s'il a une valeur (tâche 13). nom, adresse,
  // statutJuridique, siret, rcs et tva sont les mentions obligatoires
  // listées par entreprendre.service-public.gouv.fr/vosdroits/F31228 pour
  // une entreprise individuelle — adresse y désigne l'adresse déclarée de
  // l'éditrice, une mention légale, à ne pas confondre avec le lieu de
  // réception de la clientèle (cabinet.ville, une information commerciale),
  // et statutJuridique porte la désignation « entrepreneur individuel »
  // exigée par cette même source ; assuranceRcPro, elle, est une
  // information complémentaire, non exigée.
  nom?: string; adresse?: string;
  siret?: string; rcs?: string; tva?: string;
  assuranceRcPro?: string; statutJuridique?: string;
  // URL de la fiche Google Business Profile ; tant qu'elle n'est pas fournie,
  // la section avis ne rend pas le lien "Voir tous les avis sur Google".
  googleAvisUrl?: string;
}

export async function getCabinet(): Promise<Cabinet> {
  return cabinetData as Cabinet;
}

export async function getSoins(): Promise<Soin[]> {
  const entrees = await getCollection('soins');
  return entrees
    .map((e) => ({ id: e.id, ...e.data }))
    .sort((a, b) => a.ordre - b.ordre);
}

export async function getFaq(): Promise<Question[]> {
  const entrees = await getCollection('faq');
  return entrees
    .map((e) => ({ id: e.id, ...e.data }))
    .sort((a, b) => a.ordre - b.ordre);
}

/**
 * Google fait autorité dès que la fiche est configurée : les avis y sont
 * authentiques et datés. Les fichiers de src/content/avis/ ne servent que
 * tant qu'elle ne l'est pas — eux ne portent aucune note de fiche, seuls les
 * avis rendus comptent alors.
 *
 * L'appel est retenu pour toute la durée du build : deux pages le demandent —
 * l'accueil pour savoir s'il pose la frise, la section pour se rendre — et
 * chacune déclenchait sa propre requête, facturée au tarif le plus haut de
 * Places. Une promesse suffit à n'en payer qu'une.
 */
let ficheEnCours: Promise<FicheGoogle> | null = null;

export function getFicheAvis(): Promise<FicheGoogle & { avis: Avis[] }> {
  ficheEnCours ??= (async () => {
    const fiche = await recupererFicheGoogle();
    if (fiche.avis.length > 0) return fiche;

    const entrees = await getCollection('avis');
    return { ...fiche, avis: entrees.map((e) => e.data) };
  })();
  return ficheEnCours;
}

export async function getAvis(): Promise<Avis[]> {
  return (await getFicheAvis()).avis;
}

export async function getSection(id: string): Promise<Section> {
  const entrees = await getCollection('sections');
  const entree = entrees.find((e) => e.id === id);
  // Échouer au build plutôt que rendre une section muette : un titre manquant
  // passerait inaperçu en production.
  if (!entree) throw new Error(`Section inconnue : ${id}`);
  return { id: entree.id, ...entree.data };
}
