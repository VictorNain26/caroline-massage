# Site vitrine — Caroline, Massage Sur-Mesure

Design validé le 2026-08-15.

## 1. Objectif et périmètre

Site vitrine one-page pour une praticienne en massage bien-être à Carquefou. La
conversion visée est l'appel téléphonique : `tel:0667989710`. Il n'y a ni
formulaire, ni compte utilisateur, ni base de données.

Le design source est le projet Claude Design `6069b7a5-682e-42da-8370-d3b6bdc9babf`,
fichiers `Accueil Vert Or.dc.html` (scène de présentation) et
`Accueil Page Vert Or.dc.html` (la page réelle, 258 Ko).

**Dans le périmètre**

- Page d'accueil : sections hero, parcours, soins, tarifs, contact.
- Page mentions légales (obligation art. 6 LCEN pour une activité professionnelle).
- Page 404, requise par la configuration de déploiement (section 7).
- Déploiement sur Cloudflare Workers static assets.

**Hors périmètre, explicitement**

- Blog, actualités, tout flux éditorial.
- Authentification, base de données, back-office.
- Internationalisation : le site est monolingue français.
- Réservation en ligne et paiement.

**Prévu mais non implémenté** : le branchement d'un CMS headless, pour que la
cliente édite ses textes sans intervention. La section 4 décrit la couture qui
rend ce branchement possible sans toucher aux composants.

## 2. Stack

| Choix | Décision | Justification |
|---|---|---|
| Framework | Astro, build statique | Sortie HTML/CSS, JS uniquement là où un comportement l'exige. Le SEO local est le cœur du besoin. |
| Styles | CSS natif + variables | Les styles d'un composant `.astro` sont scopés automatiquement. Un design très sur-mesure ne gagne rien à passer par un framework utilitaire. |
| Contenu | Content Layer, loader `glob()` | Le `loader` est interchangeable : fichiers locaux aujourd'hui, API CMS demain. |
| Polices | API `fonts` d'Astro, `fontProviders.local()` | Fichiers `.woff2` dans le repo. Aucun appel à `fonts.googleapis.com`. |
| Hébergement | Cloudflare Workers static assets | Requêtes aux assets statiques gratuites et sans plafond, usage commercial autorisé, domaine et TLS inclus. |

