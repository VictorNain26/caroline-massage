# Site vitrine Caroline Massage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer le site vitrine one-page de Caroline, Massage Sur-Mesure, porté depuis le design Vert Or, déployé en statique sur Cloudflare Workers.

**Architecture:** Astro en build statique, sans runtime serveur. Le contenu vit dans des collections typées derrière une façade `lib/content.ts`, seule surface connue des composants, afin qu'un CMS puisse être branché plus tard sans les toucher. Les styles sont du CSS natif scopé par composant, au-dessus d'un jeu de tokens global. Deux scripts seulement : l'animation d'ouverture et la barre CTA collante.

**Tech Stack:** Astro (build statique), TypeScript strict, CSS natif, API `fonts` d'Astro, Vitest, Playwright + axe-core, Wrangler, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-15-site-vitrine-caroline-massage-design.md`

## Global Constraints

Ces contraintes s'appliquent à **toutes** les tâches, sans être répétées.

- **Doc-first, sans exception.** Aucune clé de configuration, aucune signature d'API, aucun comportement d'outil ne s'écrit de mémoire ni par analogie avec un autre projet. En cas de doute : consulter la doc officielle de la version installée, annoncer la source, et citer URL + champ dans le rapport comme dans le message de commit. « Je crois que ça marche comme ça » est interdit — soit c'est vérifié, soit c'est dit explicitement comme non vérifié. Ce projet ne réutilise aucune convention venue d'ailleurs : ses seules autorités sont sa spec, son design et ce plan.
- **Aucune requête réseau tierce à l'exécution.** Ni `fonts.googleapis.com`, ni `fonts.gstatic.com`, ni CDN. Vérifié par un test automatisé en tâche 2.
- **Le fichier `design/accueil-page-vert-or.dc.html` est la source de vérité visuelle, jamais du code à recopier.** Il utilise une syntaxe de gabarit propriétaire (`{{ … }}`, `style-hover=`, `<dc-import>`) qui n'a aucun équivalent en HTML.
- **Une seule arborescence responsive, mobile-first.** Le prop `isMobile` du design est un artefact de l'outil de maquettage ; il ne doit apparaître nulle part dans le code.
- **Aucun composant n'appelle `getCollection()`.** Tout passe par `src/lib/content.ts`.
- **Toute animation est neutralisée sous `prefers-reduced-motion: reduce`.**
- **Chaque composant de section porte `data-surface="dark"` ou `data-surface="light"`** selon la clarté de son fond. La sonde de la tâche 12 est déclarative : un attribut oublié ne produit pas d'erreur, il produit une barre CTA de la mauvaise couleur.
- **Zéro warning ESLint.** Un `eslint-disable` n'est jamais un correctif : trouver la forme de code qui ne déclenche pas la règle.
- **Le formulaire de la section contact n'est pas porté** (spec, section 1).
- Palette, relevée par fréquence dans le design : or bronze `#96742C`, or `#D4A94C`, crème `#FBF7F0`, encre `#221D17`, sable `#CBB79A`, texte secondaire `#55483C`, surface crème `#EFE6D8`, or clair `#E4C070`, vert profond `#0B3A31`, vert clair `#165046`, corail `#F0907C`, lien `#7A5A24`.
- Polices : **Petrona** pour les titres, **Alegreya Sans** pour le texte courant.
- Repères de lignes dans `design/accueil-page-vert-or.dc.html` : CSS global 46-74, nav 76-128, hero 129-181, soins 182-361, tarifs 362-371, parcours 372-434, cabinet 435-479, avis 480-547, faq 548-594, contact 595-713, logique 715-1080.

---

### Task 1: Squelette qui build, vérifié et intégré

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `wrangler.jsonc`, `eslint.config.js`, `vitest.config.ts`
- Create: `.github/workflows/ci.yml`
- Create: `CLAUDE.md`, `.claude/settings.json`, `.claude/rules/astro.md`
- Create: `.claude/hooks/verifier-contraintes.sh`, `.claude/skills/sync-design/SKILL.md`
- Create: `src/pages/index.astro`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: rien.
- Produits: les scripts `pnpm dev|build|check|lint|test`, et un `dist/` généré à la racine.

- [ ] **Step 1: Écrire `package.json`**

```json
{
  "name": "caroline-massage",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "lint": "eslint . --max-warnings 0",
    "test": "vitest run",
    "test:a11y": "playwright test",
    "deploy": "wrangler deploy"
  }
}
```

- [ ] **Step 2: Installer les dépendances**

```bash
pnpm add astro
pnpm add -D typescript @astrojs/check eslint @eslint/js eslint-plugin-astro \
  typescript-eslint vitest wrangler @playwright/test @axe-core/playwright
```

`@eslint/js` est nécessaire : `eslint.config.js` en importe la configuration
recommandée à l'étape 6.

- [ ] **Step 3: Écrire `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "design"]
}
```

- [ ] **Step 4: Écrire `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://carolinemassagesurmesure.fr',
  build: { inlineStylesheets: 'auto' },
});
```

- [ ] **Step 5: Écrire `wrangler.jsonc`**

`not_found_handling` vaut `"404-page"` et non `"single-page-application"` : le site est multi-pages, une URL inconnue doit répondre 404. Ni `main` ni `binding` — `binding` n'est valide qu'avec un script Worker.

```jsonc
{
  "name": "caroline-massage",
  "compatibility_date": "2026-08-15",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  }
}
```

- [ ] **Step 6: Écrire `eslint.config.js`**

```js
import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  { ignores: ['dist/**', '.astro/**', 'design/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,
];
```

- [ ] **Step 7: Écrire `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
```

- [ ] **Step 8: Compléter `.gitignore`**

Ajouter les lignes suivantes au fichier existant :

```
.astro/
.wrangler/
test-results/
playwright-report/
```

- [ ] **Step 9: Écrire une page d'accueil minimale**

Fichier `src/pages/index.astro` — remplacé intégralement en tâche 2 :

```astro
---
---
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Caroline, Massage Sur-Mesure</title>
  </head>
  <body>
    <h1>Caroline, Massage Sur-Mesure</h1>
  </body>
</html>
```

- [ ] **Step 10: Vérifier que tout passe**

```bash
pnpm check && pnpm lint && pnpm build
```

Attendu : trois commandes en code de sortie 0, et un `dist/index.html` généré.

- [ ] **Step 11: Écrire `CLAUDE.md`**

Ne contient que les deltas par rapport à `~/.claude/CLAUDE.md`, qui porte déjà le ton, le doc-first, les conventions de code, les commits et le workflow de livraison.

```markdown
# Caroline Massage — site vitrine

Site vitrine one-page pour une praticienne en massage bien-être.
Astro en build statique, déployé sur Cloudflare Workers static assets.

Spec : `docs/superpowers/specs/2026-08-15-site-vitrine-caroline-massage-design.md`

## Commandes

- `pnpm dev` — serveur de développement
- `pnpm check` — typecheck Astro
- `pnpm lint` — ESLint, zéro warning toléré
- `pnpm test` — Vitest
- `pnpm test:a11y` — Playwright + axe sur le build
- `pnpm build` — build de production dans `dist/`
- `pnpm deploy` — déploiement Cloudflare, jamais automatique

## Règles du projet

- `design/accueil-page-vert-or.dc.html` est la source de vérité **visuelle**,
  jamais du code à recopier. Sa syntaxe (`{{ }}`, `style-hover=`, `<dc-import>`)
  est propriétaire et n'a pas d'équivalent HTML.
- Aucun composant n'appelle `getCollection()`. Tout passe par `src/lib/content.ts`.
- Aucune police, aucun script, aucune image servis depuis un domaine tiers.
- Le prop `isMobile` du design ne doit exister nulle part : une seule
  arborescence responsive, mobile-first.
- Toute animation est neutralisée sous `prefers-reduced-motion: reduce`.
```

- [ ] **Step 12: Écrire `.claude/settings.json`**

