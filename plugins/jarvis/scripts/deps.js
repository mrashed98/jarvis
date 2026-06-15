import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

/** Pinned native installers (orchestrate-don't-vendor). Keep in sync with README + PROJECT.md. */
export const INSTALL_HINTS = {
  gstack:
    'git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup',
  gsd: 'npx @opengsd/gsd-core@latest',
  superpowers: 'claude plugin install superpowers@claude-plugins-official',
};

/** Detect which frameworks are installed under the given home dir. */
export function detectDeps(home = homedir()) {
  const claude = join(home, '.claude');
  return {
    gstack: existsSync(join(claude, 'skills', 'gstack')),
    gsd: existsSync(join(claude, 'gsd-core')),
    superpowers: existsSync(
      join(claude, 'plugins', 'cache', 'claude-plugins-official', 'superpowers'),
    ),
  };
}

/** Names of deps that are absent, given a presence map. */
export function missingDeps(present) {
  return Object.keys(INSTALL_HINTS).filter((k) => !present[k]);
}

/** Pair each missing dep with its pinned install one-liner. */
export function installHintsFor(missing) {
  return missing.map((dep) => ({ dep, hint: INSTALL_HINTS[dep] }));
}
