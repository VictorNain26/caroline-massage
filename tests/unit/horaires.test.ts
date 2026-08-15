import { describe, it, expect } from 'vitest';
import { formaterHoraires } from '../../src/lib/horaires';
import type { Cabinet } from '../../src/lib/content';

const cabinetBase: Cabinet = {
  telephone: '+33667989710',
  telephoneAffiche: '06 67 98 97 10',
  email: 'contact@carolinemassagesurmesure.fr',
  ville: 'Carquefou',
  joursOuverture: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  heureOuverture: '09:00',
  heureFermeture: '20:00',
  delaiReponse: '48 h',
  instagram: 'https://www.instagram.com/caroline_massagesurmesure',
  prixMin: 45,
  prixMax: 130,
};

describe('formaterHoraires', () => {
  it('contracte une suite continue de jours en « du X au Y »', () => {
    expect(formaterHoraires(cabinetBase)).toBe('du lundi au samedi, 9h – 20h');
  });

  it("ne rend pas une plage continue mensongère quand un jour est retiré du milieu", () => {
    const cabinet: Cabinet = {
      ...cabinetBase,
      joursOuverture: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'],
    };
    const resultat = formaterHoraires(cabinet);
    expect(resultat).not.toContain('du lundi au samedi');
    expect(resultat).not.toMatch(/^du \w+ au \w+,/);
  });
});
