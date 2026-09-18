import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { interactions } from '../a11y/interactions';
import { scanTargets } from '../a11y/targets';

// Playwright empties outputDir at the start of every run, so raw scans never go stale.
const rawResultsDir = join('test-results', 'a11y-raw');

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

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Write one raw axe-core result per scan, for `npm run report:md` / `report:html`.
 *
 * A state cannot be expressed as a URL, and the report generators group by the `url`
 * field, so the label carries the target name, the state and the viewport. Including
 * the real URL would make it undialable anyway, so the label stays plain text.
 */
function writeScanResult(label: string, results: unknown) {
  mkdirSync(rawResultsDir, { recursive: true });
  writeFileSync(
    join(rawResultsDir, `${slugify(label)}.json`),
    JSON.stringify({ url: label, results }, null, 2),
  );
}

for (const target of scanTargets) {
  test(target.name, async ({ page }, testInfo) => {
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

    // Written before the assertion below, so failing scans are reported too.
    writeScanResult(`${target.name} (${testInfo.project.name})`, results);

    expect(
      results.violations,
      `axe-core violations:\n${formatViolations(results.violations)}`,
    ).toEqual([]);
  });
}
