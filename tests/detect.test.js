import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { detectProjectType } from '../plugins/jarvis/scripts/detect.js';

const here = dirname(fileURLToPath(import.meta.url));
const fx = (name) => join(here, 'fixtures', name);

test('detects a Node project from package.json', () => {
  assert.equal(detectProjectType(fx('node')), 'node');
});

test('detects a Python project from requirements.txt', () => {
  assert.equal(detectProjectType(fx('python')), 'python');
});

test('falls back to unknown for a bare directory', () => {
  assert.equal(detectProjectType(fx('bare')), 'unknown');
});
