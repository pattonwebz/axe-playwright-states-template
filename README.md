# axe-playwright-states

A template for scanning interactive page states with [axe-core](https://github.com/dequelabs/axe-core) and [Playwright](https://playwright.dev/).

Your page passes axe-core with zero violations. Then someone opens a modal, expands an accordion, or submits a form, and accessibility issues show up that the scan never flagged. That is not axe-core failing you, it is a state problem: axe-core only scans the DOM as it exists right now. To catch those issues you have to trigger the interaction before you scan.

This repo is the shareable version of the setup described in [Stop Missing Accessibility Bugs: Scan Page States with axe-core + Playwright](https://www.pattonwebz.com/tools-of-the-trade/stop-missing-accessibility-bugs-scan-page-states-with-axe-core-playwright/).

## Quick start

```bash
npm install
npx playwright install
npm test
```

**Expect one failing test on the first run.** That failure is the point of the template, and it is explained below.

## What the bundled demo proves

The repo ships a tiny example site (`examples/site/`) with two scan targets pointed at the *same URL*:

| Target | State | Result |
| --- | --- | --- |
| `Homepage` | default | passes |
| `Homepage, signup modal open` | `openSignupModal` | fails on `button-name` |

The modal's close button is empty and draws its icon with a CSS background image, so it has no accessible name. Scanning the page as-loaded never sees it, because the button only exists in the DOM once the modal is open. Same URL, two states, two different sets of results.

## The four pieces

The whole pattern is one list, one registry, one loop, and one runner.

**1. `a11y/targets.ts` — one list of pages, each optionally declaring a state.**

```ts
export const scanTargets: ScanTarget[] = [
  { name: 'Homepage', path: '/' },
  {
    name: 'Homepage, signup modal open',
    path: '/',
    state: 'openSignupModal',
    include: ['.modal-backdrop'],
  },
];
```

A state is just a name. There is no framework magic involved; it only has to map reliably to an interaction function.

**2. `a11y/interactions.ts` — a registry of named state interactions.**

```ts
export const interactions = {
  async openSignupModal(page: Page) {
    await page.getByRole('button', { name: 'Open signup' }).click();
    await page.locator('#signup-modal').waitFor({ state: 'visible' });
  },
} satisfies Record<string, Interaction>;
```

Playwright drives a real browser, so a state can be nearly anything a user can do: click, type, hover, tab, scroll, submit, resize.

**3. `tests/a11y.spec.ts` — the loop. It never changes when you add a state.**

```ts
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
    expect(results.violations).toEqual([]);
  });
}
```

Add a state to a target and forget to register the interaction, and the test fails at the `throw`. A missing interaction will not quietly pass when it should not.

**4. `playwright.config.ts` — the runner and viewports.**

Scans run against `desktop` (1280×800) and `mobile` (320×568) by default. Every target is scanned in both.

## Adding a state

1. Add the interaction to `a11y/interactions.ts`.
2. Add a target in `a11y/targets.ts` with `state: '<yourStateName>'`.
3. Run `npm test`.

`state` is typed against the keys of the registry, so a typo fails `npm run typecheck` rather than silently scanning the wrong thing.

## Pointing it at your own site

Set `A11Y_BASE_URL` and the bundled example server is skipped entirely.

```bash
A11Y_BASE_URL=https://example.com npm test
```

Then delete `examples/` and `scripts/serve-example.mjs`, and replace the demo entries in `a11y/targets.ts` with your own. The `webServer` block and the demo targets are the only things tied to the example.

Absolute URLs work too, in which case `path` is used as-is and `baseURL` is ignored.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `A11Y_BASE_URL` | `http://localhost:4173` | Site to scan. When set, the bundled example server is skipped. |
| `A11Y_CHANNEL` | unset | Drive an installed browser instead of the downloaded one, e.g. `chrome` or `msedge`. |
| `EXAMPLE_PORT` | `4173` | Port for the bundled example server. |

### When the browser will not install

`npx playwright install` downloads a Chromium build, and each Playwright release only publishes those builds for distros it still supports. Playwright 1.63 dropped Ubuntu 20.04, so on that release the download fails with `Playwright does not support chromium on ubuntu20.04-x64`. Either use a machine Playwright still publishes builds for, or point it at a browser you already have:

```bash
A11Y_CHANNEL=chrome npm test
```

## Conventions that keep this reliable

- **Name states by intent** (`openSignupModal`, not `step2`) so you can identify them in the code and in failures.
- **Wait for a stable post-interaction condition** before the interaction returns. The scan runs the moment it resolves.
- **Keep interactions deterministic.** Repeatable states are the only way to get repeatable tests.
- **Be careful with aggressive selector scoping.** `include` reduces noise, but it can hide real issues outside your include boundary. If an `include` selector matches nothing you silently scan nothing, so verify new selectors match before trusting a green run.
- **A green run is scoped to what you scanned.** It says the states you set up are clean of the issues axe can scan for. It says nothing about states you did not set up.

## Scripts

| Script | Description |
| --- | --- |
| `npm test` | Run every target on every viewport |
| `npm run test:headed` | Run with a visible browser |
| `npm run test:debug` | Playwright inspector |
| `npm run test:grep <pattern>` | Run targets whose title matches, e.g. `npm run test:grep modal` |
| `npm run report` | Open the last HTML report |
| `npm run typecheck` | Type-check without emitting |

## Project structure

```
axe-playwright-states/
├── a11y/
│   ├── targets.ts        # pages to scan, each with an optional state
│   └── interactions.ts   # named state interactions
├── tests/
│   └── a11y.spec.ts      # generic runner loop
├── examples/site/        # throwaway demo site (delete once you point at your own)
├── scripts/
│   └── serve-example.mjs # zero-dependency static server for the demo
├── playwright.config.ts
└── tsconfig.json
```

## Limitations

This is a sweep, not a guarantee. axe-core catches the automatable subset of WCAG 2.1 A and AA issues, and it can only catch them in states you have set up. It will not catch focus order, focus traps, keyboard operability, or whether your alt text actually describes the image. Treat a green run as one input, not a verdict.

## Related

[`@pattonwebz/axe-playwright`](https://github.com/pattonwebz/squads-general/tree/main/packages/axe-playwright) is a separate, config-driven CLI and library for scanning many pages and generating aggregated reports. This template is the Playwright-native, states-first counterpart.

## License

[MIT](./LICENSE)
