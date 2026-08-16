import { test, expect } from '@playwright/test';

// L'ordre est celui du DOM : la marque du panneau, puis les quatre liens, puis
// le bouton « Réserver ».
const ancres = ['/#hero', '/#soins', '/#parcours', '/#cabinet', '/#faq', '/#contact'];

test('le panneau ne contient pas d’autres ancres que celles testées', async ({ page }) => {
  await page.goto('/');
  const liens = await page
    .locator('[data-nav-dialog] a[href^="/#"]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute('href')));

  expect(liens).toEqual(ancres);
});

for (const href of ancres) {
  const identifiant = href.slice(2);

  test(`le titre de ${href} reste visible sous la barre collante`, async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-nav-toggle]').click();
    await page.locator(`[data-nav-dialog] a[href="${href}"]`).click();

    await expect(page.locator('[data-nav-dialog]')).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`#${identifiant}$`));

    const barre = await page.locator('header.entete .barre').boundingBox();
    const section = await page.locator(`#${identifiant}`).boundingBox();
    const titre = page.locator(`#${identifiant}`).locator('h1, h2').first();
    await expect(titre).toBeVisible();
    const boite = await titre.boundingBox();
    const hauteurVue = page.viewportSize()?.height;

    if (!barre || !section || !boite || !hauteurVue) throw new Error('Mesure impossible.');

    // La barre est collante en haut. On mesure le bord haut de la section, pas
    // seulement celui du titre : les sections ont un grand `padding-top`, et un
    // titre resterait visible alors même que le haut de la section — son filet,
    // son surtitre, son ornement — passerait derrière la barre. C'est ce bord
    // que `scroll-margin-top` protège.
    expect(section.y).toBeGreaterThanOrEqual(barre.y + barre.height);
    expect(boite.y).toBeGreaterThanOrEqual(barre.y + barre.height);
    expect(boite.y + boite.height).toBeLessThanOrEqual(hauteurVue);
  });
}