Les règles de permission fusionnent entre scopes plutôt que de s'écraser : ce fichier ne porte que les deltas du projet.

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm dev)",
      "Bash(pnpm build)",
      "Bash(pnpm check)",
      "Bash(pnpm lint)",
      "Bash(pnpm test)",
      "Bash(pnpm test:a11y)"
    ],
    "ask": [
      "Bash(pnpm deploy)",
      "Bash(wrangler deploy*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/verifier-contraintes.sh"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 13: Écrire `.claude/rules/astro.md`**

```markdown
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
```

- [ ] **Step 14: Écrire le hook de vérification des contraintes**

Le `CLAUDE.md` ne peut que suggérer : « *CLAUDE.md instructions shape Claude's
behavior but are not a hard enforcement layer* »
([memory](https://code.claude.com/docs/en/memory#claude-md-vs-auto-memory)).
Deux règles de ce projet sont mécaniquement vérifiables — aucune ressource
tierce, et le prop `isMobile` proscrit. Ce hook donne le retour immédiat pendant
l'édition ; l'application réelle reste la CI, qui bloque la fusion.

Fichier `.claude/hooks/verifier-contraintes.sh`, rendu exécutable :

```bash
#!/usr/bin/env bash
# Retour immédiat sur les deux contraintes dures du projet.
# Non bloquant : signale sans interrompre. L'application dure est en CI.
set -uo pipefail

fichier=$(jq -r '.tool_input.file_path // empty')
[[ -z "$fichier" || ! -f "$fichier" ]] && exit 0
[[ "$fichier" != *"/src/"* ]] && exit 0

if grep -qE 'fonts\.(googleapis|gstatic)\.com|https?://cdn\.' "$fichier"; then
  echo "Ressource tierce détectée dans $fichier — le projet ne sert que depuis son domaine." >&2
fi

if grep -q 'isMobile' "$fichier"; then
  echo "isMobile détecté dans $fichier — artefact de maquette, une seule arborescence responsive." >&2
fi

exit 0
```

```bash
chmod +x .claude/hooks/verifier-contraintes.sh
```

- [ ] **Step 15: Écrire la skill de re-synchronisation du design**

Le critère de la doc : « *Create a skill when you keep pasting the same
instructions, checklist, or multi-step procedure into chat […] a skill's body
loads only when it's used* » ([skills](https://code.claude.com/docs/en/skills)).
Re-synchroniser depuis Claude Design est une procédure en cinq étapes qui se
rejouera à chaque évolution de la maquette.

Fichier `.claude/skills/sync-design/SKILL.md` :

```markdown
---
name: sync-design
description: Re-synchroniser le design depuis le projet Claude Design et identifier ce qui a changé. À utiliser quand la maquette Vert Or a évolué.
disable-model-invocation: true
---

# Re-synchroniser le design

Le projet Claude Design est `6069b7a5-682e-42da-8370-d3b6bdc9babf`.
Le code est la source de vérité ; le design sert à **détecter** un changement,
jamais à régénérer la page.

## Procédure

1. `DesignSync` méthode `list_files` sur le projet, pour repérer les fichiers
   ajoutés ou renommés.
2. `DesignSync` méthode `get_file` sur `Accueil Page Vert Or.dc.html`.
   **Vérifier `truncated` dans la réponse.** Le plafond de lecture est de
   256 KiB : si le fichier repasse au-dessus, c'est que des images y ont été
   réinlinées en base64, et il faut les redéinliner côté design avant tout.
3. Écrire le contenu dans `design/accueil-page-vert-or.dc.html`, en écrasant.
4. `git diff design/` — c'est le cœur de la procédure. Le diff textuel montre
   exactement ce qui a bougé.
5. Reporter les changements dans les composants concernés. Un changement de
   couleur ou de typo se répercute dans `src/styles/tokens.css` seul ; une
   modification de structure touche le composant de section correspondant.

## Ce qu'il ne faut pas faire

- Ne pas recopier la syntaxe du design : `{{ … }}`, `style-hover=`,
  `<dc-import>` et le prop `isMobile` n'ont pas d'équivalent HTML.
- Ne pas régénérer une section entière quand seuls quelques mots ont changé.
```

- [ ] **Step 16: Écrire `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
      - run: pnpm lint
      - run: pnpm build
      - run: pnpm test
```

`build` précède `test` : le test « aucun domaine tiers » de la tâche 2 lit le
HTML produit dans `dist/`. Dans l'ordre inverse il passerait au vert en local
après un build manuel et échouerait sur un runner propre.

- [ ] **Step 17: Vérifier que le hook se déclenche**

Éditer temporairement `src/pages/index.astro` en y ajoutant une ligne contenant
`fonts.googleapis.com`, puis constater que le hook le signale. Retirer la ligne.

- [ ] **Step 18: Commit**

```bash
git add package.json pnpm-lock.yaml astro.config.mjs tsconfig.json wrangler.jsonc \
  eslint.config.js vitest.config.ts .gitignore src/pages/index.astro \
  CLAUDE.md .claude .github
git commit -m "chore: scaffold Astro project with checks, CI and Claude Code setup"
```

---

### Task 2: Polices auto-hébergées, tokens et layout de base

**Files:**
- Modify: `astro.config.mjs`
- Create: `src/styles/tokens.css`, `src/layouts/Base.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/unit/no-third-party.test.ts`

**Interfaces:**
- Consumes: le squelette de la tâche 1.
- Produit: `Base.astro`, qui accepte `title: string`, `description: string`, et un slot par défaut. Les variables CSS `--font-titre` et `--font-texte`, plus les tokens de couleur, sont disponibles partout.

- [ ] **Step 1: Déclarer les polices dans `astro.config.mjs`**

Astro télécharge et met en cache les polices au build : elles sont servies depuis `_astro/fonts`, donc aucune requête ne part vers Google à l'exécution. Les graisses reprennent celles que le design charge (Petrona 400/500/600 plus italiques 400/500, Alegreya Sans 300/400/500/700).

```js
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  site: 'https://carolinemassagesurmesure.fr',
  build: { inlineStylesheets: 'auto' },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Petrona',
      cssVariable: '--font-titre',
      weights: [400, 500, 600],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
    },
    {
      provider: fontProviders.google(),
      name: 'Alegreya Sans',
      cssVariable: '--font-texte',
      weights: [300, 400, 500, 700],
      styles: ['normal'],
      subsets: ['latin'],
    },
  ],
});
```

- [ ] **Step 2: Écrire `src/styles/tokens.css`**

```css
:root {
  --vert-profond: #0b3a31;
  --vert-clair: #165046;
  --or: #d4a94c;
  --or-clair: #e4c070;
  --or-bronze: #96742c;
  --or-lien: #7a5a24;
  --creme: #fbf7f0;
  --creme-surface: #efe6d8;
  --sable: #cbb79a;
  --encre: #221d17;
  --encre-douce: #55483c;
  --corail: #f0907c;

  --pas: 8px;
  --rayon: 14px;
  --largeur-contenu: 1180px;
}
```

- [ ] **Step 3: Écrire `src/layouts/Base.astro`**

```astro
---
import { Font } from 'astro:assets';
import '../styles/tokens.css';

interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
---
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <Font cssVariable="--font-titre" preload />
    <Font cssVariable="--font-texte" preload />
    <slot name="head" />
  </head>
  <body>
    <slot />
  </body>
</html>

<style is:global>
  body {
    margin: 0;
    background: var(--creme);
    color: var(--encre);
    font-family: var(--font-texte), system-ui, sans-serif;
  }
  h1, h2, h3 {
    font-family: var(--font-titre), Georgia, serif;
    font-weight: 500;
  }
  a { color: var(--or-lien); }
  a:hover { color: var(--encre); }
</style>
```

- [ ] **Step 4: Utiliser le layout dans `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
---
<Base
  title="Massage thaï à l'huile & Deep Tissue | Caroline, massage sur-mesure"
  description="Massages sur-mesure : thaï à l'huile, Deep Tissue, massage ciblé ou des pieds. Cabinet calme, clientèle mixte, soins strictement bien-être."
>
  <h1>Mes mains lisent vos tensions.</h1>
</Base>
```

- [ ] **Step 5: Écrire le test qui échoue**

C'est un test du HTML produit sur disque, pas un test navigateur : il tourne sous
Vitest, donc sans dépendre de Playwright qui n'arrive qu'en tâche 14.

Fichier `tests/unit/no-third-party.test.ts` :

```ts
import { test, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function fichiersHtml(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? fichiersHtml(join(dir, e.name))
      : e.name.endsWith('.html')
        ? [join(dir, e.name)]
        : [],
  );
}

test('aucune référence à un domaine tiers dans le HTML produit', () => {
  const interdits = ['fonts.googleapis.com', 'fonts.gstatic.com'];
  expect(existsSync('dist'), 'dist/ est absent — lancer `pnpm build` avant `pnpm test`').toBe(true);
  const fichiers = fichiersHtml('dist');
  expect(fichiers.length, 'aucun fichier HTML trouvé dans dist/ — le build a-t-il été lancé ?').toBeGreaterThan(0);
  for (const fichier of fichiers) {
    const contenu = readFileSync(fichier, 'utf8');
    for (const domaine of interdits) {
      expect(contenu, `${fichier} référence ${domaine}`).not.toContain(domaine);
    }
  }
});
```

Les deux assertions avant la boucle ne sont pas décoratives : sans elles, le test
n'exécute aucune assertion quand `dist/` est vide ou absent, et rapporte vert.
Un garde-fou qui passe sur une entrée vide ne garde rien.

- [ ] **Step 6: Lancer le test et vérifier qu'il passe**

```bash
pnpm build && pnpm test
```

Attendu : PASS. Si le test échoue en signalant `fonts.googleapis.com`, c'est que la configuration `fonts` n'est pas prise en compte — vérifier que le provider est bien `google()` et que `<Font>` est présent dans `<head>`.

- [ ] **Step 7: Vérifier que les polices sont bien émises localement**

```bash
ls dist/_astro/fonts | head
```

Attendu : des fichiers de police présents dans le répertoire de sortie.

- [ ] **Step 8: Commit**

```bash
git add astro.config.mjs src/styles/tokens.css src/layouts/Base.astro \
  src/pages/index.astro tests/unit/no-third-party.test.ts
git commit -m "feat(layout): self-host fonts, add design tokens and base layout"
```

---

### Task 3: Couche contenu et sa couture CMS

**Files:**
- Create: `src/content.config.ts`, `src/lib/content.ts`
- Create: `src/content/cabinet.yaml`, `src/content/forfaits.yaml`
- Create: `src/content/soins/*.yaml` (cinq fichiers), `src/content/faq/*.yaml` (sept fichiers)
- Test: `tests/unit/content.test.ts`

**Interfaces:**
- Consumes: le squelette de la tâche 1.
- Produit, depuis `src/lib/content.ts` :
  - `getCabinet(): Promise<Cabinet>`
  - `getSoins(): Promise<Soin[]>` — triés par `ordre` croissant
  - `getForfaits(): Promise<Forfait[]>`
  - `getFaq(): Promise<Question[]>` — triées par `ordre` croissant
  - `getAvis(): Promise<Avis[]>` — tableau vide tant qu'aucun avis authentique n'est fourni
  - `getSection(id: string): Promise<Section>` — lève une erreur si l'identifiant n'existe pas, plutôt que de rendre une section muette

  ```ts
  type Tarif = { duree: number; prix: number };
  type Soin = { id: string; nom: string; sousTitre: string; description: string; tarifs: Tarif[]; signature: boolean; ordre: number };
  type Forfait = { libelle: string; prix: number; prixBarre: number };
  type Question = { id: string; question: string; reponse: string; ordre: number };
  type Avis = { auteur: string; note: number; texte: string; date: string; url: string };
  type Bloc = { titre: string; texte: string };
  type Section = { id: string; surtitre?: string; titre: string; paragraphes: string[]; blocs?: Bloc[] };
  type Cabinet = { telephone: string; telephoneAffiche: string; email: string; ville: string; horaires: string; delaiReponse: string; instagram: string; prixMin: number; prixMax: number; siret?: string; assuranceRcPro?: string; statutJuridique?: string };
  ```

- [ ] **Step 1: Écrire les données du cabinet**

Fichier `src/content/cabinet.yaml`. Les valeurs `ville` et `horaires` suivent le design ; les contradictions relevées avec le document client sont listées en section 10 de la spec et se corrigent ici, à un seul endroit.

```yaml
telephone: "+33667989710"
telephoneAffiche: "06 67 98 97 10"
email: "contact@carolinemassagesurmesure.fr"
ville: "Carquefou"
horaires: "du lundi au samedi, 9h – 20h"
delaiReponse: "48 h"
instagram: "https://www.instagram.com/caroline_massagesurmesure"
prixMin: 45
prixMax: 130
```

- [ ] **Step 2: Écrire les cinq soins**

Contenu repris de `design/contenu-client.docx`, tarifs repris des accordéons du design (lignes 182-361). Un fichier par soin dans `src/content/soins/`.

`decouverte.yaml` :
```yaml
nom: "Massage découverte"
sousTitre: "idéal pour débuter"
description: >-
  Vous ne savez pas par où commencer ? En 30 minutes, je parcours l'ensemble du
  corps pour repérer vos zones de tension et vous offrir un premier moment de
  détente. Le point de départ idéal avant un soin plus profond.
tarifs:
  - { duree: 30, prix: 45 }
signature: false
ordre: 1
```

`cible.yaml` :
```yaml
nom: "Massage ciblé"
sousTitre: "une zone au choix"
description: >-
  Une douleur qui revient, un muscle qui ne lâche pas ? Je concentre tout le
  travail sur la zone qui en a besoin — dos, nuque, jambes, tête, face avant ou
  arrière — pour aller chercher en profondeur ce que le quotidien accumule.
tarifs:
  - { duree: 30, prix: 50 }
  - { duree: 60, prix: 85 }
signature: false
ordre: 2
```

`pieds.yaml` :
```yaml
nom: "Massage des pieds"
sousTitre: "seul ou en complément"
description: >-
  Ils nous portent toute la journée, et on les oublie presque toujours. Je
  travaille la voûte plantaire, les talons et les orteils par une pression lente
  et précise, pour relâcher les tensions et raviver la circulation. Un soin
  simple dont les effets se ressentent dans tout le corps.
tarifs:
  - { duree: 30, prix: 50 }
  - { duree: 60, prix: 85 }
signature: false
ordre: 3
```

`thai-huile.yaml` :
```yaml
nom: "Massage thaï à l'huile"
sousTitre: "la technique traditionnelle"
description: >-
  La précision du thaï traditionnel, enveloppée dans la douceur de l'huile. Je
  suis le fil de vos tensions, là où elles se cachent vraiment. Les muscles se
  réchauffent, s'assouplissent, et finissent par lâcher.
tarifs:
  - { duree: 60, prix: 90 }
  - { duree: 90, prix: 130 }
signature: false
ordre: 4
```

`signature.yaml` :
```yaml
nom: "Massage signature"
sousTitre: "le plus complet"
description: >-
  Mon massage, pensé pour vous, le jour où vous arrivez. On commence par le dos,
  les épaules et la nuque, avant d'envelopper tout le corps, en modulant la
  pression selon votre état du jour. Pas de cases à cocher — juste ce dont vous
  avez besoin, aujourd'hui.
tarifs:
  - { duree: 60, prix: 90 }
  - { duree: 90, prix: 130 }
signature: true
ordre: 5
```

- [ ] **Step 3: Écrire les forfaits**

Fichier `src/content/forfaits.yaml` :

```yaml
- { libelle: "3 séances de 60 min", prix: 255, prixBarre: 270 }
- { libelle: "5 séances de 60 min", prix: 400, prixBarre: 450 }
- { libelle: "3 séances de 90 min", prix: 370, prixBarre: 390 }
- { libelle: "5 séances de 90 min", prix: 550, prixBarre: 650 }
```

- [ ] **Step 4: Écrire la FAQ**

Sept fichiers dans `src/content/faq/`, un par question, contenu repris de `design/contenu-client.docx` et de la section faq du design (lignes 548-594). Format, ici pour `premiere-seance.yaml` :

```yaml
question: "Comment se déroule une première séance ?"
reponse: >-
  Chaque séance commence par un échange personnalisé de 5 à 10 minutes : on
  parle de vos tensions, de votre état du jour et de vos attentes. Ensuite, je
  m'adapte à ce que votre corps raconte. Merci d'arriver 15 minutes avant
  l'heure prévue.
ordre: 1
```

Les six autres, avec le même format et `ordre` de 2 à 7 : `tenue.yaml`
(« Que dois-je porter pendant le massage ? »), `contre-indications.yaml`
(« Y a-t-il des contre-indications ? »), `public.yaml` (« Les soins sont-ils
ouverts à tout le monde ? »), `paiement.yaml` (« Quels moyens de paiement
acceptez-vous ? »), `kinesitherapeute.yaml` (« Quelle différence avec un
kinésithérapeute ? »), `lieu.yaml` (« Où se situe le cabinet ? »). Reprendre les
réponses mot pour mot depuis le document client.

- [ ] **Step 4b: Écrire les textes de section**

Sans ceci, la couture ne couvrirait que les listes répétées, et le jour du CMS
la cliente pourrait modifier ses tarifs mais pas ses textes de présentation —
exactement l'inverse du besoin. Un fichier par section dans
`src/content/sections/`, contenu repris de `design/contenu-client.docx`.

`hero.yaml` :
```yaml
titre: "Mes mains lisent vos tensions."
paragraphes:
  - >-
    Votre corps garde la trace de tout : les longues journées, le stress qui
    s'accumule, les tensions que vous ne savez plus où loger. Dans mon cabinet,
    je crée l'espace où elles peuvent enfin se relâcher.
```

`parcours.yaml` — la seule section à utiliser `blocs`, qui porte les trois `<h3>` du design :
```yaml
surtitre: "MON PARCOURS"
titre: "De l'instinct à la maîtrise."
paragraphes:
  - >-
    Le massage n'est pas venu à moi : il était déjà là. Franco-thaïlandaise,
    j'ai grandi imprégnée de la culture thaïlandaise et de la philosophie
    bouddhiste, où prendre soin de l'autre est une seconde nature. Mes premiers
    gestes remontent à mes six ans, lorsque je massais ma grand-mère. À
    l'époque, c'était instinctif ; aujourd'hui, c'est devenu ma signature.
blocs:
  - titre: "Une expertise forgée à la source."
    texte: >-
      Esthéticienne depuis plus de dix ans, j'ai vite ressenti le besoin de
      revenir à mes racines pour parfaire ma technique. Je me suis formée au
      Wat Pho, à Bangkok — la référence mondiale du massage thaï. J'y ai appris
      la rigueur, la précision millénaire du massage traditionnel et le travail
      spécifique à l'huile.
  - titre: "Moins de protocole, plus de présence."
    texte: >-
      Au-delà des diplômes (BP Esthétique), ce sont mes années de pratique qui
      ont affiné mon toucher. J'ai laissé de côté les gestes standardisés pour
      une véritable écoute du muscle. Aujourd'hui, mes mains lisent vos tensions
      et adaptent la pression et le rythme en temps réel.
```

Écrire de même `soins.yaml` (surtitre « LES SOINS », titre « Des soins qui
s'adaptent à vous. »), `tarifs.yaml`, `cabinet.yaml` — attention, dans
`sections/`, à ne pas confondre avec le singleton `src/content/cabinet.yaml` —
titre « Un cadre pensé pour souffler. » et les trois paragraphes du document
client, `avis.yaml` (titre « Ce qu'ils en disent. »), `faq.yaml` (titre « Tout
ce qu'il faut savoir. ») et `contact.yaml` (surtitre « PRENDRE RENDEZ-VOUS »,
titre « Votre instant de bien-être. », accroche reformulée pour inviter à
appeler ou écrire puisque le formulaire n'est pas porté).

- [ ] **Step 5: Écrire `src/content.config.ts`**

C'est le fichier qui déclare **d'où** vient le contenu. Le jour du CMS, seuls les `loader` changent ; les schémas et `lib/content.ts` restent identiques.

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tarif = z.object({ duree: z.number().int().positive(), prix: z.number().positive() });

const soins = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/soins' }),
  schema: z.object({
    nom: z.string(),
    sousTitre: z.string(),
    description: z.string(),
    tarifs: z.array(tarif).min(1),
    signature: z.boolean(),
    ordre: z.number().int(),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/faq' }),
  schema: z.object({
    question: z.string(),
    reponse: z.string(),
    ordre: z.number().int(),
  }),
});

const avis = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/avis' }),
  schema: z.object({
    auteur: z.string(),
    note: z.number().int().min(1).max(5),
    texte: z.string(),
    date: z.string(),
    url: z.string().url(),
  }),
});

const sections = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/sections' }),
  schema: z.object({
    surtitre: z.string().optional(),
    titre: z.string(),
    paragraphes: z.array(z.string()),
    blocs: z
      .array(z.object({ titre: z.string(), texte: z.string() }))
      .optional(),
  }),
});

export const collections = { soins, faq, avis, sections };
```

- [ ] **Step 6: Écrire la façade `src/lib/content.ts`**

C'est la seule surface que les composants connaissent. `cabinet.yaml` et
`forfaits.yaml` sont des singletons, importés directement plutôt que modélisés en
collection : une collection à une entrée serait de la cérémonie sans bénéfice.

```ts
import { getCollection } from 'astro:content';
import cabinetData from '../content/cabinet.yaml';
import forfaitsData from '../content/forfaits.yaml';

export interface Tarif { duree: number; prix: number }
export interface Soin { id: string; nom: string; sousTitre: string; description: string; tarifs: Tarif[]; signature: boolean; ordre: number }
export interface Forfait { libelle: string; prix: number; prixBarre: number }
export interface Question { id: string; question: string; reponse: string; ordre: number }
export interface Avis { auteur: string; note: number; texte: string; date: string; url: string }
export interface Bloc { titre: string; texte: string }
export interface Section { id: string; surtitre?: string; titre: string; paragraphes: string[]; blocs?: Bloc[] }
export interface Cabinet {
  telephone: string; telephoneAffiche: string; email: string; ville: string;
  horaires: string; delaiReponse: string; instagram: string;
  prixMin: number; prixMax: number;
  // Renseignés par la cliente ; le pied de page et les mentions légales ne
  // rendent chaque champ que s'il a une valeur (tâche 13).
  siret?: string; assuranceRcPro?: string; statutJuridique?: string;
}

export async function getCabinet(): Promise<Cabinet> {
  return cabinetData as Cabinet;
}

export async function getForfaits(): Promise<Forfait[]> {
  return forfaitsData as Forfait[];
}

export async function getSoins(): Promise<Soin[]> {
  const entrees = await getCollection('soins');
  return entrees
    .map((e) => ({ id: e.id, ...e.data }))
    .sort((a, b) => a.ordre - b.ordre);
}

export async function getFaq(): Promise<Question[]> {
  const entrees = await getCollection('faq');
  return entrees
    .map((e) => ({ id: e.id, ...e.data }))
    .sort((a, b) => a.ordre - b.ordre);
}

export async function getAvis(): Promise<Avis[]> {
  const entrees = await getCollection('avis');
  return entrees.map((e) => e.data);
}

export async function getSection(id: string): Promise<Section> {
  const entrees = await getCollection('sections');
  const entree = entrees.find((e) => e.id === id);
  // Échouer au build plutôt que rendre une section muette : un titre manquant
  // passerait inaperçu en production.
  if (!entree) throw new Error(`Section inconnue : ${id}`);
  return { id: entree.id, ...entree.data };
}
```

- [ ] **Step 7: Écrire les tests qui échouent**

Fichier `tests/unit/content.test.ts`. Ces tests portent sur les invariants du contenu, pas sur Astro.

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';

const lire = (chemin: string) => parse(readFileSync(chemin, 'utf8'));

describe('cabinet', () => {
  const cabinet = lire('src/content/cabinet.yaml');

  it('expose un téléphone au format E.164', () => {
    expect(cabinet.telephone).toMatch(/^\+33\d{9}$/);
  });

  it('borne les prix dans un intervalle cohérent', () => {
    expect(cabinet.prixMin).toBeLessThan(cabinet.prixMax);
  });
});

describe('soins', () => {
  const soins = readdirSync('src/content/soins').map((f) =>
    lire(`src/content/soins/${f}`),
  );

  it('en compte cinq', () => {
    expect(soins).toHaveLength(5);
  });

  it("n'en désigne qu'un seul comme signature", () => {
    expect(soins.filter((s) => s.signature)).toHaveLength(1);
  });

  it('donne des ordres uniques', () => {
    const ordres = soins.map((s) => s.ordre);
    expect(new Set(ordres).size).toBe(ordres.length);
  });

  it('respecte la fourchette de prix annoncée par le cabinet', () => {
    const cabinet = lire('src/content/cabinet.yaml');
    const prix = soins.flatMap((s) => s.tarifs.map((t: { prix: number }) => t.prix));
    expect(Math.min(...prix)).toBe(cabinet.prixMin);
    expect(Math.max(...prix)).toBe(cabinet.prixMax);
  });
});

describe('faq', () => {
  const questions = readdirSync('src/content/faq').map((f) =>
    lire(`src/content/faq/${f}`),
  );

  it('en compte sept', () => {
    expect(questions).toHaveLength(7);
  });

  it('donne des ordres uniques', () => {
    const ordres = questions.map((q) => q.ordre);
    expect(new Set(ordres).size).toBe(ordres.length);
  });
});

describe('sections', () => {
  const attendues = [
    'hero', 'soins', 'tarifs', 'parcours',
    'cabinet', 'avis', 'faq', 'contact',
  ];

  it('couvre les huit sections ancrées de la page', () => {
    const presentes = readdirSync('src/content/sections')
      .filter((f) => f.endsWith('.yaml'))
      .map((f) => f.replace('.yaml', ''))
      .sort();
    expect(presentes).toEqual([...attendues].sort());
  });

  it('donne un titre non vide à chacune', () => {
    for (const id of attendues) {
      const section = lire(`src/content/sections/${id}.yaml`);
      expect(section.titre, `section ${id}`).toBeTruthy();
    }
  });
});
```

- [ ] **Step 8: Lancer les tests, constater l'échec**

```bash
pnpm test
```

Attendu : ÉCHEC tant que les fichiers de contenu ne sont pas tous écrits.

- [ ] **Step 9: Installer le support YAML et rendre les tests verts**

```bash
pnpm add -D yaml @rollup/plugin-yaml
```

Déclarer le plugin dans `astro.config.mjs` pour que les imports `.yaml` de
`lib/content.ts` fonctionnent :

```js
import yaml from '@rollup/plugin-yaml';

// dans defineConfig :
vite: { plugins: [yaml()] },
```

Le plugin gère la transformation au build, mais TypeScript ignore toujours ce
qu'est un module `.yaml`. Créer `src/env.d.ts` :

```ts
declare module '*.yaml' {
  const contenu: unknown;
  export default contenu;
}
```

Puis relancer :

```bash
pnpm test && pnpm check
```

Attendu : PASS sur les deux.

- [ ] **Step 10: Créer le répertoire des avis, vide**

```bash
mkdir -p src/content/avis
printf '# Un fichier par avis authentique, repris mot pour mot depuis Google.\n# Tant que ce répertoire est vide, la section avis nest pas rendue.\n' > src/content/avis/README.md
```

- [ ] **Step 11: Commit**

```bash
git add src/content src/content.config.ts src/lib src/env.d.ts tests/unit \
  astro.config.mjs package.json pnpm-lock.yaml
git commit -m "feat(content): add typed content layer with swappable loaders"
```

---

### Task 4: SEO, JSON-LD et fichiers de découverte

**Files:**
- Modify: `src/layouts/Base.astro`
- Create: `src/lib/jsonld.ts`
- Modify: `astro.config.mjs`, `src/pages/index.astro`
- Create: `public/robots.txt`
- Test: `tests/unit/jsonld.test.ts`

**Interfaces:**
- Consumes: `getCabinet()`, `getSoins()` de la tâche 3.
- Produit: `construireJsonLd(cabinet: Cabinet, soins: Soin[]): object`, dans `src/lib/jsonld.ts`.

- [ ] **Step 1: Écrire le test qui échoue**

L'enjeu du test : le téléphone, la ville et la fourchette de prix ne doivent
exister qu'à un seul endroit. S'ils sont recopiés dans le balisage, ils
divergeront du texte affiché à la première modification.

Fichier `tests/unit/jsonld.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { construireJsonLd } from '../../src/lib/jsonld';

const cabinet = {
  telephone: '+33667989710',
  telephoneAffiche: '06 67 98 97 10',
  email: 'contact@carolinemassagesurmesure.fr',
  ville: 'Carquefou',
  horaires: 'du lundi au samedi, 9h – 20h',
  delaiReponse: '48 h',
  instagram: 'https://www.instagram.com/caroline_massagesurmesure',
  prixMin: 45,
  prixMax: 130,
};

const soins = [
  { id: 'a', nom: 'Massage découverte', sousTitre: '', description: '', tarifs: [{ duree: 30, prix: 45 }], signature: false, ordre: 1 },
  { id: 'b', nom: 'Massage signature', sousTitre: '', description: '', tarifs: [{ duree: 90, prix: 130 }], signature: true, ordre: 2 },
];

describe('construireJsonLd', () => {
  const ld = construireJsonLd(cabinet, soins) as Record<string, unknown>;

  it('déclare un MassageBusiness', () => {
    expect(ld['@type']).toBe('MassageBusiness');
  });

  it('reprend le téléphone du cabinet sans le réécrire', () => {
    expect(ld.telephone).toBe(cabinet.telephone);
  });

  it('dérive la fourchette de prix des données du cabinet', () => {
    expect(ld.priceRange).toBe('45€–130€');
  });

  it('liste les soins au catalogue', () => {
    const noms = JSON.stringify(ld);
    expect(noms).toContain('Massage découverte');
    expect(noms).toContain('Massage signature');
  });
});
```

- [ ] **Step 2: Lancer le test, constater l'échec**

```bash
pnpm test tests/unit/jsonld.test.ts
```

Attendu : ÉCHEC avec « Cannot find module '../../src/lib/jsonld' ».

- [ ] **Step 3: Écrire `src/lib/jsonld.ts`**

```ts
import type { Cabinet, Soin } from './content';

export function construireJsonLd(cabinet: Cabinet, soins: Soin[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MassageBusiness',
    name: 'Caroline, Massage Sur-Mesure',
    description:
      "Massages sur-mesure : thaï à l'huile, Deep Tissue, massage ciblé, massage des pieds. Soins strictement bien-être, clientèle mixte.",
    address: {
      '@type': 'PostalAddress',
      addressLocality: cabinet.ville,
      addressCountry: 'FR',
    },
    telephone: cabinet.telephone,
    email: cabinet.email,
    priceRange: `${cabinet.prixMin}€–${cabinet.prixMax}€`,
    currenciesAccepted: 'EUR',
    sameAs: [cabinet.instagram],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Soins',
      itemListElement: soins.map((soin) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: soin.nom },
        priceSpecification: soin.tarifs.map((tarif) => ({
          '@type': 'UnitPriceSpecification',
          price: tarif.prix,
          priceCurrency: 'EUR',
        })),
      })),
    },
  };
}
```

- [ ] **Step 4: Lancer le test, vérifier qu'il passe**

```bash
pnpm test tests/unit/jsonld.test.ts
```

Attendu : PASS, quatre assertions vertes.

- [ ] **Step 5: Injecter le JSON-LD et les balises Open Graph dans `Base.astro`**

Ajouter dans le `<head>`, après la balise `description` :

```astro
---
// en tête de frontmatter, en plus des imports existants
import { getCabinet, getSoins } from '../lib/content';
import { construireJsonLd } from '../lib/jsonld';

const cabinet = await getCabinet();
const soins = await getSoins();
const jsonLd = construireJsonLd(cabinet, soins);
---
<meta property="og:type" content="website" />
<meta property="og:locale" content="fr_FR" />
<meta property="og:site_name" content="Caroline, Massage Sur-Mesure" />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<link rel="canonical" href={new URL(Astro.url.pathname, Astro.site)} />
<script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
```

- [ ] **Step 6: Ajouter le sitemap**

```bash
pnpm astro add sitemap --yes
```

- [ ] **Step 7: Écrire `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://carolinemassagesurmesure.fr/sitemap-index.xml
```

- [ ] **Step 8: Vérifier le rendu du JSON-LD**

```bash
pnpm build && grep -c 'MassageBusiness' dist/index.html
```

Attendu : `1`.

- [ ] **Step 9: Commit**

```bash
git add src/lib/jsonld.ts src/layouts/Base.astro public/robots.txt \
  tests/unit/jsonld.test.ts astro.config.mjs package.json pnpm-lock.yaml
git commit -m "feat(seo): generate JSON-LD from cabinet data, add sitemap and robots"
```

---

### Task 5: Primitives d'interface et assets

**Files:**
- Create: `src/assets/images/caro-ornement-frise.png`, `caro-ornement-coin.png`, `caro-cabinet.jpg`
- Create: `src/components/ui/Frise.astro`, `OrnementCoin.astro`, `Bouton.astro`, `Accordeon.astro`, `EnTeteSection.astro`

**Interfaces:**
- Consumes: les tokens de la tâche 2.
- Produit :
  - `<Frise />` — la frise séparatrice, sans prop.
  - `<OrnementCoin position="haut-gauche" | "haut-droite" | "bas-gauche" | "bas-droite" />`
  - `<Bouton href: string, variante: "plein" | "contour", ...>` — slot pour le libellé.
  - `<Accordeon titre: string>` — slot pour le corps ; rend `<details>` / `<summary>`.
  - `<EnTeteSection surtitre: string, titre: string>`

- [ ] **Step 1: Récupérer les trois assets du projet design**

Les fichiers `caro-ornement-frise.png` (900 × 59), `caro-ornement-coin.png`
(220 × 220) et `caro-cabinet.jpg` (800 × 1035) vivent à la racine du projet
Claude Design `6069b7a5-682e-42da-8370-d3b6bdc9babf`. Les télécharger dans
`src/assets/images/`, puis vérifier :

```bash
ls -l src/assets/images/
```

Attendu : les trois fichiers présents et non vides.

- [ ] **Step 2: Écrire `src/components/ui/Accordeon.astro`**

`<details>` / `<summary>` natifs : aucun JavaScript, et le clavier comme les
lecteurs d'écran fonctionnent sans code. C'est le motif du design, à la fois pour
les soins et pour la FAQ.

```astro
---
interface Props { titre: string }
const { titre } = Astro.props;
---
<details class="accordeon">
  <summary>
    <span class="titre">{titre}</span>
    <span class="marque" aria-hidden="true"></span>
  </summary>
  <div class="corps"><slot /></div>
</details>

<style>
  .accordeon { border-bottom: 1px solid color-mix(in srgb, var(--or) 30%, transparent); }
  summary { display: flex; align-items: center; justify-content: space-between;
            gap: 16px; padding: 20px 0; cursor: pointer; list-style: none; }
  summary::-webkit-details-marker { display: none; }
  summary:focus-visible { outline: 2px solid var(--or); outline-offset: 3px; }
  .titre { font-family: var(--font-titre), Georgia, serif; font-size: 1.15rem; }
  .corps { padding-bottom: 20px; color: var(--encre-douce); line-height: 1.6; }
</style>
```

- [ ] **Step 3: Écrire `src/components/ui/Bouton.astro`**

```astro
---
interface Props { href: string; variante?: 'plein' | 'contour' }
const { href, variante = 'plein' } = Astro.props;
---
<a href={href} class={`bouton ${variante}`}><slot /></a>

<style>
  .bouton {
    display: inline-flex; align-items: center; justify-content: center;
    min-height: 52px; padding: 0 24px; border-radius: var(--rayon);
    font-weight: 700; font-size: 0.875rem; letter-spacing: 0.1em;
    text-transform: uppercase; text-decoration: none;
    transition: background 0.25s ease, color 0.25s ease, border-color 0.25s ease;
  }
  .plein { background: var(--vert-profond); color: var(--creme);
           border: 1px solid color-mix(in srgb, var(--or) 55%, transparent); }
  .plein:hover { background: var(--vert-clair); color: var(--creme); }
  .contour { background: none; color: var(--vert-profond);
             border: 1px solid var(--vert-profond); }
  .contour:hover { background: var(--vert-profond); color: var(--creme); }
  .bouton:focus-visible { outline: 2px solid var(--or); outline-offset: 3px; }
</style>
```

- [ ] **Step 4: Écrire `EnTeteSection.astro`, `Frise.astro` et `OrnementCoin.astro`**

Reprendre le traitement du design : le surtitre est une petite capitale espacée,
précédée d'un filet vertical doré ; le titre est en Petrona. Les deux composants
d'ornement encapsulent un `<Image>` de `astro:assets` avec `width`, `height` et
`alt=""` (ce sont des éléments décoratifs, donc retirés de l'arbre
d'accessibilité).

- [ ] **Step 5: Vérifier**

```bash
pnpm check && pnpm lint
```

Attendu : deux commandes en code de sortie 0.

- [ ] **Step 6: Commit**

```bash
git add src/assets src/components/ui
git commit -m "feat(ui): add ornament, button, accordion and section-header primitives"
```

---

### Task 6: Navigation

**Files:**
- Create: `src/components/Navigation.astro`
- Create: `src/scripts/menu.ts`
- Modify: `src/layouts/Base.astro`

**Interfaces:**
- Consumes: les tokens de la tâche 2.
- Produit: `<Navigation />`, sans prop. Les liens pointent vers `#soins`, `#parcours`, `#cabinet`, `#faq`, `#contact`.

**Source:** `design/accueil-page-vert-or.dc.html`, lignes 76-128. La logique d'ouverture du menu est aux lignes 715-1080, fonction `toggleMenu`.

- [ ] **Step 1: Porter le balisage de la navigation**

Une seule arborescence. Sur mobile, un bouton d'ouverture et un panneau ; à
partir de 900 px, la liste horizontale. Le panneau mobile est un `<dialog>` ou
un `<nav hidden>` piloté par l'attribut `aria-expanded` du bouton — pas par une
classe CSS seule, sinon l'état n'est pas exposé aux technologies d'assistance.

- [ ] **Step 2: Écrire le script du menu**

Fichier `src/scripts/menu.ts` : bascule `aria-expanded` et l'attribut `hidden`
du panneau, ferme sur `Escape`, et restitue le focus au bouton d'ouverture à la
fermeture.

- [ ] **Step 3: Vérifier le comportement clavier**

```bash
pnpm check && pnpm lint && pnpm build && pnpm test
```

Attendu : code de sortie 0 partout. Puis, manuellement : ouvrir le menu au
clavier seul, vérifier que `Escape` le referme et que le focus revient au bouton
d'ouverture.

- [ ] **Step 4: Commit**

```bash
git add src/components/Navigation.astro src/scripts/menu.ts src/layouts/Base.astro
git commit -m "feat(nav): add responsive navigation with accessible mobile panel"
```

---

### Task 7: Section hero et animation d'ouverture

**Files:**
- Create: `src/components/sections/Hero.astro`
- Create: `src/scripts/intro.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `getSection('hero')`, `getCabinet()`, `<Bouton>`, `<OrnementCoin>`.
- Produit: `<Hero />`, sans prop.

**Source:** lignes 129-181 pour le balisage, lignes 46-74 pour les 19 `@keyframes`.

- [ ] **Step 1: Porter le balisage du hero**

Titre `<h1>` et accroche lus depuis `getSection('hero')`, mention des horaires
lue depuis `getCabinet()`, deux boutons (« Prendre rendez-vous » vers
`#contact`, « Découvrir les soins » vers `#soins`), photo encadrée d'ornements.
Le fond est `--vert-profond` : marquer la section `data-surface="dark"`, la
tâche 12 s'en sert.

- [ ] **Step 2: Porter les animations sous garde-fou**

Les 19 `@keyframes` du design sont reprises telles quelles, mais **toutes** les
déclarations `animation:` sont enveloppées :

```css
@media (prefers-reduced-motion: no-preference) {
  .titre-mot { animation: wordIn 0.8s cubic-bezier(0.2, 0.7, 0.3, 1) both; }
}
```

L'ouverture masque du contenu à l'état initial. Sans ce garde-fou, un visiteur en
mouvement réduit verrait une page vide. À l'état neutralisé, le contenu est
visible immédiatement, sans transition.

- [ ] **Step 3: Écrire `src/scripts/intro.ts`**

Le script se contente d'ajouter une classe sur `<body>` au chargement pour
déclencher la séquence. Il commence par lire
`matchMedia('(prefers-reduced-motion: reduce)')` et ne fait rien si la préférence
est active. Le bouton « Rejouer l'ouverture » du design n'est pas porté : c'est
un outil de revue de maquette.

- [ ] **Step 4: Vérifier dans les deux états**

```bash
pnpm build && pnpm test
```

Puis, manuellement, recharger la page avec le mouvement réduit activé au niveau
du système et vérifier que tout le contenu du hero est visible immédiatement.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Hero.astro src/scripts/intro.ts src/pages/index.astro
git commit -m "feat(hero): port hero section and opening animation with reduced-motion guard"
```

---

### Task 8: Sections soins et tarifs

**Files:**
- Create: `src/components/sections/Soins.astro`, `src/components/sections/Tarifs.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `getSection('soins')`, `getSection('tarifs')`, `getSoins()`, `getForfaits()`, `<Accordeon>`, `<EnTeteSection>`.
- Produit: `<Soins />` et `<Tarifs />`, sans prop.

**Source:** lignes 182-361 (soins) et 362-371 (tarifs).

- [ ] **Step 1: Porter la section soins**

Surtitre et titre lus depuis `getSection('soins')`, puis un
`<Accordeon>` par soin issu de `getSoins()`. Le libellé du sommaire suit le
design : nom, sous-titre, puis « dès N € » calculé comme le minimum des
`tarifs[].prix` — jamais écrit en dur. Le soin marqué `signature: true` reçoit
le traitement à fond vert.

- [ ] **Step 2: Porter la section tarifs**

Les quatre forfaits de `getForfaits()`, avec le prix barré et le prix courant.
La mention d'économie est calculée : `max(prixBarre - prix)` sur l'ensemble.

- [ ] **Step 3: Vérifier que les prix affichés viennent bien du contenu**

```bash
pnpm build
grep -c 'dès 45' dist/index.html
```

Attendu : au moins `1`. Modifier temporairement `prix: 45` en `prix: 46` dans
`src/content/soins/decouverte.yaml`, relancer le build, vérifier que
l'affichage suit, puis annuler la modification.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Soins.astro src/components/sections/Tarifs.astro src/pages/index.astro
git commit -m "feat(soins): port treatments accordions and package pricing"
```

---

### Task 9: Sections parcours et cabinet

**Files:**
- Create: `src/components/sections/Parcours.astro`, `src/components/sections/Cabinet.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `getSection('parcours')`, `getSection('cabinet')`, `<EnTeteSection>`, `<Frise>`, `<Image>` d'`astro:assets`.
- Produit: `<Parcours />` et `<Cabinet />`, sans prop.

**Source:** lignes 372-434 (parcours) et 435-479 (cabinet).

- [ ] **Step 1: Porter la section parcours**

Tout le texte vient de `getSection('parcours')` : le `titre` pour le `<h1>` de
section, `paragraphes` pour l'accroche, et `blocs` pour les trois `<h3>`
numérotés du design. Aucun texte en dur dans le composant — c'est ce qui rend la
couture CMS utile sur toute la page et pas seulement sur les listes.

- [ ] **Step 2: Porter la section cabinet**

Titre et paragraphes lus depuis `getSection('cabinet')`, et la photo `caro-cabinet.jpg` via `<Image>` avec `width={800}`,
`height={1035}` et un `alt` descriptif — pas décoratif ici, la photo porte de
l'information.

- [ ] **Step 3: Vérifier le poids des images**

```bash
pnpm build && du -sh dist/_astro/*.jpg dist/_astro/*.webp 2>/dev/null | sort -h | tail -5
```

Attendu : la photo du cabinet est servie en format moderne et pèse
sensiblement moins que les 800 × 1035 d'origine.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Parcours.astro src/components/sections/Cabinet.astro src/pages/index.astro
git commit -m "feat(sections): port practitioner background and treatment room"
```

---

### Task 10: Sections avis et FAQ

**Files:**
- Create: `src/components/sections/Avis.astro`, `src/components/sections/Faq.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/unit/avis.test.ts`

**Interfaces:**
- Consumes: `getSection('avis')`, `getSection('faq')`, `getAvis()`, `getFaq()`, `<Accordeon>`, `<EnTeteSection>`.
- Produit: `<Avis />` et `<Faq />`, sans prop.

**Source:** lignes 480-547 (avis) et 548-594 (faq).

- [ ] **Step 1: Écrire le test qui échoue**

Le design marque explicitement les avis comme des emplacements
(`[TEXTE DE L'AVIS — texte intégral, jamais réécrit]`). Des avis inventés ou
réécrits constituent une pratique commerciale trompeuse au sens de
l'article L121-2 du code de la consommation. Ce test verrouille la règle.

Fichier `tests/unit/avis.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';

describe('avis', () => {
  const fichiers = readdirSync('src/content/avis').filter((f) => f.endsWith('.yaml'));

  it('ne contient aucun avis tant que de vrais avis ne sont pas fournis', () => {
    expect(fichiers).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Lancer le test**

```bash
pnpm test tests/unit/avis.test.ts
```

Attendu : PASS — le répertoire ne contient que le `README.md` créé en tâche 3.
Ce test devra être remplacé, et non supprimé, le jour où de vrais avis
arriveront : il deviendra une vérification que chaque avis porte bien un `url`
pointant vers sa source.

- [ ] **Step 3: Porter la section avis, conditionnelle**

```astro
---
import { getAvis } from '../../lib/content';
const avis = await getAvis();
---
{avis.length > 0 && (
  <section id="avis" data-anchor="avis" data-surface="light">
    <!-- en-tête et cartes -->
  </section>
)}
```

Si la collection est vide, la section n'est pas rendue du tout — pas de section
vide, pas de squelette d'attente.

- [ ] **Step 4: Porter la section FAQ**

Titre lu depuis `getSection('faq')`, puis un `<Accordeon>` par question de
`getFaq()`. Même primitive que les soins : la cohérence de traitement est déjà
celle du design.

- [ ] **Step 5: Vérifier**

```bash
pnpm check && pnpm lint && pnpm build && pnpm test
grep -c 'id="avis"' dist/index.html
```

Attendu : les tests passent, et `grep` retourne `0` puisqu'aucun avis n'est
fourni.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/Avis.astro src/components/sections/Faq.astro \
  src/pages/index.astro tests/unit/avis.test.ts
git commit -m "feat(sections): port FAQ and conditional reviews section"
```

---

### Task 11: Section contact et pied de page

**Files:**
- Create: `src/components/sections/Contact.astro`, `src/components/PiedDePage.astro`
- Modify: `src/pages/index.astro`, `src/layouts/Base.astro`

**Interfaces:**
- Consumes: `getSection('contact')`, `getCabinet()`, `<Bouton>`, `<OrnementCoin>`.
- Produit: `<Contact />` et `<PiedDePage />`, sans prop.

**Source:** lignes 595-713. **Le formulaire n'est pas porté** (spec, section 1) :
seuls le titre, l'accroche, les deux boutons de contact, les horaires et le
délai de réponse le sont.

- [ ] **Step 1: Porter la section contact**

Surtitre, titre et accroche lus depuis `getSection('contact')` — l'accroche y a
déjà été reformulée en tâche 3 pour inviter à appeler ou écrire, puisque le
formulaire n'est pas porté.
Deux boutons : `tel:` avec `cabinet.telephoneAffiche` en libellé, et `mailto:`
avec `cabinet.email`. Sous les boutons, la ligne horaires + délai de réponse,
lue depuis `getCabinet()`. Fond `--vert-profond` : marquer
`data-surface="dark"`.

- [ ] **Step 2: Porter le pied de page**

Logotype, téléphone, e-mail, lien Instagram depuis `cabinet.instagram`, liens
vers `/mentions-legales` et `/politique-confidentialite`, et les emplacements
SIRET et assurance RC pro — ces deux derniers sont rendus depuis `cabinet.yaml`
et n'apparaissent que si les valeurs y sont renseignées.

- [ ] **Step 3: Vérifier que le formulaire n'a pas été porté par inadvertance**

```bash
pnpm build
grep -c '<form' dist/index.html
```

Attendu : `0`.

- [ ] **Step 4: Vérifier que le téléphone n'existe qu'à une source**

```bash
grep -o '06 67 98 97 10\|+33667989710' dist/index.html | sort | uniq -c
```

Attendu : plusieurs occurrences, toutes issues de `cabinet.yaml`. Modifier
temporairement le numéro dans `cabinet.yaml`, rebuilder, vérifier que **toutes**
les occurrences changent — y compris celle du JSON-LD — puis annuler.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Contact.astro src/components/PiedDePage.astro \
  src/pages/index.astro src/layouts/Base.astro
git commit -m "feat(contact): port contact section without form, add footer"
```

---

### Task 12: Barre CTA collante, en déclaratif

**Files:**
- Create: `src/components/StickyCta.astro`, `src/scripts/sticky-cta.ts`, `src/lib/surface.ts`
- Modify: `src/layouts/Base.astro`
- Test: `tests/unit/surface.test.ts`

**Interfaces:**
- Consumes: `getCabinet()`, et l'attribut `data-surface` posé sur les sections aux tâches 7 à 11.
- Produit: `surfaceCourante(entrees: { surface: 'dark' | 'light'; visible: boolean }[]): 'dark' | 'light'`, dans `src/lib/surface.ts`.

**Source:** lignes 715-1080, méthode `probeBg`. Le design y scanne les nœuds sous
la barre, lit leur `backgroundColor` calculé et en dérive une luminance. C'est
fragile — cela casse dès qu'une section reçoit une image de fond, un dégradé ou
un wrapper intermédiaire — et intestable sans DOM réel. On le remplace par du
déclaratif à rendu identique.

- [ ] **Step 1: Écrire le test qui échoue**

Fichier `tests/unit/surface.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { surfaceCourante } from '../../src/lib/surface';

describe('surfaceCourante', () => {
  it('retourne la surface de la section visible', () => {
    expect(surfaceCourante([
      { surface: 'dark', visible: true },
      { surface: 'light', visible: false },
    ])).toBe('dark');
  });

  it('retourne la dernière visible quand plusieurs le sont', () => {
    expect(surfaceCourante([
      { surface: 'dark', visible: true },
      { surface: 'light', visible: true },
    ])).toBe('light');
  });

  it('retombe sur light quand rien nest visible', () => {
    expect(surfaceCourante([
      { surface: 'dark', visible: false },
    ])).toBe('light');
  });

  it('retombe sur light sur une liste vide', () => {
    expect(surfaceCourante([])).toBe('light');
  });
});
```

- [ ] **Step 2: Lancer le test, constater l'échec**

```bash
pnpm test tests/unit/surface.test.ts
```

Attendu : ÉCHEC avec « Cannot find module '../../src/lib/surface' ».

- [ ] **Step 3: Écrire `src/lib/surface.ts`**

```ts
export type Surface = 'dark' | 'light';

export function surfaceCourante(
  entrees: { surface: Surface; visible: boolean }[],
): Surface {
  const visibles = entrees.filter((e) => e.visible);
  return visibles.length > 0 ? visibles[visibles.length - 1].surface : 'light';
}
```

- [ ] **Step 4: Lancer le test, vérifier qu'il passe**

```bash
pnpm test tests/unit/surface.test.ts
```

Attendu : PASS, quatre assertions vertes.

- [ ] **Step 5: Écrire `src/scripts/sticky-cta.ts`**

Un `IntersectionObserver` sur `[data-surface]` avec un `rootMargin` qui ne
retient que la bande où se trouve la barre. À chaque changement, appeler
`surfaceCourante()` et poser l'attribut `data-sur` correspondant sur la barre.
La barre apparaît au-delà de 75 % de la hauteur de fenêtre défilée, et se
rétracte quand la section `#contact` entre dans le champ — inutile de proposer
d'appeler quand le bloc de contact est déjà à l'écran.

- [ ] **Step 6: Écrire `src/components/StickyCta.astro`**

Un lien `tel:` unique, dont les couleurs basculent via `[data-sur="dark"]` et
`[data-sur="light"]` en CSS. La transition d'apparition passe sous
`@media (prefers-reduced-motion: no-preference)`.

- [ ] **Step 7: Vérifier**

```bash
pnpm check && pnpm lint && pnpm test && pnpm build
```

Attendu : quatre commandes en code de sortie 0.

- [ ] **Step 8: Commit**

```bash
git add src/components/StickyCta.astro src/scripts/sticky-cta.ts \
  src/lib/surface.ts src/layouts/Base.astro tests/unit/surface.test.ts
git commit -m "feat(cta): replace luminance probing with declarative surface detection"
```

---

### Task 13: Pages légales et 404

**Files:**
- Create: `src/pages/mentions-legales.astro`, `src/pages/politique-confidentialite.astro`, `src/pages/404.astro`
- Modify: `src/content/cabinet.yaml`

**Interfaces:**
- Consumes: `Base.astro`, `getCabinet()`, `<PiedDePage>`.
- Produit: trois pages statiques.

- [ ] **Step 1: Ajouter les champs légaux à `cabinet.yaml`**

```yaml
siret: ""
assuranceRcPro: ""
statutJuridique: ""
```

Les trois clés sont déjà déclarées optionnelles dans l'interface `Cabinet`
(tâche 3) : il n'y a rien à changer côté types. Elles restent vides tant que la
cliente ne les a pas fournies (spec, section 10), et le pied de page ne rend un
champ que s'il a une valeur.

- [ ] **Step 2: Écrire la page de mentions légales**

Obligatoire au titre de l'article 6 de la LCEN pour une activité
professionnelle. Rubriques : identité et statut de l'éditrice, numéro SIRET,
assurance responsabilité civile professionnelle, coordonnées, identité de
l'hébergeur (Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107,
États-Unis), et directeur de la publication. Les valeurs manquantes sont lues
depuis `cabinet.yaml` et rendues comme des emplacements visibles tant qu'elles
sont vides — un `[SIRET]` visible se remarque à la relecture, un champ absent
non.

- [ ] **Step 3: Écrire la politique de confidentialité**

Le site ne collecte aucune donnée personnelle : pas de formulaire, pas de
cookie, pas d'analytique. La page le dit explicitement, et mentionne les
journaux serveur produits par l'hébergeur ainsi que leur finalité. Si une
solution de statistiques est ajoutée plus tard, cette page est le premier
fichier à mettre à jour.

- [ ] **Step 4: Écrire la page 404**

Requise par `not_found_handling: "404-page"` de `wrangler.jsonc` : sans
`404.html` dans `dist/`, la configuration pointe dans le vide. Message court,
lien de retour vers l'accueil, même layout que le reste.

- [ ] **Step 5: Vérifier que les trois pages sont produites**

```bash
pnpm build && ls dist/404.html dist/mentions-legales/index.html dist/politique-confidentialite/index.html
```

Attendu : les trois fichiers existent.

- [ ] **Step 6: Commit**

```bash
git add src/pages/mentions-legales.astro src/pages/politique-confidentialite.astro \
  src/pages/404.astro src/content/cabinet.yaml
git commit -m "feat(pages): add legal notice, privacy policy and 404 page"
```

---

### Task 14: Vérification d'accessibilité, de performance et déploiement

**Files:**
- Create: `playwright.config.ts`, `tests/a11y/axe.spec.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: le site complet des tâches 1 à 13.
- Produit: une suite `pnpm test:a11y` verte sur les quatre pages.

- [ ] **Step 1: Écrire `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/a11y',
  webServer: {
    command: 'pnpm preview --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: true,
  },
  use: { baseURL: 'http://localhost:4321' },
});
```

- [ ] **Step 2: Écrire le test axe**

Sur un site vitrine, l'accessibilité n'est pas une propriété annexe : elle est
le livrable. Elle se mesure.

Fichier `tests/a11y/axe.spec.ts` :

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = ['/', '/mentions-legales', '/politique-confidentialite', '/404'];

for (const chemin of pages) {
  test(`aucune violation d'accessibilité sur ${chemin}`, async ({ page }) => {
    await page.goto(chemin);
    const resultats = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(resultats.violations).toEqual([]);
  });
}
```

- [ ] **Step 3: Lancer et corriger jusqu'au vert**

```bash
pnpm build && pnpm test:a11y
```

Attendu : PASS sur les quatre pages. Chaque violation se corrige à la source —
contraste insuffisant, libellé de lien manquant, ordre de titres rompu — jamais
en excluant la règle.

- [ ] **Step 4: Vérifier le budget JavaScript**

```bash
pnpm build && du -ch dist/_astro/*.js | tail -1
```

Attendu : le total reste modeste. Trois scripts seulement doivent exister —
menu, intro, sticky-cta. Si un quatrième apparaît, comprendre d'où il vient
avant d'aller plus loin.

- [ ] **Step 5: Ajouter le test d'accessibilité à la CI**

Dans `.github/workflows/ci.yml`, après l'étape `pnpm build` :

```yaml
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:a11y
```

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts tests/a11y/axe.spec.ts .github/workflows/ci.yml package.json pnpm-lock.yaml
git commit -m "test(a11y): enforce zero axe violations across all pages in CI"
```

- [ ] **Step 7: Premier déploiement**

Le déploiement est une action délibérée, jamais automatique sur push. Il
suppose que le compte Cloudflare et le nom de domaine soient au nom de la
cliente (spec, section 7).

```bash
pnpm deploy
```

- [ ] **Step 8: Vérifier le site déployé**

Contrôler, sur l'URL de production : le rendu des huit sections, le
comportement de la barre CTA au défilement, l'ouverture du menu mobile, la
réponse 404 sur une URL inconnue, et l'absence de toute requête vers un domaine
tiers dans l'onglet réseau.

---

## Ce que ce plan ne couvre pas

- **Le contenu légal réel** — SIRET, statut juridique, assurance RC pro — reste
  à fournir par la cliente. Les emplacements sont en place et visibles.
- **Les avis clients**, tant que de vrais avis Google ne sont pas disponibles.
  La section ne se rend pas ; le test de la tâche 10 verrouille la règle.
- **Les contradictions entre sources** listées en section 10 de la spec : ville,
  horaires, adresse, fourchette de prix. Elles se corrigent dans
  `cabinet.yaml`, à un seul endroit, sans toucher au code.
- **Le branchement d'un CMS.** La couture est en place (tâche 3) ; l'activer est
  un projet distinct.
- **Les statistiques de fréquentation**, en attente d'arbitrage.
