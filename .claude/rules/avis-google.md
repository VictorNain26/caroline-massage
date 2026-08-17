---
paths:
  - "src/lib/avis-google.ts"
  - "src/components/sections/Avis.astro"
  - "astro.config.mjs"
  - ".github/workflows/rafraichir-avis.yml"
---

# Avis Google

`src/lib/avis-google.ts` lit les avis au build via Place Details (New), derrière
`GOOGLE_PLACES_API_KEY` et `GOOGLE_PLACE_ID`. **Sans ces deux variables, zéro
avis, et la section ne se rend pas** — c'est l'état par défaut.

Trois contraintes viennent des
[règles Places](https://developers.google.com/maps/documentation/places/web-service/policies)
et ne se négocient pas :

- **Cinq avis au maximum** par appel, l'API n'en renvoie pas davantage.
- **Créditer l'auteur** : avatar, nom et lien de profil. Les avatars passent par
  `image.remotePatterns` et sont donc rapatriés au build, pour ne pas servir
  d'image tierce ni contredire `politique-confidentialite.astro`, qui promet
  qu'aucune ressource tierce n'est chargée.
- **Ne pas conserver** le contenu Places ; seul le `place_id` est stockable.
  Un build statique fige pourtant les avis dans le HTML : c'est une tension
  assumée, bornée par `.github/workflows/rafraichir-avis.yml`, qui redéploie
  chaque semaine. Ne pas désactiver ce workflow sans changer d'approche.

Le champ `reviews` facture au SKU Enterprise + Atmosphere, le plus cher.
