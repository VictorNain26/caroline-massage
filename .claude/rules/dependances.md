---
paths:
  - "package.json"
  - "pnpm-lock.yaml"
---

# Dépendances

## TypeScript reste en 6.x tant que `pnpm peers check` le dit

`astro check` et `pnpm lint` refusent TS 7, et ils le déclarent eux-mêmes en
`peerDependencies`. La CI lance `pnpm peers check`, qui lit ces bornes et sort
en erreur quand elles sont violées — plutôt qu'une version interdite recopiée à
la main quelque part, qui bloquerait encore le jour où la contrainte tombe.

Donc rien à surveiller : le jour où les deux outils élargissent leur borne, la
PR de mise à jour passe au vert d'elle-même. Suivi amont, si le contexte est
utile : [withastro/roadmap#1321](https://github.com/withastro/roadmap/discussions/1321),
[typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940).

## `@types/node` suit le runtime

Aligné sur la majeure de Node utilisée en CI (`runtime:` dans les workflows),
pas sur la dernière publiée : typechecker contre des API qu'aucun runtime du
projet n'expose est un faux filet de sécurité. Aucune peer dependency ne
l'impose, donc c'est la seule contrainte du projet que personne ne vérifie —
la majeure passe par approbation sur le dashboard Renovate, et se prend en même
temps que le `runtime:` des workflows.

## Le reste

Renovate tient npm et les actions à jour. Dependabot n'était pas une option : il
plafonne à pnpm v10, le projet est en 11.

`packageManager` fixe la version de pnpm, pour la CI comme en local — la garder
alignée sur celle utilisée pour régénérer le lock.
