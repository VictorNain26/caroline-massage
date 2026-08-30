# Caroline Massage — site vitrine

Site vitrine one-page pour une praticienne en massage bien-être.
Astro en build statique, déployé sur Cloudflare Workers static assets.

## Commandes

- `pnpm dev` — serveur de développement
- `pnpm peers check` — vérifie les bornes déclarées par les paquets. La CI le
  lance en premier ; c'est ce qui tient TypeScript en 6.x, cf.
  `.claude/rules/dependances.md`
- `pnpm check` — typecheck Astro
- `pnpm lint` — ESLint, zéro warning toléré
- `pnpm build` — build de production dans `dist/`
- `pnpm test` — Vitest. **Lancer `pnpm build` d'abord** : deux suites lisent des
  artefacts de build (le HTML produit, le magasin de contenu d'Astro) et
  échouent sans lui. La CI enchaîne `build` puis `test` pour cette raison.
- `pnpm deploy` — déploiement Cloudflare, jamais automatique

## Conventions de code

- Le contenu passe par `src/lib/content.ts` ; les composants n'appellent pas
  `getCollection()` directement.
- Aucune police, aucun script, aucune image servis depuis un domaine tiers.
- Une seule arborescence responsive, mobile-first — pas de prop `isMobile`.
- Toute animation est neutralisée sous `prefers-reduced-motion: reduce`.
- `GOOGLE_PLACES_API_KEY` est une clé de service : elle ne part jamais côté
  client ([api-security-best-practices](https://developers.google.com/maps/api-security-best-practices)).

## Vérification

Il n'y a pas de suite visuelle automatisée : Playwright et
`@axe-core/playwright` ont été retirés. Rendu, responsive, focus et contrastes
se regardent à la main dans Chrome sur `pnpm dev` (skill `verifier-visuel`).
Rien ne l'exécute au push — une régression visuelle ne se voit que si quelqu'un
regarde.

## Contexte chargé à la demande

Quatre sujets vivent dans `.claude/rules/`, chargés en touchant les fichiers
concernés : `astro.md` (styles scopés, tokens CSS), `avis-google.md`
(contraintes des règles Places), `dependances.md` (bornes de versions),
`design.md` (écarts assumés au design de référence).
