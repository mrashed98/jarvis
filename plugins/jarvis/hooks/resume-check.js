#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIELDS = ['request', 'current_phase', 'next_action'];

/**
 * Build the SessionStart context payload from a jarvis-run.md scratchpad.
 * Returns null when there is no run to resume (so the hook stays silent).
 * Pure: reads nothing, executes nothing — just parses scalar fields and echoes them.
 */
export function buildResumeContext(scratchpad) {
  if (!scratchpad || !scratchpad.trim()) return null;

  const fields = {};
  for (const key of FIELDS) {
    // ponytail: flat `key: value` lines only — the scratchpad format is fixed in the skill.
    const m = scratchpad.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    if (m) fields[key] = m[1].trim();
  }
  if (!fields.request && fields.current_phase === undefined) return null;

  const ctx =
    'A Jarvis build-conductor run is already in progress in this project ' +
    '(.planning/jarvis-run.md).\n' +
    `  request: ${fields.request ?? '(unknown)'}\n` +
    `  current_phase: ${fields.current_phase ?? '(unknown)'}\n` +
    `  next_action: ${fields.next_action ?? '(unknown)'}\n` +
    'If the user asks to continue, follow the Jarvis skill\'s Resume section. ' +
    'Do not auto-start a phase — wait for the user.';

  return {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: ctx,
    },
  };
}

/** Read a scratchpad relative to a session cwd; null if absent/unreadable. */
function readScratchpad(cwd) {
  try {
    return readFileSync(join(cwd, '.planning', 'jarvis-run.md'), 'utf8');
  } catch {
    return null;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  let cwd = process.cwd();
  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed.cwd === 'string') cwd = parsed.cwd;
  } catch {
    // No/invalid stdin — fall back to process.cwd().
  }
  const result = buildResumeContext(readScratchpad(cwd));
  if (result) process.stdout.write(JSON.stringify(result));
}
