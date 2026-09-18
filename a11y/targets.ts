import type { StateName } from './interactions';

export type ScanTarget = {
  /** Test title. This is what you see in the report, so make it specific. */
  name: string;
  /** Path relative to baseURL, or an absolute URL. */
  path: string;
  /** Optional state from a11y/interactions.ts to apply before scanning. */
  state?: StateName;
  /**
   * Optional axe scoping. When set, only these subtrees get scanned.
   * Scoping reduces noise but can hide real issues outside the boundary.
   */
  include?: string[];
};

export const scanTargets: ScanTarget[] = [
  {
    name: 'Homepage',
    path: '/',
  },
  {
    name: 'Homepage, signup modal open',
    path: '/',
    state: 'openSignupModal',
    include: ['.modal-backdrop'],
  },
];
