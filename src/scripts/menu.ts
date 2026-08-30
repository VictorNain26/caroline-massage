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
  // Le bouton qui a ouvert le panneau récupère le focus à la fermeture. Le
  // déduire de la mise en page ne marche pas : celui du hero reste « visible »
  // au sens CSS une fois défilé hors écran, et lui rendre le focus renvoyait
  // le visiteur en haut de la page.
  let declencheur = toggles[0];

  toggles.forEach((bouton) => {
    bouton.addEventListener('click', () => {
      declencheur = bouton;
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
    // `preventScroll` : le panneau se ferme là où on l'a ouvert, la page ne
    // doit pas bouger sous les pieds du visiteur.
    declencheur.focus({ preventScroll: true });
  });
}

// La barre de défilement et l'appel à l'action collant prennent la teinte du
// fond qu'ils traversent. La sonde lit la couleur calculée de la bande qui
// occupe le milieu de la fenêtre, plutôt qu'une liste d'identifiants tenue à
// la main : une section qui change de fond emmène les deux avec elle sans que
// rien ici n'ait à l'apprendre. C'est la méthode du design (`probeBg`), qui
// mesure la luminance du fond sous sa barre.
const bandes = [...document.querySelectorAll<HTMLElement>('main > *, footer')];

if (bandes.length > 0) {
  const racine = document.documentElement;
  const ctaCollant = document.querySelector<HTMLElement>('[data-cta-collant]');
  const contact = document.getElementById('contact');

  // Les sections soins et tarifs ne peignent rien : leur fond appartient au
  // bloc qui les enveloppe, comme dans le design. D'où la remontée.
  const fondDe = (element: HTMLElement): string | null => {
    let noeud: HTMLElement | null = element;
    while (noeud) {
      const couleur = getComputedStyle(noeud).backgroundColor;
      if (couleur && couleur !== 'transparent' && !couleur.endsWith(', 0)')) return couleur;
      noeud = noeud.parentElement;
    }
    return null;
  };

  // Le seuil de 110 sur 255 est celui du design. La formule est la luminance
  // relative pondérée, sans linéarisation : il ne s'agit pas de mesurer un
  // contraste mais de trancher entre deux teintes franches.
  const estSombre = (couleur: string): boolean => {
    const composantes = couleur.match(/[\d.]+/g);
    if (!composantes || composantes.length < 3) return false;
    const [rouge, vert, bleu] = composantes.slice(0, 3).map(Number);
    return 0.2126 * rouge + 0.7152 * vert + 0.0722 * bleu < 110;
  };

  // Deux hauteurs, deux réponses : la barre de défilement traverse tout
  // l'écran et suit donc la bande qui en occupe le milieu, tandis que l'appel
  // à l'action ne connaît que le fond posé sous lui. Les confondre le peignait
  // en clair au-dessus d'une section claire, dès que le milieu de l'écran
  // tombait sur la citation.
  const bandeA = (hauteur: number) =>
    bandes.find((element) => {
      const boite = element.getBoundingClientRect();
      return boite.top <= hauteur && boite.bottom > hauteur;
    });

  const teinte = (hauteur: number) => {
    const bande = bandeA(hauteur);
    const couleur = bande && fondDe(bande);
    return couleur && estSombre(couleur) ? 'sombre' : 'clair';
  };

  const sonder = () => {
    racine.dataset.fond = teinte(innerHeight / 2);

    if (!ctaCollant) return;

    // La place qu'il occupe une fois monté, et non celle qu'il occupe à
    // l'instant : au repos il est sous le bord de l'écran, où aucune bande ne
    // répond, et il serait entré avec la mauvaise teinte avant de se corriger
    // sous les yeux du visiteur. `offsetHeight` et la marge calculée ignorent
    // le `translateY` qui le tient en bas.
    const margeBas = parseFloat(getComputedStyle(ctaCollant).marginBottom) || 0;
    racine.dataset.fondBas = teinte(innerHeight - margeBas - ctaCollant.offsetHeight / 2);
    // Même seuil que le design : trois quarts de fenêtre, plancher à 300px.
    // Il s'efface dès que la section contact paraît — elle porte déjà les deux
    // mêmes boutons, en plus grand.
    const passeLeHero = scrollY > Math.max(innerHeight * 0.75, 300);
    const contactVisible = contact
      ? contact.getBoundingClientRect().top < innerHeight && contact.getBoundingClientRect().bottom > 0
      : false;
    ctaCollant.classList.toggle('visible', passeLeHero && !contactVisible);
  };

  addEventListener('scroll', sonder, { passive: true });
  addEventListener('resize', sonder);
  sonder();
}
