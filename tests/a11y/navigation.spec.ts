import { test, expect, type Locator } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('le panneau s’ouvre, se ferme à Échap et rend le focus au bouton', async ({ page }) => {
  const bouton = page.locator('[data-nav-toggle]');
  const panneau = page.locator('[data-nav-dialog]');
  const fermer = page.locator('[data-nav-close]');

  await expect(panneau).toBeHidden();
  await expect(bouton).toHaveAttribute('aria-expanded', 'false');

  await bouton.click();

  await expect(panneau).toBeVisible();
  await expect(bouton).toHaveAttribute('aria-expanded', 'true');
  await expect(bouton).toHaveAttribute('aria-label', 'Fermer le menu');
  // MDN, <dialog> § Accessibility : « When using HTMLDialogElement.showModal(),
  // focus is set on the first nested focusable element. » Ici `autofocus` sur le
  // bouton de fermeture désigne explicitement ce point d'entrée.
  await expect(fermer).toBeFocused();

  await page.keyboard.press('Escape');

  await expect(panneau).toBeHidden();
  await expect(bouton).toHaveAttribute('aria-expanded', 'false');
  await expect(bouton).toHaveAttribute('aria-label', 'Ouvrir le menu');
  await expect(bouton).toBeFocused();
});

test('le bouton de fermeture ferme le panneau et rend le focus', async ({ page }) => {
  const bouton = page.locator('[data-nav-toggle]');
  const panneau = page.locator('[data-nav-dialog]');

  await bouton.click();
  await expect(panneau).toBeVisible();

  await page.locator('[data-nav-close]').click();

  await expect(panneau).toBeHidden();
  await expect(bouton).toHaveAttribute('aria-expanded', 'false');
  await expect(bouton).toBeFocused();
});

// `touch-action: none` a été retiré de `.panneau` ; ce test vérifie la
// conséquence attendue — la liste de liens reste défilable au doigt quand elle
// déborde d'un écran court. Il échouerait si la déclaration revenait.
test('la liste de liens défile au toucher quand elle déborde', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 380 });
  await page.locator('[data-nav-toggle]').click();

  const liste = page.locator('[data-nav-dialog] nav');
  await expect(liste).toBeVisible();

  const debordement = await liste.evaluate(
    (el) => el.scrollHeight - el.clientHeight,
  );
  expect(debordement).toBeGreaterThan(0);

  await balayerVersLeHaut(page, liste);

  await expect
    .poll(() => liste.evaluate((el) => el.scrollTop), { timeout: 5_000 })
    .toBeGreaterThan(0);
});

async function balayerVersLeHaut(
  page: import('@playwright/test').Page,
  cible: Locator,
): Promise<void> {
  // Playwright n'expose que `touchscreen.tap()` ; un balayage réel passe par
  // Input.dispatchTouchEvent du protocole DevTools, seul chemin qui traverse la
  // pile d'entrée de Chromium et donc respecte `touch-action`.
  // https://playwright.dev/docs/api/class-cdpsession
  const cdp = await page.context().newCDPSession(page);
  const boite = await cible.boundingBox();
  if (!boite) throw new Error('La liste de liens n’a pas de boîte englobante.');

  const x = boite.x + boite.width / 2;
  const depart = boite.y + boite.height * 0.8;

  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y: depart }],
  });
  for (let pas = 1; pas <= 10; pas += 1) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: depart - pas * 10 }],
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}
