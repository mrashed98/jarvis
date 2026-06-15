import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { INSTALL_HINTS } from './deps.js';

/** Self-install command for the Jarvis marketplace + plugin. */
export const JARVIS_INSTALL =
  'claude plugin marketplace add mrashed98/jarvis && claude plugin install jarvis@jarvis';

/** Ordered install steps. Dep commands reuse INSTALL_HINTS to stay DRY. */
export const INSTALL_STEPS = [
  { id: 'jarvis', label: 'Jarvis (marketplace + plugin)', cmd: JARVIS_INSTALL },
  { id: 'superpowers', label: 'superpowers (TDD build)', cmd: INSTALL_HINTS.superpowers },
  { id: 'gsd', label: 'GSD (spec)', cmd: INSTALL_HINTS.gsd },
  { id: 'gstack', label: 'gstack (validate/review/QA/ship)', cmd: INSTALL_HINTS.gstack },
];

/** Detect whether the Jarvis marketplace/plugin is already present under home. */
export function detectJarvis(home = homedir()) {
  const plugins = join(home, '.claude', 'plugins');
  const known = join(plugins, 'known_marketplaces.json');
  if (existsSync(known)) {
    try {
      const j = JSON.parse(readFileSync(known, 'utf8'));
      if (Object.prototype.hasOwnProperty.call(j, 'jarvis')) return true;
    } catch {
      /* malformed file — fall through to cache check */
    }
  }
  return existsSync(join(plugins, 'cache', 'jarvis', 'jarvis'));
}

/** Pure: tag each step with skip=true when already present. */
export function planInstall(present) {
  return INSTALL_STEPS.map((s) => ({ ...s, skip: Boolean(present[s.id]) }));
}
