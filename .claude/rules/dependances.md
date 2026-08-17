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

La cause est commune aux deux : TS 7 est le portage natif en Go
([typescript-go](https://github.com/microsoft/typescript-go)), et l'API
JavaScript du compilateur n'est pas portée telle quelle. Microsoft annonce une
API « plus curatée » passant par IPC, parce qu'exposer toute la surface à
travers la frontière Go/JS est impraticable
([typescript-go#455](https://github.com/microsoft/typescript-go/discussions/455)).
Or `astro check` consomme la Language Service API et typescript-eslint le
`Program`/`TypeChecker` plus l'AST JS. Les deux dépendent précisément de ce qui
n'existe pas encore.

Le contournement documenté par Microsoft — faire tourner TS 7 et TS 6 côte à
côte — n'apporte rien ici : le seul consommateur de TS sur ce projet est
l'outillage qui refuse la 7.

Avant de retenter, vérifier que les deux tickets sont clos, puis lancer
`pnpm check` et `pnpm lint` avant de committer. Les `peerDependencies` seules ne
suffisent pas à trancher : c'est un garde-fou explicite dans le code des deux
outils qui bloque.

## `@types/node` suit le runtime, pas le registre

Borné à la majeure de Node utilisée en vrai (24, l'LTS active — Node 26 ne le
devient que le 28 octobre 2026, cf.
[nodejs/Release](https://github.com/nodejs/Release/blob/main/schedule.json)).
Prendre la dernière majeure publiée ferait typechecker le code contre des API
qu'aucun runtime du projet n'expose : un faux filet de sécurité. `pnpm outdated`
signalera donc `@types/node` comme en retard, volontairement.

Le corollaire : quand la CI change de majeure Node (`runtime:` dans les
workflows), `@types/node` bouge avec, et la borne `allowedVersions` de Renovate
aussi.

## Ce que Renovate tient à jour

`.github/renovate.json` couvre npm et les actions GitHub. TypeScript et
`@types/node` y sont bornés par `allowedVersions` plutôt que désactivés : les
patchs continuent d'arriver, la majeure interdite ne revient pas chaque semaine.

Dependabot n'était pas une option : il plafonne à pnpm v10
([écosystèmes supportés](https://docs.github.com/en/code-security/dependabot/ecosystems-supported-by-dependabot/supported-ecosystems-and-repositories)),
le projet est en 11.

## pnpm dans la CI

Les workflows utilisent `pnpm/setup`, pas `pnpm/action-setup` : c'est le
successeur officiel, requis à partir de pnpm 11, et il installe Node dans la
même étape — d'où l'absence d'`actions/setup-node`.

L'action lance `pnpm install` toute seule et compte sur sa détection
d'environnement CI pour geler le lock. Les workflows posent `install: false` et
écrivent l'install à la main : un lock désynchronisé doit faire échouer la CI,
pas être réparé en silence.

`packageManager` fixe la version de pnpm, pour la CI comme en local — pnpm se
met lui-même à cette version. La garder alignée sur celle utilisée pour
régénérer le lock.
