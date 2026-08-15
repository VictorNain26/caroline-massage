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
