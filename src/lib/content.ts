import { getCollection } from 'astro:content';
import cabinetData from '../content/cabinet.yaml';

export interface Tarif { duree: number; prix: number }
export interface Soin { id: string; nom: string; sousTitre: string; description: string; tarifs: Tarif[]; signature: boolean; ordre: number }
export interface Question { id: string; question: string; reponse: string; ordre: number }
export interface Avis { auteur: string; note: number; texte: string; date: string; url: string }
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
  // rendent chaque champ que s'il a une valeur (tâche 13). siret, rcs et tva
  // sont les mentions obligatoires listées par
  // entreprendre.service-public.gouv.fr/vosdroits/F31228 pour une
  // entreprise individuelle ; assuranceRcPro et statutJuridique sont des
  // informations complémentaires, non exigées par cette même source.
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

export async function getAvis(): Promise<Avis[]> {
  const entrees = await getCollection('avis');
  return entrees.map((e) => e.data);
}

export async function getSection(id: string): Promise<Section> {
  const entrees = await getCollection('sections');
  const entree = entrees.find((e) => e.id === id);
  // Échouer au build plutôt que rendre une section muette : un titre manquant
  // passerait inaperçu en production.
  if (!entree) throw new Error(`Section inconnue : ${id}`);
  return { id: entree.id, ...entree.data };
}
