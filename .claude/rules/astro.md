---
paths:
  - "src/**/*.astro"
---

# Composants Astro

- Les styles vivent dans un `<style>` du composant : Astro les scope
  automatiquement. Seul `src/styles/tokens.css` est global.
- Aucune couleur, aucune taille de police en dur : uniquement les variables
  CSS de `tokens.css`.
- Mobile-first : la déclaration de base vise le mobile, les `@media
  (min-width: …)` ajoutent le desktop.
- Toute animation est enveloppée dans
  `@media (prefers-reduced-motion: no-preference)`.
- Les images passent par `<Image>` de `astro:assets`, avec `width`, `height`
  et `alt` explicites.
