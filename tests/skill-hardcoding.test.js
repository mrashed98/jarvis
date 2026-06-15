import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skill = readFileSync(
  join(root, 'plugins/jarvis/skills/jarvis/SKILL.md'),
  'utf8',
);

const FORBIDDEN = [/gozmo/i, /\bexpo\b/i, /\bilife\b/i, /maestro/i, /expo export/i];

test('SKILL.md contains no project-specific (Gozmo/Expo/iLife) hardcoding', () => {
  for (const re of FORBIDDEN) {
    assert.ok(!re.test(skill), `forbidden token ${re} found in SKILL.md`);
  }
});

test('SKILL.md references the generic preflight script and the 4 phases', () => {
  assert.match(skill, /preflight\.js/);
  assert.match(skill, /Phase 1/);
  assert.match(skill, /Phase 4/);
  assert.match(skill, /CLAUDE_PLUGIN_ROOT/);
});
