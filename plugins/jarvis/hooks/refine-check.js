#!/usr/bin/env node

// Open-ended verbs that imply substantial work, where vagueness actually hurts.
const VAGUE_VERBS =
  /\b(build|create|make|improve|fix|add|refactor|design|implement|optimi[sz]e|change|update|enhance|rework|clean\s*up)\b/i;

// Markers that a prompt already carries detail (constraints, rationale, files, format, numbers).
const SPECIFIC =
  /(\bso that\b|\bbecause\b|\busing\b|\bwith\b|\bformat\b|\bstep\b|\bsteps\b|```|\/|\.\w{1,4}\b|\d)/i;

const WORD_CEILING = 12; // ponytail: crude length gate; the model self-filters false positives downstream.

/**
 * Heuristic: is this prompt an open-ended ask thin enough to be worth refining?
 * Conservative by design — better to stay silent than nag on a clear request.
 * Pure, side-effect free.
 */
export function assessPrompt(text) {
  if (!text || !text.trim()) return { weak: false };
  const words = text.trim().split(/\s+/).length;
  const weak = VAGUE_VERBS.test(text) && words < WORD_CEILING && !SPECIFIC.test(text);
  return { weak };
}

/**
 * Build the UserPromptSubmit context payload, or null to stay silent.
 * Never rewrites the user's words — it nudges the model to suggest-and-confirm.
 */
export function buildRefineContext(text) {
  if (!assessPrompt(text).weak) return null;
  const ctx =
    'This request looks underspecified (short and open-ended). Before doing substantial ' +
    'work, briefly restate how you are interpreting it and propose a sharper version — the ' +
    'desired output/format, the key constraints, and the "why" behind it — then ask the user ' +
    'to confirm or correct. If they have actually given enough detail, just proceed. ' +
    'Do not nag on clear requests, and do not rewrite their wording silently.';
  return {
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: ctx,
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  let prompt = '';
  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed.prompt === 'string') prompt = parsed.prompt;
  } catch {
    // No/invalid stdin — nothing to assess.
  }
  const result = buildRefineContext(prompt);
  if (result) process.stdout.write(JSON.stringify(result));
}