Sources : [content-loader-reference](https://docs.astro.build/en/reference/content-loader-reference/),
[guides/fonts](https://docs.astro.build/en/guides/fonts/),
[font-provider-reference](https://docs.astro.build/en/reference/font-provider-reference/),
[workers/platform/pricing](https://developers.cloudflare.com/workers/platform/pricing/) (note 3 :
« Requests to static assets are free and unlimited »).

Vercel Hobby a été écarté : [docs/plans/hobby](https://vercel.com/docs/plans/hobby) —
« the Hobby plan restricts users to non-commercial, personal use only ». Un site
client n'y a pas sa place.

Le build ne produit aucun runtime serveur. Le dossier `dist/` est déployable
ailleurs sans réécriture : le choix de Cloudflare est réversible.

## 3. Arborescence

```
caroline-massage/
├── CLAUDE.md
├── .claude/
│   ├── settings.json
│   └── rules/astro.md
├── astro.config.mjs
├── wrangler.jsonc
├── package.json
├── tsconfig.json
├── public/
├── src/
│   ├── assets/fonts/            Petrona + Alegreya Sans, .woff2
│   ├── assets/images/           photos cabinet, ornements
│   ├── content/
│   │   ├── cabinet.yaml
│   │   ├── soins/
│   │   └── avis/
│   ├── content.config.ts
│   ├── lib/content.ts
│   ├── layouts/Base.astro
│   ├── components/sections/     Hero, Parcours, Soins, Tarifs, Contact
│   ├── components/ui/           Bouton, Accordeon, Ornement, StickyCta
│   ├── scripts/                 intro.ts, sticky-cta.ts
│   ├── styles/tokens.css
│   └── pages/
│       ├── index.astro
│       ├── mentions-legales.astro
│       └── 404.astro
├── tests/
└── docs/superpowers/specs/
```

## 4. Couche contenu — la couture CMS

C'est le seul endroit du projet où l'on anticipe un besoin futur, parce que le
coût est de l'ordre de trente lignes et que la dette évitée est une réintégration
complète.

**Deux fichiers, une seule responsabilité chacun.**

`src/content.config.ts` déclare d'où vient le contenu. Aujourd'hui :

```ts
const soins = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/soins' }),
  schema: z.object({ /* … */ }),
});
```

`src/lib/content.ts` est la seule surface que les composants connaissent. Il
expose `getCabinet()`, `getSoins()`, `getAvis()`. Aucun composant n'appelle
`getCollection()` directement.

**Le jour du CMS** : `content.config.ts` remplace `glob()` par un loader custom
qui interroge l'API, `lib/content.ts` conserve ses signatures. Aucun composant
n'est modifié. Un webhook déclenche un rebuild ; le contenu n'est donc pas
éditable en direct, il y a le délai d'un build. C'est le compromis normal du
statique et il est acceptable pour un site vitrine.

**Contenu modélisé**

- `cabinet.yaml` — téléphone, adresse, horaires, fourchette de prix. Source
  unique : le JSON-LD et le texte affiché sont tous deux générés à partir de ce
  fichier, jamais recopiés. Sinon les deux divergent à la première modification.
- `soins/` — un fichier par soin (thaï à l'huile, Deep Tissue, ciblé, pieds) :
  nom, durée, prix, description.
- `avis/` — un fichier par avis. Cette collection ne contient que des avis
  authentiques ; à défaut, la section n'est pas affichée. Des avis inventés
  constituent une pratique commerciale trompeuse (art. L121-2 code de la consommation).

## 5. Traduction du design

Le `.dc.html` est la source de vérité **visuelle**. Il n'est jamais recopié comme
code : il contient des artefacts propres à l'outil de design.

**Trois écarts assumés**

1. **Le prop `is-mobile` disparaît.** Le fichier source rend deux arbres, un en
   390 px et un en 1440 px, pilotés par un booléen — c'est ainsi que l'outil
   affiche deux maquettes côte à côte. L'implémentation est une seule arborescence
   responsive, mobile-first. Deux arbres, ce serait doubler chaque correction et
   garantir la dérive.

2. **La sonde de luminance du CTA sticky est remplacée.** Le script source scanne
   les nœuds sous la barre, lit leur `backgroundColor` calculé et en dérive une
   luminance. Fragile : cela casse dès qu'une section reçoit une image de fond, un
   dégradé ou un wrapper intermédiaire. Remplacé par du déclaratif — chaque section
   porte `data-surface="dark"` ou `"light"`, un `IntersectionObserver` détermine
   celle qui se trouve sous la barre. Rendu identique, comportement prévisible,
   et testable sans DOM réel.

3. **Le bouton « Rejouer l'ouverture » n'est pas embarqué.** C'est un outil de
   revue de maquette. L'animation d'ouverture, elle, est conservée.

**Tokens** — extraits des styles inline vers `src/styles/tokens.css` :
vert profond `#0B3A31`, or `#C9A961`, or clair `#D4A94C`, crème `#FBF7F0`,
sable `#CBB79A`, encre `#221D17`, plus l'échelle typographique. Petrona pour les
titres, Alegreya Sans pour le texte courant.

**Comportements**

- Accordéons : `<details>` / `<summary>` natifs. Zéro JS, clavier et lecteurs
  d'écran acquis.
- Animation d'ouverture (`src/scripts/intro.ts`) et CTA sticky
  (`src/scripts/sticky-cta.ts`) : ce sont les deux seuls scripts du site.
- `prefers-reduced-motion` : les 19 `@keyframes` du design sont placées sous media
  query. L'ouverture masque du contenu à l'état initial ; sans garde-fou elle est
  bloquante. En mouvement réduit, elle se réduit à un fondu et le contenu reste
  accessible.

**Images** — les 25 assets sources sont des PNG/JPG bruts. Ils passent par le
composant `<Image>` d'Astro : formats modernes et dimensions explicites pour
éviter le décalage de mise en page. C'est le principal levier de performance de
la page.

**SEO** — le design fournit déjà `<title>`, meta description, Open Graph et un
JSON-LD `MassageBusiness`. Ces éléments sont repris dans `Base.astro`, le JSON-LD
étant généré depuis `cabinet.yaml`.

## 6. Conformité

- **Aucune police externe.** Le `<link>` vers `fonts.googleapis.com` transfère
  l'IP du visiteur à Google sans base légale. Les polices sont servies depuis le
  domaine.
- **Analytics** : si la cliente en veut, Cloudflare Web Analytics, sans cookie,
  donc sans bandeau de consentement. Aucun script tiers n'est ajouté sans
  arbitrage explicite.
- **Mentions légales** : page dédiée, atteignable depuis le pied de page.
- **Aucune donnée personnelle collectée** : pas de formulaire, la conversion est
  un appel téléphonique. Le périmètre RGPD reste minimal par construction.

## 7. Déploiement

`wrangler.jsonc`, site statique multi-pages sans script Worker :

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

`not_found_handling` vaut `"404-page"` et non `"single-page-application"` : le
site est multi-pages, une URL inconnue doit répondre 404 et non servir l'accueil.
Ni `main` ni `binding` ne sont déclarés — `binding` n'est valide qu'avec un script
Worker.
Source : [workers/wrangler/configuration](https://developers.cloudflare.com/workers/wrangler/configuration/#assets).

Dépôt GitHub privé. CI GitHub Actions : `astro check`, lint, tests, build. Le
déploiement en production reste une action délibérée, jamais automatique sur push.

Le nom de domaine est à la charge de la cliente et reste à son nom, ainsi que le
compte Cloudflare. Un accès délégué est suffisant côté prestataire : la cliente ne
doit pas être captive de son prestataire pour reprendre son propre site.

## 8. Environnement Claude Code

`CLAUDE.md` ne contient que les deltas par rapport à `~/.claude/CLAUDE.md`, qui
porte déjà le ton, le doc-first, les conventions de code, les commits et le
workflow de livraison. Cible : moins de 200 lignes
([memory#write-effective-instructions](https://code.claude.com/docs/en/memory#write-effective-instructions)).
Contenu : commandes réelles du projet, la règle « le `.dc.html` est la source de
vérité visuelle, jamais du code à recopier », l'obligation de passer par
`lib/content.ts`, et l'interdiction de réintroduire des polices distantes.

`.claude/rules/astro.md`, scopé `paths: ["src/**/*.astro"]` : conventions de
composants, styles scopés, `prefers-reduced-motion` obligatoire. La règle ne se
charge que lorsqu'un fichier `.astro` est lu, donc sans coût de contexte le reste
du temps ([memory#path-specific-rules](https://code.claude.com/docs/en/memory#path-specific-rules)).

`.claude/settings.json` : `allow` sur les commandes de développement et de
vérification, `ask` sur `wrangler deploy`. Les règles de permission fusionnent
entre scopes plutôt que de s'écraser, le projet n'a donc que ses deltas à écrire
([settings#settings-precedence](https://code.claude.com/docs/en/settings#settings-precedence)).

**Trois absences délibérées**

- Pas de `.mcp.json` : context7 et les serveurs Cloudflare sont déjà déclarés au
  niveau utilisateur. Les redéclarer consommerait du contexte pour rien.
- Pas d'agents projet : `planner`, `implementer` et `code-reviewer` existent au
  niveau utilisateur avec leur `model` et leur `effort`. Aucun delta à apporter.
- Pas de hook Claude Code initial. Un hook se justifie quand une consigne doit
  s'exécuter à un moment fixe et qu'on constate qu'elle est omise. La garantie
  mécanique passe d'abord par git : un `pre-commit` qui lance `astro check` et le
  lint, rejoué en CI. Un hook sera ajouté si un oubli se répète.

## 9. Vérification

Sur un site vitrine, l'accessibilité et la performance ne sont pas des propriétés
annexes : elles sont le livrable. Elles se mesurent.

| Niveau | Outil | Portée |
|---|---|---|
| Types | `astro check` | Contenu typé, props de composants |
| Lint | ESLint | Zéro warning toléré |
| Unitaire | Vitest | Logique d'état du CTA sticky |
| Bout en bout | Playwright + axe | Zéro violation sur le HTML buildé |

Le CTA sticky est la seule logique JS non triviale, donc la seule qui justifie des
tests unitaires — c'est précisément ce que le passage au déclaratif rend testable.
Le reste du site est du HTML statique : le vérifier unitairement testerait Astro,
pas le projet.

Les animations sont vérifiées manuellement dans les deux états de
`prefers-reduced-motion`.

## 10. Décisions à confirmer avec la cliente

Ces points bloquent du contenu, pas de l'architecture. L'implémentation peut
démarrer sans eux.

1. Les avis clients sont-ils authentiques et publiables ? Sinon la section saute.
2. Veut-elle des statistiques de fréquentation ?
3. Adresse postale exacte pour le JSON-LD — le design ne donne que la commune.
4. Contenu des mentions légales : statut juridique, numéro SIRET, hébergeur,
   assurance professionnelle.
