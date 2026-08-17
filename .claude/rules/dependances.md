---
paths:
  - "package.json"
  - "pnpm-lock.yaml"
---

# Dépendances

## TypeScript reste en 6.x

TypeScript 7 est publié et `pnpm outdated` le proposera. **Ne pas le prendre** :
il casse les deux commandes de validation du projet, essayé et vérifié.

- `astro check` : « TypeScript's native compiler (7.0 and later) does not ship
  this API yet. Until it does, run `astro check` with a TypeScript version that
  still provides it (6.x) ». Suivi dans
  [withastro/roadmap#1321](https://github.com/withastro/roadmap/discussions/1321).
- `pnpm lint` : « typescript-eslint does not support TS 7.0 ». Le support vise
  TS ≥ 7.1, suivi dans
  [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940).

Le contournement documenté par Microsoft — faire tourner TS 7 et TS 6 côte à
côte — n'apporte rien ici : le seul consommateur de TS sur ce projet est
l'outillage qui refuse la 7.

Avant de retenter, vérifier que les deux tickets sont clos, puis lancer
`pnpm check` et `pnpm lint` avant de committer. Les `peerDependencies` seules ne
suffisent pas à trancher : c'est un garde-fou explicite dans le code des deux
outils qui bloque.

## Le reste

Tout le reste est à jour. `packageManager` fixe la version de pnpm, pour la CI
comme en local — la garder alignée sur celle utilisée pour régénérer le lock.
