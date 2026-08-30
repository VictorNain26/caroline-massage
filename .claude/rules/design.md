---
paths:
  - "src/components/**/*.astro"
  - "src/layouts/*.astro"
  - "src/pages/*.astro"
---

# Écarts au design de référence

`design/accueil-page-vert-or.dc.html` est la référence visuelle. Sa syntaxe
(`{{ }}`, `style-hover=`, `<dc-import>`) est propriétaire et n'a pas
d'équivalent HTML : elle se lit, elle ne se recopie pas.

Trois endroits où le site s'écarte du design, avec la raison — de quoi éviter de
les « corriger » comme des oublis. Ce sont des arbitrages passés, pas des
interdits : si le contexte change, ils se rouvrent.

- **Titre de Parcours en `<h2>`.** Le design en fait un `<h3>` en Alegreya 23px
  dans la colonne de droite et ne place aucun `<h2>` dans la section ; le suivre
  coûterait un niveau de titre aux lecteurs d'écran et au référencement.
- **Contact en liens `tel:` et `mailto:`.** Le design dessine un formulaire mais
  n'envoie rien lui-même (« Aucun envoi reel tant qu'aucun service n'est
  branche »), et le site est statique.
- **Navigation en variante `barre` hors accueil.** Le design ne prévoit qu'une
  page.
