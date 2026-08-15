const preferenceReduite = matchMedia('(prefers-reduced-motion: reduce)');

if (!preferenceReduite.matches) {
  document.body.classList.add('intro-lancee');
}
