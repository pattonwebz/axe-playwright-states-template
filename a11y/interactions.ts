import type { Page } from '@playwright/test';

export type Interaction = (page: Page) => Promise<void>;

/**
 * Named states, one per UI state worth scanning.
 *
 * Each function must leave the page in a stable, repeatable state before it
 * resolves. The scan runs the moment it returns, so wait for the condition
 * that proves the state is ready rather than for a fixed delay.
 */
export const interactions = {
  async openSignupModal(page: Page) {
    await page.getByRole('button', { name: 'Open signup' }).click();
    await page.locator('#signup-modal').waitFor({ state: 'visible' });
  },
} satisfies Record<string, Interaction>;

export type StateName = keyof typeof interactions;
