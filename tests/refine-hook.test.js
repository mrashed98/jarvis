import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessPrompt, buildRefineContext } from '../plugins/jarvis/hooks/refine-check.js';

test('flags thin open-ended asks', () => {
  assert.equal(assessPrompt('build a card game').weak, true);
  assert.equal(assessPrompt('improve this').weak, true);
  assert.equal(assessPrompt('add dark mode').weak, true);
});

test('stays silent on detailed or clear prompts', () => {
  // Has a concrete file reference.
  assert.equal(assessPrompt('fix the login bug in auth.js').weak, false);
  // Long enough to carry detail.
  assert.equal(
    assessPrompt('build a card game with multiplayer and a scoreboard so players can compete').weak,
    false,
  );
  // No open-ended work verb — a clear imperative command.
  assert.equal(assessPrompt('run the tests').weak, false);
  assert.equal(assessPrompt('').weak, false);
});

test('buildRefineContext emits suggest-and-confirm guidance only when weak', () => {
  const out = buildRefineContext('build a dashboard');
  assert.equal(out.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
  assert.match(out.hookSpecificOutput.additionalContext, /confirm or correct/);
  assert.equal(buildRefineContext('run the tests'), null);
});
