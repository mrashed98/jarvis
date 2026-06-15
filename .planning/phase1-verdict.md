# Phase 1 Verdict — jarvis-dist (validation board)

Lenses applied by Jarvis conductor (office-hours / CEO / eng). design-consultation: N/A (no UI).

## Office-hours (demand + wedge)

**The product is generalized Jarvis (the build-conductor), not the installer.** The npx
bundler is *delivery*, not value. If the conductor is good, packaging matters; if not,
wiring three installers together is busywork.

- **Q1 Demand reality:** Unproven externally. The honest audience today = people who've seen
  the author's Jarvis workflow and want the same multi-framework stack reproduced. Real
  pull (someone upset if it vanished) is not yet evidenced.
- **Q2 Status quo:** Today = 4 manual steps (`claude plugin install superpowers`; clone+setup
  gstack; run GSD installer; copy Jarvis skill). A one-command installer saves ~10 min once
  per machine. Marginal pain UNLESS the bundled-and-generalized Jarvis conductor is itself
  the draw.
- **Q4 Narrowest wedge (RECOMMENDED RESCOPE):** Ship generalized Jarvis as ONE Claude Code
  plugin in its own marketplace, with the 3 deps as *checked prerequisites + one-line install
  hints*. The `npx jarvis-dist install` orchestrator becomes a convenience layer on top,
  built only if people actually want all-in-one. This tests demand in a day instead of
  building a fragile 3-installer orchestrator first.
- **Q6 Future-fit:** Claude Code's native plugin/marketplace system is the durable substrate.
  Shelling out to 3 bespoke installers (clone+link gstack, GSD scatter-install) ages badly as
  their internals drift. Lean native where possible.

## CEO (scope / strategy)

- Don't lead with the mega-installer. Lead with the plugin; orchestrator is Phase 2 scope.
- Bundling claim must be framed as "Jarvis *orchestrates installation of* these independent
  tools," with attribution — not "Jarvis includes gstack/GSD." (Legal + honest.)

## Eng (feasibility)

- **Orchestrate-don't-vendor is the right call** (chosen). Calling each dep's public installer
  avoids redistributing others' code.
- **Fragility = 3 points of breakage, 3 update cadences, version skew.** Mitigate: pin
  known-good versions, make each dep step best-effort + idempotent with clear failure
  messages, never fail the whole install because one optional dep hiccupped.
- **Generalizing Jarvis is real work:** de-Gozmo the SKILL.md (generic project-type detection
  from package.json/lockfiles; drop Expo/RN + Gozmo Design steps; parameterize paths). This
  is the bulk of the build, not the installer.

## Bottom line

WORTH BUILDING — but reframe the wedge. Centerpiece = generalized Jarvis plugin + own
marketplace; deps as prerequisite-checks with install hints; npx orchestrator as an opt-in
convenience layer. This de-risks demand AND fragility at once.
