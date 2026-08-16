import { defineConfig, devices } from '@playwright/test';

const port = 4321;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: 'tests/a11y',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'list' : 'line',

  // On sert le build par `wrangler dev`, pas par `astro preview`, pour deux
  // raisons. D'abord la justesse : wrangler applique `wrangler.jsonc`, donc le
  // routage d'assets réel de production — `not_found_handling: "404-page"` —
  // là où `astro preview` ne fait que l'approcher. Ensuite la fiabilité :
  // depuis Astro 7.2, `astro preview` se détache en démon dès qu'il détecte un
  // environnement agentique (`isRunByAgent()`, via CLAUDECODE), et Playwright
  // voit alors son processus « exited early ».
  //
  // Le build est dans la commande : `dist/` est un artefact, et le servir sans
  // le refaire ferait passer la suite au vert sur du code qui n'existe plus.
  // `reuseExistingServer: false` interdit de retomber sur un serveur déjà en
  // écoute, qui servirait précisément ce `dist/` périmé.
  webServer: {
    command: `pnpm build && pnpm exec wrangler dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },

  use: { baseURL },

  projects: [
    {
      name: 'bureau',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /axe\.spec\.ts/,
    },
    {
      // Le panneau de navigation et les ancres ne s'observent qu'en dessous de
      // 900px : au-dessus, `.bouton-menu` est en `display: none`.
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
