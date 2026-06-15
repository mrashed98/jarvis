# Jarvis

A **build conductor** for Claude Code. Address it as "Jarvis" (e.g. *"Jarvis, I want to
build X"*) and it runs a gated pipeline — **validate → spec → build → ship** — by delegating
each phase to the framework that owns it. You stay in control: every phase ends at a 🛑 gate
that waits for your go-ahead.

Jarvis is the conductor. It does not reimplement the tools it calls; it orchestrates three
independent frameworks via their own installers.

## Install

Jarvis ships as a Claude Code plugin from its own marketplace:

```bash
claude plugin marketplace add mrashed98/jarvis
claude plugin install jarvis@jarvis
```

## Prerequisites

Jarvis orchestrates three tools. Install whichever you don't already have — Jarvis runs a
preflight at the start of each build and prints the exact command for any that are missing.

| Tool | Powers | Install |
|------|--------|---------|
| **superpowers** | the TDD build (Phase 3) | `claude plugin install superpowers@claude-plugins-official` |
| **GSD** | the spec artifact (Phase 2) | `npx @opengsd/gsd-core@latest` |
| **gstack** | validate / review / QA / ship (Phases 1 & 4) | `git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup` |

## How it works

1. **Phase 0 — Triage.** New build → full pipeline. One-off (debug, fix, ship) → routed to
   the single best skill, no pipeline.
2. **Phase 1 — Validate (gstack).** `/office-hours` → `/plan-ceo-review` → `/plan-eng-review`
   (+ `/design-consultation` only if there's a UI). 🛑 gate.
3. **Phase 2 — Spec (GSD).** `/gsd-new-project` (new repo) or `/gsd-spec-phase` (feature) writes
   the spec to `.planning/`. 🛑 gate.
4. **Phase 3 — Build (superpowers).** `writing-plans` → TDD execution (RED→GREEN) →
   `verification-before-completion`.
5. **Phase 4 — Review / QA / Doc / Ship (gstack + CI).** `/review` → a quick stack-aware smoke
   pre-flight → `/qa` → `/document-release` → 🛑 gate → `/ship`.

A run scratchpad at `<project>/.planning/jarvis-run.md` survives `/clear`, so you can stop at
any gate and later say **"Jarvis, resume"**.

## Attribution & licenses

Jarvis **orchestrates these independent tools via their own installers; it does not bundle or
redistribute their code.**

- **gstack** — © Garry Tan, MIT — https://github.com/garrytan/gstack
- **GSD** — `@opengsd/gsd-core` — https://github.com/open-gsd/gsd-core
- **superpowers** — © Jesse Vincent (obra), MIT — https://github.com/obra/superpowers

Jarvis itself is MIT licensed (see `LICENSE`).

## One-command install (npx)

Prefer to set up everything at once? This installs Jarvis (marketplace + plugin) **and** any
missing dependencies in a single command:

```bash
npx github:mrashed98/jarvis
```

It detects what you already have and installs only what's missing — so it's safe to re-run.
By default it shows the plan and asks before changing anything.

```bash
npx github:mrashed98/jarvis --dry-run   # print the plan, change nothing
npx github:mrashed98/jarvis --yes       # run without the confirmation prompt
```
