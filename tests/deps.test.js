import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  INSTALL_HINTS,
  detectDeps,
  missingDeps,
  installHintsFor,
} from '../plugins/jarvis/scripts/deps.js';

function fakeHome({ gstack = false, gsd = false, superpowers = false } = {}) {
  const home = mkdtempSync(join(tmpdir(), 'jarvis-home-'));
  if (gstack) mkdirSync(join(home, '.claude', 'skills', 'gstack'), { recursive: true });
  if (gsd) mkdirSync(join(home, '.claude', 'gsd-core'), { recursive: true });
  if (superpowers) {
    mkdirSync(
      join(home, '.claude', 'plugins', 'cache', 'claude-plugins-official', 'superpowers'),
      { recursive: true },
    );
  }
  return home;
}

test('detects all three deps present', () => {
  const home = fakeHome({ gstack: true, gsd: true, superpowers: true });
  assert.deepEqual(detectDeps(home), { gstack: true, gsd: true, superpowers: true });
});

test('detects all three deps missing in an empty home', () => {
  const home = fakeHome();
  assert.deepEqual(detectDeps(home), { gstack: false, gsd: false, superpowers: false });
});

test('missingDeps lists only the absent ones', () => {
  const present = { gstack: true, gsd: false, superpowers: false };
  assert.deepEqual(missingDeps(present).sort(), ['gsd', 'superpowers']);
});

test('installHintsFor returns the pinned one-liner per missing dep', () => {
  const hints = installHintsFor(['gsd']);
  assert.deepEqual(hints, [{ dep: 'gsd', hint: INSTALL_HINTS.gsd }]);
});

test('pinned hints match the locked installers', () => {
  assert.equal(
    INSTALL_HINTS.superpowers,
    'claude plugin install superpowers@claude-plugins-official',
  );
  assert.equal(INSTALL_HINTS.gsd, 'npx @opengsd/gsd-core@latest');
  assert.match(
    INSTALL_HINTS.gstack,
    /git clone .*garrytan\/gstack\.git .*\/\.claude\/skills\/gstack && cd .* && \.\/setup/,
  );
});
