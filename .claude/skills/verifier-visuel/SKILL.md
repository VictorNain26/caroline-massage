---
name: verifier-visuel
description: Passer la page en revue dans Chrome — rendu responsive, focus, contrastes, mouvement réduit. À lancer avant un merge qui touche au CSS ou au markup, le projet n'ayant plus de test visuel automatisé.
---

# Vérification visuelle

Playwright et `@axe-core/playwright` ont été retirés : rien ne regarde la page à
chaque push. Cette revue est le seul filet, et elle ne se déclenche pas seule.

Lancer `pnpm dev`, ouvrir l'URL dans un onglet Chrome, garder la console
ouverte — une police ou une image qui échoue s'y voit alors qu'elle passe
inaperçue à l'écran.

## Largeurs

Reprendre les seuils dans les `@media` des composants touchés plutôt que de les
supposer, et prendre une capture à chacun : l'œil sur un seul écran laisse
passer les ruptures. Toujours inclure une largeur mobile étroite, la base dont
part tout le CSS.

À chaque largeur : pas de défilement horizontal, et le texte ne touche jamais
le bord de l'écran.

## Les pièges du projet

- **Le bouton de menu du hero doit rester cliquable.** L'enveloppe fixe qui le
  surplombe n'est neutralisée qu'en `pointer-events: none` tant que la barre
  n'est pas entrée. La régression a déjà eu lieu une fois.
- **L'anneau de focus change de teinte selon le fond** : `--or` sur le vert du
  hero, `--or-lien` sur le crème. Un anneau qui s'évanouit sur l'un des deux
  est le défaut à chercher.
- **Rien d'atteignable au clavier ne doit être invisible.** La barre solide
  masquée passe en `visibility: hidden` précisément pour sortir de l'ordre de
  tabulation ; `opacity: 0` seul l'y aurait laissée.

## Au clavier

Tabuler depuis le haut, sans souris. Le lien « Aller au contenu » apparaît au
premier `Tab` et mène bien au contenu ; chaque élément atteint montre un anneau
visible ; l'ordre de focus suit l'ordre visuel.

## Mouvement réduit

DevTools → Rendering → `prefers-reduced-motion: reduce`. Plus aucune animation,
et le défilement vers les ancres devient un saut sec qui fonctionne toujours.

## Conclure

Dire ce qui a été regardé et à quelles largeurs. Une revue dont on ignore la
couverture ne vaut pas mieux que pas de revue.
