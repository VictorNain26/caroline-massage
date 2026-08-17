# Caroline Massage — site vitrine

Site vitrine one-page pour une praticienne en massage bien-être.
Astro en build statique, déployé sur Cloudflare Workers static assets.

Spec : `docs/superpowers/specs/2026-08-15-site-vitrine-caroline-massage-design.md`

## Commandes

- `pnpm dev` — serveur de développement
- `pnpm check` — typecheck Astro
- `pnpm lint` — ESLint, zéro warning toléré
- `pnpm test` — Vitest. **Lancer `pnpm build` d'abord** : deux suites lisent des
  artefacts de build (le HTML produit, et le magasin de contenu d'Astro). Sans
  build préalable elles échouent avec un message explicite plutôt qu'un faux
  vert. La CI enchaîne `build` puis `test` pour cette raison.
- `pnpm build` — build de production dans `dist/`
- `pnpm deploy` — déploiement Cloudflare, jamais automatique

## Vérification visuelle et accessibilité

Il n'y a plus de suite automatisée : Playwright et `@axe-core/playwright` ont été
retirés. Le rendu, le responsive, le focus et les contrastes se vérifient à la
main dans Chrome via Claude in Chrome, sur `pnpm dev`. Rien ne l'exécute à chaque
push — une régression visuelle ne sera vue que si quelqu'un regarde.

## Avis Google

`src/lib/avis-google.ts` lit les avis au build via Place Details (New), derrière
`GOOGLE_PLACES_API_KEY` et `GOOGLE_PLACE_ID`. **Sans ces deux variables, zéro
avis, et la section ne se rend pas** — c'est l'état par défaut. La clé est une
clé de service : elle ne doit jamais partir côté client
([api-security-best-practices](https://developers.google.com/maps/api-security-best-practices)).

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

## Règles du projet

- `design/accueil-page-vert-or.dc.html` est la source de vérité **visuelle**,
  jamais du code à recopier. Sa syntaxe (`{{ }}`, `style-hover=`, `<dc-import>`)
  est propriétaire et n'a pas d'équivalent HTML.
- **Deux divergences assumées, à ne pas « corriger » comme des oublis :** la
  section contact propose deux liens `tel:` et `mailto:` là où le design dessine
  un formulaire — le site est statique et n'a aucun service d'envoi, et le
  design lui-même n'envoie rien (« Aucun envoi reel tant qu'aucun service n'est
  branche ») ; et la navigation prend la variante `barre` hors accueil, le
  design ne prévoyant qu'une page.
- Aucun composant n'appelle `getCollection()`. Tout passe par `src/lib/content.ts`.
- Aucune police, aucun script, aucune image servis depuis un domaine tiers.
- Le prop `isMobile` du design ne doit exister nulle part : une seule
  arborescence responsive, mobile-first.
- Toute animation est neutralisée sous `prefers-reduced-motion: reduce`.
