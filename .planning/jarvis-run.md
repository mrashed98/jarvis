# Jarvis run
request: Build a repo + npx orchestrator that installs Jarvis (generalized) as a CC plugin and bundles its deps (GSD, gstack, superpowers) in one command
current_phase: 3
next_action: BUILDING (superpowers TDD, inline). Slug=mrashed98/jarvis. Plan=.planning/IMPLEMENTATION-PLAN.md (8 tasks). Execute Tasks 1-8 RED->GREEN, then verification-before-completion, then Phase 4 (review/qa/doc/ship gate). Push deferred to ship gate.
artifacts:
  verdict: .planning/phase1-verdict.md
  spec: .planning/SPEC.md (+ PROJECT.md, DECISIONS.md)
  plan: .planning/IMPLEMENTATION-PLAN.md
  spec: pending
  plan: pending

## Locked decisions (pre-validation, from user)
- Bundling = ORCHESTRATOR npx CLI: `npx jarvis-dist install` calls each dep's NATIVE installer (claude plugin install superpowers; clone+link gstack; run GSD installer) then installs Jarvis. No vendoring.
- Jarvis = GENERALIZED (de-Gozmo): generic project-type detection, drop Gozmo design/Expo smoke specifics, parameterize paths.
- This project lives at ~/projects/jarvis-dist (NOT inside iLife; iLife has its own paused Jarvis run at phase 3).

## Ground truth (gathered Phase 1)
- superpowers: real CC plugin `superpowers@claude-plugins-official` v5.1.0 (native marketplace install)
- gstack: git repo github.com/garrytan/gstack, custom bin/ linker installer (NOT a plugin)
- GSD: custom scatter-installer (gsd-* skills + ~/.claude/gsd-core + hooks + migration journal/state); NOT a plugin
- jarvis: hand-rolled personal skill at ~/.claude/skills/jarvis (SKILL/DESIGN/PLAN/COMMANDS .md); Gozmo-hardcoded; unpublished
- Implication: native CC marketplace can only natively bundle plugins (today = superpowers only) -> orchestrator approach chosen.
