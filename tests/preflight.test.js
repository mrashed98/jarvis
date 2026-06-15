import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  buildPreflightReport,
  formatPreflightReport,
} from '../plugins/jarvis/scripts/preflight.js';

const here = dirname(fileURLToPath(import.meta.url));
const nodeFixture = join(here, 'fixtures', 'node');

test('report carries project type, presence map, missing list, and hints', () => {
  const home = mkdtempSync(join(tmpdir(), 'jarvis-home-'));
  const report = buildPreflightReport({ projectDir: nodeFixture, home });
  assert.equal(report.projectType, 'node');
  assert.deepEqual(report.present, { gstack: false, gsd: false, superpowers: false });
  assert.deepEqual(report.missing.sort(), ['gsd', 'gstack', 'superpowers']);
  assert.equal(report.hints.length, 3);
});

test('formatter prints each missing dep with its hint', () => {
  const home = mkdtempSync(join(tmpdir(), 'jarvis-home-'));
  const report = buildPreflightReport({ projectDir: nodeFixture, home });
  const out = formatPreflightReport(report);
  assert.match(out, /Project type: node/);
  assert.match(out, /npx @opengsd\/gsd-core@latest/);
  assert.match(out, /superpowers@claude-plugins-official/);
});
