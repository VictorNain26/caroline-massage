import { test, expect } from '@playwright/test';

// WCAG 2.1 SC 1.4.10 « Reflow » : le contenu doit se présenter sans exiger de
// défilement dans les deux dimensions, jusqu'à 320px de large. Aucune règle
// axe-core ne le vérifie — c'est une mesure de mise en page, pas un attribut.
// https://www.w3.org/WAI/WCAG21/Understanding/reflow.html
const largeurs = [320, 393, 768, 1280];

const pages = ['/', '/mentions-legales', '/politique-confidentialite', '/404'];

for (const largeur of largeurs) {
  test(`aucun débordement horizontal à ${largeur}px`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: 900 });

    for (const chemin of pages) {
      await page.goto(chemin);
      const mesure = await page.evaluate(() => {
        const racine = document.documentElement;
        return { scrollWidth: racine.scrollWidth, clientWidth: racine.clientWidth };
      });
      expect(mesure.scrollWidth, `débordement sur ${chemin}`).toBeLessThanOrEqual(
        mesure.clientWidth,
      );
    }
  });
}
