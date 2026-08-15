import { surfaceCourante, type Surface } from '../lib/surface';

const barre = document.querySelector<HTMLElement>('[data-sticky-cta]');
const sections = document.querySelectorAll<HTMLElement>('[data-surface]');
const contact = document.querySelector<HTMLElement>('#contact');

if (barre && sections.length > 0) {
  const visibilite = new Map<Element, boolean>();

  // Bande d'observation resserrée sur la position de la barre, en bas de
  // viewport : rootMargin réduit la boîte englobante du root avant le test
  // d'intersection (MDN, IntersectionObserver.rootMargin), donc seule une
  // section dont une portion touche ce dernier dixième d'écran est retenue.
  const observateurSurface = new IntersectionObserver(
    (entrees) => {
      for (const entree of entrees) {
        visibilite.set(entree.target, entree.isIntersecting);
      }
      const etat = Array.from(sections).map((el) => ({
        surface: (el.dataset.surface as Surface) ?? 'light',
        visible: visibilite.get(el) ?? false,
      }));
      barre.dataset.sur = surfaceCourante(etat);
    },
    { rootMargin: '-90% 0px 0px 0px', threshold: 0 },
  );
  sections.forEach((section) => observateurSurface.observe(section));

  let contactVisible = false;
  let assezDefile = false;
  const appliquerVisibilite = () => {
    barre.dataset.visible = assezDefile && !contactVisible ? 'true' : 'false';
  };

  if (contact) {
    const observateurContact = new IntersectionObserver(
      ([entree]) => {
        contactVisible = entree.isIntersecting;
        appliquerVisibilite();
      },
      { threshold: 0 },
    );
    observateurContact.observe(contact);
  }

  const onScroll = () => {
    assezDefile = window.scrollY > window.innerHeight * 0.75;
    appliquerVisibilite();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
