// Les avis défilent horizontalement en dessous de 900px ; les puces disent où
// l'on en est. Elles sont rendues côté serveur et restent justes sans ce
// script — seule leur mise à jour au défilement se joue ici.
const carrouselAvis = document.querySelector<HTMLElement>('.avis .liste');
const pucesAvis = document.querySelector<HTMLElement>('[data-avis-puces]');
if (carrouselAvis && pucesAvis) {
  const puces = [...pucesAvis.children];
  let derniereActive = 0;

  carrouselAvis.addEventListener(
    'scroll',
    () => {
      // Une carte occupe toute la largeur utile du carrousel : le rapport entre
      // le défilement et cette largeur donne directement son rang.
      const largeurCarte = carrouselAvis.scrollWidth / puces.length;
      const rang = Math.min(puces.length - 1, Math.round(carrouselAvis.scrollLeft / largeurCarte));
      if (rang === derniereActive) return;
      puces[derniereActive]?.classList.remove('actif');
      puces[rang]?.classList.add('actif');
      derniereActive = rang;
    },
    { passive: true },
  );
}

// Le rideau d'intro couvre l'écran ; tant qu'il est là, la page ne défile pas,
// sinon on devine le contenu glisser derrière lui. Le blocage est posé ici et
// non dans la feuille de style : si ce script ne s'exécute pas, la page reste
// défilable, alors qu'une règle CSS la figerait pour de bon. Sous
// `prefers-reduced-motion`, le rideau ne s'anime jamais et rien n'est bloqué.
const rideau = document.querySelector<HTMLElement>('.rideau');
if (rideau && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const racine = document.documentElement;
  const positionInitiale = racine.style.overflow;
  racine.style.overflow = 'hidden';

  const liberer = () => {
    racine.style.overflow = positionInitiale;
  };

  // Les entrées du hero durent moins longtemps que la pose du rideau : jouées
  // à l'ouverture de la page, elles seraient finies derrière lui et le hero
  // apparaîtrait déjà installé. Le design les relance quand la levée démarre
  // (`replayHeroAnims`), et `animationstart` tombe précisément à cet instant,
  // le délai étant déjà écoulé.
  rideau.addEventListener('animationstart', function surDebut(evenement) {
    if (evenement.target !== rideau) return;
    rideau.removeEventListener('animationstart', surDebut);
    document.querySelectorAll<HTMLElement>('[data-hero-anim]').forEach((element) => {
      element.getAnimations().forEach((animation) => {
        animation.cancel();
        animation.play();
      });
    });
  });

  // Seule la fin de `curtainLift`, portée par le rideau lui-même, compte :
  // `animationend` remonte aussi depuis la marque et le filet, qui terminent
  // bien avant lui — s'y fier rendait la page défilable pendant que le rideau
  // couvrait encore l'écran. Le délai n'est qu'un filet, au cas où l'animation
  // ne démarrerait pas du tout.
  rideau.addEventListener('animationend', function surFin(evenement) {
    if (evenement.target !== rideau) return;
    rideau.removeEventListener('animationend', surFin);
    liberer();
  });
  setTimeout(liberer, 5000);
}

// La barre crème redescend une fois le hero quitté. Le seuil est celui du
// design : 92% de la hauteur de fenêtre, avec un plancher de 300px pour les
// écrans très bas, où le hero occupe moins de place qu'on ne le croit.
const barreSolide = document.querySelector<HTMLElement>('[data-barre-solide]');
if (barreSolide?.closest('.entete--hero')) {
  const basculer = () => {
    const seuil = Math.max(innerHeight * 0.92, 300);
    barreSolide.classList.toggle('visible', scrollY > seuil);
  };
  addEventListener('scroll', basculer, { passive: true });
  basculer();
}

// Deux barres portent chacune leur bouton de menu sur l'accueil : celui du
// hero et celui de la barre crème. Un seul est visible à la fois, mais tous
// doivent ouvrir le panneau et refléter son état.
const toggles = [...document.querySelectorAll<HTMLButtonElement>('[data-nav-toggle]')];
const toggle = toggles[0];
const dialog = document.querySelector<HTMLDialogElement>('[data-nav-dialog]');
const closeButton = document.querySelector<HTMLButtonElement>('[data-nav-close]');

if (toggle && dialog && closeButton) {
  toggles.forEach((bouton) => {
    bouton.addEventListener('click', () => {
      dialog.showModal();
      toggles.forEach((autre) => {
        autre.setAttribute('aria-expanded', 'true');
        autre.setAttribute('aria-label', 'Fermer le menu');
      });
    });
  });

  // Refermer immédiatement escamoterait l'animation de sortie : le dialogue
  // reste ouvert le temps qu'elle se joue, `data-fermeture` la déclenchant.
  // Seule la fin de l'animation du panneau lui-même compte — celles de ses
  // entrées remontent aussi jusqu'ici et se terminent avant.
  const fermer = () => {
    if (dialog.dataset.fermeture !== undefined) return;
    if (!matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      dialog.close();
      return;
    }

    dialog.dataset.fermeture = '';
    dialog.addEventListener('animationend', function surFin(evenement) {
      if (evenement.target !== dialog) return;
      dialog.removeEventListener('animationend', surFin);
      delete dialog.dataset.fermeture;
      dialog.close();
    });
  };

  closeButton.addEventListener('click', fermer);

  dialog.querySelectorAll<HTMLAnchorElement>('a').forEach((lien) => {
    lien.addEventListener('click', fermer);
  });

  // Echap referme le dialogue sur-le-champ : on reprend la main pour qu'il
  // sorte comme les autres chemins, animation comprise.
  dialog.addEventListener('cancel', (evenement) => {
    evenement.preventDefault();
    fermer();
  });

  // `close` couvre aussi bien closeButton, les liens que la touche Echap
  // (le <dialog> natif ferme sur Echap et emet `close`, pas besoin de gerer
  // le clavier a la main).
  dialog.addEventListener('close', () => {
    toggles.forEach((bouton) => {
      bouton.setAttribute('aria-expanded', 'false');
      bouton.setAttribute('aria-label', 'Ouvrir le menu');
    });
    // Rendre le focus au bouton réellement à l'écran : selon qu'on a quitté le
    // hero ou non, ce n'est pas le même des deux. `visibility` plutôt que
    // `offsetParent`, qui reste renseigné sur un élément seulement masqué.
    const visible = toggles.find((bouton) => getComputedStyle(bouton).visibility !== 'hidden');
    (visible ?? toggle).focus();
  });
}
