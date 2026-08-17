---
paths:
  - "package.json"
  - "pnpm-lock.yaml"
---

# Dépendances

## TypeScript reste en 6.x

TypeScript 7 est publié et `pnpm outdated` le proposera. **Ne pas le prendre** :
`astro check` et `pnpm lint` le refusent tous les deux, essayé et vérifié.

Avant de retenter, vérifier que les deux tickets sont clos, puis lancer
`pnpm check` et `pnpm lint` avant de committer. Les `peerDependencies` seules ne
suffisent pas à trancher : c'est un garde-fou explicite dans le code des deux
outils qui bloque.

- [withastro/roadmap#1321](https://github.com/withastro/roadmap/discussions/1321)
- [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)

## `@types/node` suit le runtime

Borné à la majeure de Node utilisée en CI (`runtime:` dans les workflows), pas à
la dernière publiée : typechecker contre des API qu'aucun runtime du projet
n'expose est un faux filet de sécurité. `pnpm outdated` le signalera donc en
retard, volontairement. Les deux versions bougent ensemble, avec la borne posée
dans `.github/renovate.json`.

## Le reste

Renovate tient npm et les actions à jour. Dependabot n'était pas une option : il
plafonne à pnpm v10, le projet est en 11.

`packageManager` fixe la version de pnpm, pour la CI comme en local — la garder
alignée sur celle utilisée pour régénérer le lock.
