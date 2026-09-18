import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.A11Y_BASE_URL ?? 'http://localhost:4173';

// Set A11Y_CHANNEL=chrome to drive an already-installed browser rather than the
// one from `npx playwright install`. Useful on distros Playwright no longer
// publishes Chromium builds for, and for testing against real branded browsers.
const channel = process.env.A11Y_CHANNEL;

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    channel,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Mobile Chrome'], viewport: { width: 320, height: 568 } },
    },
  ],
  // The bundled example site is only served when A11Y_BASE_URL is unset, so
  // pointing the suite at your own site is a single environment variable.
  webServer: process.env.A11Y_BASE_URL
    ? undefined
    : {
        command: 'node scripts/serve-example.mjs',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
      },
});
