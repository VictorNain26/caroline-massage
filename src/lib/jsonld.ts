import type { Cabinet, Soin } from './content';

export function construireJsonLd(cabinet: Cabinet, soins: Soin[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MassageBusiness',
    name: 'Caroline, Massage Sur-Mesure',
    description:
      'Massages sur-mesure : thaï à l’huile, Deep Tissue, massage ciblé, massage des pieds. Soins strictement bien-être, clientèle mixte.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: cabinet.ville,
      addressCountry: 'FR',
    },
    telephone: cabinet.telephone,
    email: cabinet.email,
    priceRange: `${cabinet.prixMin}€–${cabinet.prixMax}€`,
    currenciesAccepted: 'EUR',
    sameAs: [cabinet.instagram],
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: cabinet.joursOuverture,
      opens: cabinet.heureOuverture,
      closes: cabinet.heureFermeture,
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Soins',
      itemListElement: soins.map((soin) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: soin.nom },
        priceSpecification: soin.tarifs.map((tarif) => ({
          '@type': 'UnitPriceSpecification',
          price: tarif.prix,
          priceCurrency: 'EUR',
        })),
      })),
    },
  };
}
