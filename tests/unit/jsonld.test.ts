import { describe, it, expect } from 'vitest';
import { construireJsonLd } from '../../src/lib/jsonld';

const cabinet = {
  telephone: '+33667989710',
  telephoneAffiche: '06 67 98 97 10',
  email: 'contact@carolinemassagesurmesure.fr',
  ville: 'Carquefou',
  joursOuverture: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  heureOuverture: '09:00',
  heureFermeture: '20:00',
  instagram: 'https://www.instagram.com/caroline_massagesurmesure',
  prixMin: 45,
  prixMax: 130,
};

const soins = [
  { id: 'a', nom: 'Massage découverte', sousTitre: '', description: '', tarifs: [{ duree: 30, prix: 45 }], signature: false, ordre: 1 },
  { id: 'b', nom: 'Massage signature', sousTitre: '', description: '', tarifs: [{ duree: 90, prix: 130 }], signature: true, ordre: 2 },
];

describe('construireJsonLd', () => {
  const ld = construireJsonLd(cabinet, soins) as Record<string, unknown>;

  it('déclare un MassageBusiness', () => {
    expect(ld['@type']).toBe('MassageBusiness');
  });

  it('reprend le téléphone du cabinet sans le réécrire', () => {
    expect(ld.telephone).toBe(cabinet.telephone);
  });

  it('reprend la ville du cabinet sans la recopier', () => {
    const address = ld.address as Record<string, unknown>;
    expect(address.addressLocality).toBe(cabinet.ville);
  });

  it('dérive la fourchette de prix des données du cabinet', () => {
    expect(ld.priceRange).toBe('45€–130€');
  });

  it('dérive les horaires structurés des données du cabinet', () => {
    const openingHoursSpecification = ld.openingHoursSpecification as Record<string, unknown>;
    expect(openingHoursSpecification.dayOfWeek).toEqual(cabinet.joursOuverture);
    expect(openingHoursSpecification.opens).toBe(cabinet.heureOuverture);
    expect(openingHoursSpecification.closes).toBe(cabinet.heureFermeture);
  });

  it('liste les soins au catalogue', () => {
    const noms = JSON.stringify(ld);
    expect(noms).toContain('Massage découverte');
    expect(noms).toContain('Massage signature');
  });
});
