import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8'));

test('marketplace.json has required fields and one plugin', () => {
  const m = readJson('.claude-plugin/marketplace.json');
  assert.equal(typeof m.name, 'string');
  assert.equal(typeof m.description, 'string');
  assert.ok(m.owner && typeof m.owner.name === 'string');
  assert.ok(Array.isArray(m.plugins) && m.plugins.length === 1);
});

test('marketplace plugin points at an existing local subdir', () => {
  const m = readJson('.claude-plugin/marketplace.json');
  const p = m.plugins[0];
  assert.equal(p.name, 'jarvis');
  assert.equal(typeof p.source, 'string');
  assert.ok(p.source.startsWith('./'));
  assert.ok(existsSync(join(root, p.source)), `plugin source ${p.source} must exist`);
});

test('plugin.json has required fields and matches marketplace name', () => {
  const m = readJson('.claude-plugin/marketplace.json');
  const pj = readJson('plugins/jarvis/.claude-plugin/plugin.json');
  assert.equal(pj.name, m.plugins[0].name);
  assert.equal(typeof pj.version, 'string');
  assert.equal(typeof pj.description, 'string');
  assert.equal(pj.skills, './skills/');
});

test('the declared skill directory exists with a SKILL.md', () => {
  assert.ok(existsSync(join(root, 'plugins/jarvis/skills/jarvis/SKILL.md')));
});
