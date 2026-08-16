import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = ['/', '/mentions-legales', '/politique-confidentialite', '/404'];

// Les quatre premiers tags sont ceux que la documentation Playwright désigne
// pour couvrir WCAG 2.0 et 2.1 niveaux A et AA
// (https://playwright.dev/docs/accessibility-testing#scanning-for-wcag-violations).
// `wcag22aa` s'y ajoute : c'est le tag documenté par axe-core pour WCAG 2.2 AA
// (https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#axe-core-tags),
// et il apporte la règle `target-size` (SC 2.5.8), qui est un critère du projet.
// Il n'existe pas de tag `wcag22a` dans axe-core 4.13.
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const chemin of pages) {
  test(`aucune violation d'accessibilité sur ${chemin}`, async ({ page }) => {
    const reponse = await page.goto(chemin);
    expect(reponse?.ok()).toBe(true);

    // Les règles de points de repère d'axe portent le tag `best-practice`, pas
    // un tag WCAG : elles ne sont pas dans le jeu ci-dessus. Le repère `main`
    // reste vérifié à la main plutôt que d'ouvrir la vanne des ~30 règles
    // `best-practice`.
    await expect(page.locator('main')).toHaveCount(1);

    const resultats = await new AxeBuilder({ page }).withTags(tags).analyze();

    expect(resultats.violations).toEqual([]);
  });
}

test("aucune violation d'accessibilité dans le panneau de navigation ouvert", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Le panneau n’existe qu’en dessous de 900px.');

  await page.goto('/');
  await page.locator('[data-nav-toggle]').click();
  await expect(page.locator('[data-nav-dialog]')).toBeVisible();

  const resultats = await new AxeBuilder({ page }).withTags(tags).analyze();

  expect(resultats.violations).toEqual([]);
});
