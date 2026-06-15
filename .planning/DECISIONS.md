# DECISIONS — jarvis-dist

Locked architecture decisions (Phase 1 validation + gates). Reversal requires an explicit note.

- **D1 — Distribution = native CC marketplace + local-subdir plugin.** The repo carries
  `.claude-plugin/marketplace.json` listing one plugin sourced from `./plugins/jarvis`.
  Install = `claude plugin marketplace add <owner>/<repo>` + `claude plugin install jarvis@<marketplace>`.
  *Why:* native, durable, zero custom install code for the core product.

- **D2 — Orchestrate, don't vendor.** Deps install via their own native installers; their code
  is never copied into this repo. *Why:* respects upstream licenses/updates, avoids drift and
  redistribution obligations.

- **D3 — v1 = prerequisite CHECK + hints, not bundling.** Jarvis detects whether gstack / GSD /
  superpowers are present and prints the exact install one-liner for any that are missing. It
  does NOT auto-install them in v1. *Why:* tests demand and avoids fragile multi-installer
  orchestration before it's proven wanted.

- **D4 — Jarvis generalized (de-Gozmo).** SKILL.md replaces Gozmo/Expo hardcoding with generic
  project-type detection and generic smoke checks. *Why:* "anyone" is the audience.

- **D5 — Wedge = plugin-first; npx orchestrator = layer 2.** `npx jarvis-dist install` (one
  command installs Jarvis + all 3 deps) is documented as a planned follow-on, built only after
  the plugin proves useful. *Why:* de-risks demand and the 3-installer fragility at once.

- **D6 — Isolation from iLife.** All work confined to `~/projects/jarvis-dist`; the session is
  rooted in iLife so every file op uses absolute jarvis-dist paths. *Why:* user constraint —
  iLife has its own active Jarvis run that must not be touched.

- **D7 — GSD spec authored directly (not via `/gsd-new-project`).** Because the session cwd is
  iLife and GSD's orchestrator is cwd-bound, the GSD-shaped artifacts were authored straight
  into jarvis-dist instead of firing the orchestrator. *Why:* guarantees iLife isolation. Full
  `/gsd-new-project` can be run later from a jarvis-dist-rooted session if deeper treatment is
  wanted.
