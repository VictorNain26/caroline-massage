---
paths:
  - "src/**/*.astro"
---

# Composants Astro

- Les styles vivent dans un `<style>` du composant : Astro les scope
  automatiquement. Seuls sont globaux `src/styles/tokens.css` et le bloc
  `is:global` de `src/layouts/Base.astro` — celui-ci porte les styles de base de
  `body`, des titres et des liens, qui doivent atteindre le markup injecté par
  `<slot />` là où le scoping automatique d'Astro ne va pas. Aucun autre
  composant n'ouvre de bloc global.
- Aucune couleur, aucune taille de police en dur : uniquement les variables
  CSS de `tokens.css`.
- Mobile-first : la déclaration de base vise le mobile, les `@media
  (min-width: …)` ajoutent le desktop.
- Toute animation est enveloppée dans
  `@media (prefers-reduced-motion: no-preference)`.
- Les images passent par `<Image>` de `astro:assets`, avec `width`, `height`
  et `alt` explicites.
- Le design utilise `cqw` pour ses tailles fluides : on garde `cqw`, jamais
  `vw`, même sans ancêtre à `container-type`. MDN (référence des unités CSS,
  section Container query length units) : « If no eligible container is
  available for the query, the container query length unit defaults to the
  small viewport unit for that axis (sv*) » — `cqw` retombe sur `svw`, qui vaut
  `vw` en largeur (le chrome du navigateur ne change que la hauteur), donc
  aucune régression aujourd'hui, et le bon comportement dès qu'un conteneur
  apparaît.
