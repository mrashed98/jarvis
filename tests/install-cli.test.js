import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, HELP, formatPlan, runPlan } from '../bin/jarvis-install.js';
import { planInstall } from '../plugins/jarvis/scripts/install-plan.js';

test('parseArgs reads --yes, --dry-run, --help and aliases', () => {
  assert.deepEqual(parseArgs(['--yes']), { yes: true, dryRun: false, help: false, unknown: null });
  assert.deepEqual(parseArgs(['-n']), { yes: false, dryRun: true, help: false, unknown: null });
  assert.deepEqual(parseArgs(['-h']), { yes: false, dryRun: false, help: true, unknown: null });
});

test('parseArgs flags an unknown argument', () => {
  assert.equal(parseArgs(['--bogus']).unknown, '--bogus');
});

test('HELP documents the command and flags', () => {
  assert.match(HELP, /npx github:mrashed98\/jarvis/);
  assert.match(HELP, /--yes/);
  assert.match(HELP, /--dry-run/);
});

test('formatPlan shows INSTALL for missing, skip for present, and the cmd', () => {
  const plan = planInstall({ jarvis: false, superpowers: true, gsd: true, gstack: true });
  const out = formatPlan(plan);
  assert.match(out, /INSTALL/);
  assert.match(out, /skip \(present\)/);
  assert.match(out, /claude plugin marketplace add mrashed98\/jarvis/);
});

test('formatPlan reports a clean no-op when everything is present', () => {
  const plan = planInstall({ jarvis: true, superpowers: true, gsd: true, gstack: true });
  assert.match(formatPlan(plan), /already installed/i);
});

test('runPlan executes only non-skipped steps, in order, via injected run', () => {
  const plan = planInstall({ jarvis: false, superpowers: true, gsd: false, gstack: true });
  const calls = [];
  const result = runPlan(plan, { run: (cmd) => calls.push(cmd) });
  assert.deepEqual(result.executed.map((e) => e.id), ['jarvis', 'gsd']);
  assert.equal(calls.length, 2);
  assert.match(calls[0], /mrashed98\/jarvis/);
  assert.match(calls[1], /@opengsd\/gsd-core/);
});

test('runPlan with dryRun executes nothing', () => {
  const plan = planInstall({ jarvis: false, superpowers: false, gsd: false, gstack: false });
  const calls = [];
  const result = runPlan(plan, { run: (cmd) => calls.push(cmd), dryRun: true });
  assert.equal(calls.length, 0);
  assert.equal(result.executed.every((e) => e.dryRun === true), true);
});
