import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { INSTALL_HINTS } from '../plugins/jarvis/scripts/deps.js';
import {
  INSTALL_STEPS,
  detectJarvis,
  planInstall,
} from '../plugins/jarvis/scripts/install-plan.js';

const ALL = ['jarvis', 'superpowers', 'gsd', 'gstack'];

test('INSTALL_STEPS are ordered jarvis, superpowers, gsd, gstack', () => {
  assert.deepEqual(INSTALL_STEPS.map((s) => s.id), ALL);
});

test('step commands reuse INSTALL_HINTS (deps) and the jarvis literal', () => {
  const byId = Object.fromEntries(INSTALL_STEPS.map((s) => [s.id, s.cmd]));
  assert.equal(byId.superpowers, INSTALL_HINTS.superpowers);
  assert.equal(byId.gsd, INSTALL_HINTS.gsd);
  assert.equal(byId.gstack, INSTALL_HINTS.gstack);
  assert.match(byId.jarvis, /claude plugin marketplace add mrashed98\/jarvis/);
  assert.match(byId.jarvis, /claude plugin install jarvis@jarvis/);
});

test('planInstall marks every step skip when all present', () => {
  const present = { jarvis: true, superpowers: true, gsd: true, gstack: true };
  assert.ok(planInstall(present).every((s) => s.skip === true));
});

test('planInstall marks only missing steps for install, with the right cmd', () => {
  const present = { jarvis: true, superpowers: true, gsd: false, gstack: true };
  const plan = planInstall(present);
  const gsd = plan.find((s) => s.id === 'gsd');
  assert.equal(gsd.skip, false);
  assert.equal(gsd.cmd, INSTALL_HINTS.gsd);
  assert.deepEqual(plan.filter((s) => !s.skip).map((s) => s.id), ['gsd']);
});

function fakeHome({ jarvisMarketplace = false } = {}) {
  const home = mkdtempSync(join(tmpdir(), 'jarvis-home-'));
  if (jarvisMarketplace) {
    const dir = join(home, '.claude', 'plugins');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'known_marketplaces.json'), JSON.stringify({ jarvis: {} }));
  }
  return home;
}

test('detectJarvis is true when the jarvis marketplace is known', () => {
  assert.equal(detectJarvis(fakeHome({ jarvisMarketplace: true })), true);
});

test('detectJarvis is false in an empty home', () => {
  assert.equal(detectJarvis(fakeHome()), false);
});
