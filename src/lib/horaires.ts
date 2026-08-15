import type { Cabinet } from './content';

const NOMS_JOURS_FR: Record<string, string> = {
  Monday: 'lundi',
  Tuesday: 'mardi',
  Wednesday: 'mercredi',
  Thursday: 'jeudi',
  Friday: 'vendredi',
  Saturday: 'samedi',
  Sunday: 'dimanche',
};

const ORDRE_SEMAINE = Object.keys(NOMS_JOURS_FR);

function formaterHeure(heure: string): string {
  const [h, m] = heure.split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

function indicesTries(jours: string[]): number[] {
  return jours.map((jour) => ORDRE_SEMAINE.indexOf(jour)).sort((a, b) => a - b);
}

function estContinu(indices: number[]): boolean {
  return indices.every((indice, position) => position === 0 || indice === indices[position - 1] + 1);
}

export function formaterHoraires(cabinet: Cabinet): string {
  const { joursOuverture, heureOuverture, heureFermeture } = cabinet;
  const plage = `${formaterHeure(heureOuverture)} – ${formaterHeure(heureFermeture)}`;
  const indices = indicesTries(joursOuverture);
  const jours = indices.map((indice) => NOMS_JOURS_FR[ORDRE_SEMAINE[indice]]);

  if (estContinu(indices)) {
    return `du ${jours[0]} au ${jours[jours.length - 1]}, ${plage}`;
  }

  const liste =
    jours.length > 1 ? `${jours.slice(0, -1).join(', ')} et ${jours[jours.length - 1]}` : jours[0];
  return `${liste}, ${plage}`;
}
