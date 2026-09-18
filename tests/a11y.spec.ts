import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { interactions } from '../a11y/interactions';
import { scanTargets } from '../a11y/targets';

type Violation = {
  id: string;
  impact?: string | null;
  nodes: { target: (string | string[])[] }[];
};

function formatViolations(violations: Violation[]) {
  if (violations.length === 0) {
    return 'no violations';
  }

  return violations
    .map((violation) => {
      const targets = violation.nodes.map((node) => node.target.join(' ')).join(' | ');
      return `  ${violation.id} (${violation.impact ?? 'unknown'}) -> ${targets}`;
    })
    .join('\n');
}

for (const target of scanTargets) {
  test(target.name, async ({ page }) => {
    await page.goto(target.path, { waitUntil: 'networkidle' });

    if (target.state) {
      const runInteraction = interactions[target.state];

      if (!runInteraction) {
        throw new Error(`No interaction registered for state "${target.state}"`);
      }

      await runInteraction(page);
    }

    let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);

    for (const selector of target.include ?? []) {
      builder = builder.include(selector);
    }

    const results = await builder.analyze();

    expect(
      results.violations,
      `axe-core violations:\n${formatViolations(results.violations)}`,
    ).toEqual([]);
  });
}
