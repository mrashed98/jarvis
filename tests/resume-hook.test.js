import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildResumeContext } from '../plugins/jarvis/hooks/resume-check.js';

const RUN = `# Jarvis run
request: build a card game
current_phase: 2
next_action: review specs in .planning/, then approve gate
artifacts:
  verdict: .planning/phase1-verdict.md
  spec: pending
  plan: pending
`;

test('parses a real scratchpad into SessionStart context', () => {
  const out = buildResumeContext(RUN);
  assert.equal(out.hookSpecificOutput.hookEventName, 'SessionStart');
  const ctx = out.hookSpecificOutput.additionalContext;
  assert.match(ctx, /build a card game/);
  assert.match(ctx, /current_phase: 2/);
  assert.match(ctx, /review specs/);
  assert.match(ctx, /Resume section/);
});

test('stays silent when there is no run', () => {
  assert.equal(buildResumeContext(null), null);
  assert.equal(buildResumeContext(''), null);
  assert.equal(buildResumeContext('# unrelated notes\nfoo: bar\n'), null);
});

test('survives missing fields without throwing', () => {
  const out = buildResumeContext('request: just an idea\n');
  assert.match(out.hookSpecificOutput.additionalContext, /just an idea/);
  assert.match(out.hookSpecificOutput.additionalContext, /current_phase: \(unknown\)/);
});
