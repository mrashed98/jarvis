# PROJECT — jarvis-dist

## What this is

A public distribution repo for **Jarvis**, a *generalized* build-conductor skill for Claude
Code. Jarvis sequences a gated pipeline — validate → spec → build → ship — by delegating each
phase to whichever framework owns it (gstack for validate/review/QA/ship, GSD for specs,
superpowers for TDD build). This repo packages Jarvis as a Claude Code **plugin** served from
its **own marketplace**, so anyone can install it with the native plugin commands.

## Core value

One install gets you an opinionated conductor that turns "I want to build X" into a
disciplined, gated pipeline across the best-in-class Claude Code frameworks — without you
wiring the handoffs yourself. The conductor is the product; packaging is delivery.

## Audience

Claude Code users who want a structured multi-framework build workflow. Not Gozmo-specific —
the current personal Jarvis is hardcoded to the author's Expo/RN + Gozmo Design setup; this
project generalizes it for any project type.

## The three orchestrated frameworks (dependencies)

| Framework | Role in Jarvis | Native installer (pinned for hints) |
|-----------|----------------|-------------------------------------|
| gstack (garrytan, MIT) | validate / review / QA / ship | `git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup` |
| GSD (@opengsd, open-gsd/gsd-core) | spec artifact | `npx @opengsd/gsd-core@latest` |
| superpowers (obra, MIT) | TDD build | `claude plugin install superpowers@claude-plugins-official` |

## Constraints

- **Orchestrate, don't vendor.** Do not copy/redistribute gstack, GSD, or superpowers code.
  Jarvis installs/uses them via their own native installers and attributes each.
- **v1 = plugin-first wedge.** Ship Jarvis-the-plugin + marketplace; deps are prerequisite
  CHECKS with install hints. The one-command `npx jarvis-dist install` orchestrator is a
  documented **layer-2** follow-on, not v1.
- **Isolation.** Lives at `~/projects/jarvis-dist`; must never read/write the author's iLife
  project (which has its own active Jarvis run).
- **Native substrate.** Distribution rides Claude Code's plugin/marketplace system
  (`.claude-plugin/marketplace.json` hosting a local-subdir plugin).

## Phase 1 verdict (carried in)

Worth building; wedge rescoped to plugin-first. See `.planning/phase1-verdict.md`.

## Open questions (resolve at spec gate)

- GitHub owner/repo slug for the marketplace path (`claude plugin marketplace add <owner>/<repo>`).
- GSD license terms — confirm the npm-published `@opengsd/gsd-core` permits this orchestration framing.
