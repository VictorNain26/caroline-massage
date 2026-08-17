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

## Règles du projet

- `design/accueil-page-vert-or.dc.html` est la source de vérité **visuelle**,
  jamais du code à recopier. Sa syntaxe (`{{ }}`, `style-hover=`, `<dc-import>`)
  est propriétaire et n'a pas d'équivalent HTML.
- Aucun composant n'appelle `getCollection()`. Tout passe par `src/lib/content.ts`.
- Aucune police, aucun script, aucune image servis depuis un domaine tiers.
- Le prop `isMobile` du design ne doit exister nulle part : une seule
  arborescence responsive, mobile-first.
- Toute animation est neutralisée sous `prefers-reduced-motion: reduce`.
