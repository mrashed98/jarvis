# SPEC — jarvis-dist v1 (the plugin + marketplace wedge)

## Goal

Anyone can install a generalized Jarvis build-conductor with native Claude Code plugin
commands, and Jarvis guides them to install its 3 framework dependencies.

## Deliverables (v1 scope)

1. **Repo skeleton**
   - `.claude-plugin/marketplace.json` — marketplace `jarvis`, one plugin entry sourced from
     `./plugins/jarvis` (local-subdir form, per the official schema).
   - `plugins/jarvis/.claude-plugin/plugin.json` — name `jarvis`, version, author, license,
     `skills: "./skills/"`.
   - `plugins/jarvis/skills/jarvis/SKILL.md` — the generalized conductor skill.
   - `README.md`, `LICENSE`, `.gitignore`.

2. **Generalized Jarvis SKILL.md** (de-Gozmo of the current personal skill)
   - Same 4-phase gated pipeline (validate → spec → build → ship) and gate discipline.
   - **Generic project-type detection**: infer stack from package.json / lockfiles / language
     manifests instead of assuming Expo/RN. Must handle at least: Node/TS, Python, and a
     generic git repo with no recognized stack (degrade gracefully).
   - **Generic Phase 4 smoke pre-flight**: run the project's own fast checks (typecheck +
     changed-scope tests) discovered from its scripts; drop Expo `export` and Gozmo Design
     handoff specifics.
   - **Parameterized paths**: no hardcoded Gozmo/iLife paths; operate on the active project.
   - Keep the run-scratchpad + Resume mechanism (works for any project).

3. **Dependency preflight** (inside the skill)
   - On pipeline start, detect presence of gstack (`~/.claude/skills/gstack`), GSD
     (`~/.claude/gsd-core` or gsd-* skills), superpowers (plugin/skills).
   - For each missing dep, print its pinned install one-liner (see PROJECT.md table). Do not
     auto-install. Phase steps that need a missing dep surface the hint and pause.

4. **README**
   - Install: `claude plugin marketplace add <owner>/<repo>` then `claude plugin install jarvis@jarvis-dist`.
   - The 3 prerequisite install one-liners.
   - Attribution + licenses for gstack (garrytan, MIT), GSD (@opengsd), superpowers (obra, MIT),
     framed as "Jarvis orchestrates these independent tools" — not redistribution.
   - A "Layer 2 (planned): `npx jarvis-dist install`" section describing the future one-command
     full-stack installer.

## Out of scope (v1 → deferred to layer 2)

- `npx jarvis-dist install` orchestrator that auto-runs all dep installers.
- Auto-installing or bundling any dependency's code.
- Non-Claude-Code hosts (Cursor/Codex plugin variants).

## Acceptance criteria

- [ ] `claude plugin marketplace add <owner>/<repo>` + `claude plugin install jarvis@jarvis-dist`
      installs the skill; "Jarvis, build X" triggers the conductor.
- [ ] `marketplace.json` and `plugin.json` are schema-valid (validate with `claude plugin`
      tooling if available).
- [ ] Generalized SKILL.md contains zero Gozmo/Expo/iLife hardcoding (grep clean).
- [ ] Project-type detection resolves correctly for a Node/TS repo, a Python repo, and a
      bare git repo (graceful fallback).
- [ ] Running the pipeline with a dep missing prints that dep's correct install one-liner.
- [ ] README documents marketplace install + 3 prerequisite one-liners + attribution/licenses
      + the layer-2 plan.

## Test approach (for Phase 3 / superpowers TDD)

- Unit-test the project-type detection and dep-presence/hint logic against fixture dirs
  (Node, Python, bare). These are the deterministic pieces worth RED→GREEN.
- Schema-validate the manifests in CI.
- The SKILL.md prose is validated by grep-for-hardcoding + a manual install smoke.

## Blocking inputs (needed before Phase 3 build)

- GitHub `<owner>/<repo>` slug for the marketplace path + README.
- Confirm `@opengsd/gsd-core` license permits the orchestration framing.
