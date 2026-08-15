const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
const dialog = document.querySelector<HTMLDialogElement>('[data-nav-dialog]');
const closeButton = document.querySelector<HTMLButtonElement>('[data-nav-close]');

if (toggle && dialog && closeButton) {
  toggle.addEventListener('click', () => {
    dialog.showModal();
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fermer le menu');
  });

  closeButton.addEventListener('click', () => {
    dialog.close();
  });

  dialog.querySelectorAll<HTMLAnchorElement>('a').forEach((lien) => {
    lien.addEventListener('click', () => dialog.close());
  });

  // `close` couvre aussi bien closeButton, les liens que la touche Echap
  // (le <dialog> natif ferme sur Echap et emet `close`, pas besoin de gerer
  // le clavier a la main).
  dialog.addEventListener('close', () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Ouvrir le menu');
    toggle.focus();
  });
}
