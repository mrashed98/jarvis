# Jarvis Distribution (jarvis-dist) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a generalized, de-Gozmo Jarvis build-conductor as a Claude Code plugin via its own marketplace repo (github mrashed98/jarvis), with a tested dependency-preflight that detects gstack/GSD/superpowers and prints pinned install one-liners.

**Architecture:** A marketplace repo with `.claude-plugin/marketplace.json` hosting one local-subdir plugin at `plugins/jarvis/`. The plugin carries the conductor `SKILL.md` plus small plain-JS modules in `plugins/jarvis/scripts/` (project-type detection + dependency preflight). The SKILL.md shells out to `node ${CLAUDE_PLUGIN_ROOT}/scripts/preflight.js`. Tests at repo root import those same modules. No npx orchestrator in v1 (layer 2).

**Tech Stack:** Plain JavaScript (ESM), Node built-in test runner (`node --test`) — no build step, no runtime deps. GitHub Actions for CI.

**Operating constraints (from DECISIONS.md):** All paths absolute under `/Users/c1ph3r/projects/jarvis-dist`. Session cwd is iLife — NEVER touch it. Orchestrate-don't-vendor: no upstream code copied. v1 = check+hint, not bundle.

---

## File Structure

- `package.json` — repo root; `type: module`, `test` script = `node --test`.
- `.gitignore` — node_modules, OS cruft.
- `.claude-plugin/marketplace.json` — marketplace `jarvis`, one plugin at `./plugins/jarvis`.
- `plugins/jarvis/.claude-plugin/plugin.json` — plugin manifest.
- `plugins/jarvis/skills/jarvis/SKILL.md` — generalized conductor skill.
- `plugins/jarvis/scripts/detect.js` — `detectProjectType(dir)`.
- `plugins/jarvis/scripts/deps.js` — `INSTALL_HINTS`, `detectDeps`, `missingDeps`, `installHintsFor`.
- `plugins/jarvis/scripts/preflight.js` — `buildPreflightReport`, formatter, CLI entry.
- `tests/detect.test.js` — project-type detection.
- `tests/deps.test.js` — dependency presence + hints.
- `tests/preflight.test.js` — report assembly.
- `tests/manifests.test.js` — manifest schema/shape validation.
- `tests/skill-hardcoding.test.js` — grep SKILL.md for forbidden Gozmo/Expo/iLife tokens.
- `tests/fixtures/{node,python,bare}/` — fixture project dirs.
- `README.md`, `LICENSE` — install instructions + attribution; MIT.
- `.github/workflows/ci.yml` — node test + manifest validate + hardcoding grep.

---

## Task 1: Repo scaffold + test tooling

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "jarvis-dist",
  "version": "0.1.0",
  "description": "Marketplace + plugin for the Jarvis build-conductor",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "node --test",
    "validate:manifests": "node --test tests/manifests.test.js"
  },
  "license": "MIT"
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
.DS_Store
*.log
```

- [ ] **Step 3: Verify the test runner runs (no tests yet = pass with 0)**

Run: `cd /Users/c1ph3r/projects/jarvis-dist && npm test`
Expected: exits 0, "tests 0" (or "no test files" — acceptable).

- [ ] **Step 4: Commit**

```bash
cd /Users/c1ph3r/projects/jarvis-dist && git add package.json .gitignore && git commit -m "chore: scaffold repo + node test runner"
```

---

## Task 2: Project-type detection (TDD)

**Files:**
- Test: `tests/detect.test.js`
- Create fixtures: `tests/fixtures/node/package.json`, `tests/fixtures/python/requirements.txt`, `tests/fixtures/bare/.gitkeep`
- Create: `plugins/jarvis/scripts/detect.js`

- [ ] **Step 1: Create fixtures**

```bash
cd /Users/c1ph3r/projects/jarvis-dist
mkdir -p tests/fixtures/node tests/fixtures/python tests/fixtures/bare
printf '{"name":"fixture-node"}\n' > tests/fixtures/node/package.json
printf 'requests==2.31.0\n' > tests/fixtures/python/requirements.txt
: > tests/fixtures/bare/.gitkeep
```

- [ ] **Step 2: Write the failing test** — `tests/detect.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { detectProjectType } from '../plugins/jarvis/scripts/detect.js';

const here = dirname(fileURLToPath(import.meta.url));
const fx = (name) => join(here, 'fixtures', name);

test('detects a Node project from package.json', () => {
  assert.equal(detectProjectType(fx('node')), 'node');
});

test('detects a Python project from requirements.txt', () => {
  assert.equal(detectProjectType(fx('python')), 'python');
});

test('falls back to unknown for a bare directory', () => {
  assert.equal(detectProjectType(fx('bare')), 'unknown');
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd /Users/c1ph3r/projects/jarvis-dist && node --test tests/detect.test.js`
Expected: FAIL — cannot find module `../plugins/jarvis/scripts/detect.js`.

- [ ] **Step 4: Write minimal implementation** — `plugins/jarvis/scripts/detect.js`

```js
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Infer a project's stack from manifest files. Generic — no framework
 * assumptions. Returns 'node' | 'python' | 'unknown'.
 */
export function detectProjectType(dir) {
  if (existsSync(join(dir, 'package.json'))) return 'node';
  if (
    existsSync(join(dir, 'pyproject.toml')) ||
    existsSync(join(dir, 'requirements.txt')) ||
    existsSync(join(dir, 'setup.py'))
  ) {
    return 'python';
  }
  return 'unknown';
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /Users/c1ph3r/projects/jarvis-dist && node --test tests/detect.test.js`
Expected: PASS — 3 tests.

- [ ] **Step 6: Commit**

```bash
cd /Users/c1ph3r/projects/jarvis-dist && git add plugins/jarvis/scripts/detect.js tests/detect.test.js tests/fixtures && git commit -m "feat: generic project-type detection"
```

---

## Task 3: Dependency presence detection + install hints (TDD)

**Files:**
- Test: `tests/deps.test.js`
- Create: `plugins/jarvis/scripts/deps.js`

- [ ] **Step 1: Write the failing test** — `tests/deps.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  INSTALL_HINTS,
  detectDeps,
  missingDeps,
  installHintsFor,
} from '../plugins/jarvis/scripts/deps.js';

function fakeHome({ gstack = false, gsd = false, superpowers = false } = {}) {
  const home = mkdtempSync(join(tmpdir(), 'jarvis-home-'));
  if (gstack) mkdirSync(join(home, '.claude', 'skills', 'gstack'), { recursive: true });
  if (gsd) mkdirSync(join(home, '.claude', 'gsd-core'), { recursive: true });
  if (superpowers) {
    mkdirSync(
      join(home, '.claude', 'plugins', 'cache', 'claude-plugins-official', 'superpowers'),
      { recursive: true },
    );
  }
  return home;
}

test('detects all three deps present', () => {
  const home = fakeHome({ gstack: true, gsd: true, superpowers: true });
  assert.deepEqual(detectDeps(home), { gstack: true, gsd: true, superpowers: true });
});

test('detects all three deps missing in an empty home', () => {
  const home = fakeHome();
  assert.deepEqual(detectDeps(home), { gstack: false, gsd: false, superpowers: false });
});

test('missingDeps lists only the absent ones', () => {
  const present = { gstack: true, gsd: false, superpowers: false };
  assert.deepEqual(missingDeps(present).sort(), ['gsd', 'superpowers']);
});

test('installHintsFor returns the pinned one-liner per missing dep', () => {
  const hints = installHintsFor(['gsd']);
  assert.deepEqual(hints, [{ dep: 'gsd', hint: INSTALL_HINTS.gsd }]);
});

test('pinned hints match the locked installers', () => {
  assert.equal(INSTALL_HINTS.superpowers, 'claude plugin install superpowers@claude-plugins-official');
  assert.equal(INSTALL_HINTS.gsd, 'npx @opengsd/gsd-core@latest');
  assert.match(INSTALL_HINTS.gstack, /git clone .*garrytan\/gstack\.git .*\/\.claude\/skills\/gstack && cd .* && \.\/setup/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/c1ph3r/projects/jarvis-dist && node --test tests/deps.test.js`
Expected: FAIL — cannot find module `deps.js`.

- [ ] **Step 3: Write minimal implementation** — `plugins/jarvis/scripts/deps.js`

```js
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

/** Pinned native installers (orchestrate-don't-vendor). Keep in sync with README + PROJECT.md. */
export const INSTALL_HINTS = {
  gstack:
    'git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup',
  gsd: 'npx @opengsd/gsd-core@latest',
  superpowers: 'claude plugin install superpowers@claude-plugins-official',
};

/** Detect which frameworks are installed under the given home dir. */
export function detectDeps(home = homedir()) {
  const claude = join(home, '.claude');
  return {
    gstack: existsSync(join(claude, 'skills', 'gstack')),
    gsd: existsSync(join(claude, 'gsd-core')),
    superpowers: existsSync(
      join(claude, 'plugins', 'cache', 'claude-plugins-official', 'superpowers'),
    ),
  };
}

/** Names of deps that are absent, given a presence map. */
export function missingDeps(present) {
  return Object.keys(INSTALL_HINTS).filter((k) => !present[k]);
}

/** Pair each missing dep with its pinned install one-liner. */
export function installHintsFor(missing) {
  return missing.map((dep) => ({ dep, hint: INSTALL_HINTS[dep] }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/c1ph3r/projects/jarvis-dist && node --test tests/deps.test.js`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/c1ph3r/projects/jarvis-dist && git add plugins/jarvis/scripts/deps.js tests/deps.test.js && git commit -m "feat: dependency presence detection + pinned install hints"
```

---

## Task 4: Preflight report assembly + CLI (TDD)

**Files:**
- Test: `tests/preflight.test.js`
- Create: `plugins/jarvis/scripts/preflight.js`

- [ ] **Step 1: Write the failing test** — `tests/preflight.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildPreflightReport, formatPreflightReport } from '../plugins/jarvis/scripts/preflight.js';

const here = dirname(fileURLToPath(import.meta.url));
const nodeFixture = join(here, 'fixtures', 'node');

test('report carries project type, presence map, missing list, and hints', () => {
  const home = mkdtempSync(join(tmpdir(), 'jarvis-home-'));
  const report = buildPreflightReport({ projectDir: nodeFixture, home });
  assert.equal(report.projectType, 'node');
  assert.deepEqual(report.present, { gstack: false, gsd: false, superpowers: false });
  assert.deepEqual(report.missing.sort(), ['gsd', 'gstack', 'superpowers']);
  assert.equal(report.hints.length, 3);
});

test('formatter prints each missing dep with its hint', () => {
  const home = mkdtempSync(join(tmpdir(), 'jarvis-home-'));
  const report = buildPreflightReport({ projectDir: nodeFixture, home });
  const out = formatPreflightReport(report);
  assert.match(out, /Project type: node/);
  assert.match(out, /npx @opengsd\/gsd-core@latest/);
  assert.match(out, /superpowers@claude-plugins-official/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/c1ph3r/projects/jarvis-dist && node --test tests/preflight.test.js`
Expected: FAIL — cannot find module `preflight.js`.

- [ ] **Step 3: Write minimal implementation** — `plugins/jarvis/scripts/preflight.js`

```js
#!/usr/bin/env node
import { detectProjectType } from './detect.js';
import { detectDeps, missingDeps, installHintsFor } from './deps.js';

/** Assemble the full preflight report for a project + home dir. */
export function buildPreflightReport({ projectDir = process.cwd(), home } = {}) {
  const projectType = detectProjectType(projectDir);
  const present = detectDeps(home);
  const missing = missingDeps(present);
  const hints = installHintsFor(missing);
  return { projectType, present, missing, hints };
}

/** Render the report as human-readable lines for the SKILL preflight. */
export function formatPreflightReport(report) {
  const lines = [`Project type: ${report.projectType}`];
  for (const [dep, ok] of Object.entries(report.present)) {
    lines.push(`  ${ok ? 'OK ' : 'MISSING'} ${dep}`);
  }
  if (report.hints.length) {
    lines.push('', 'Install missing dependencies:');
    for (const { dep, hint } of report.hints) lines.push(`  ${dep}: ${hint}`);
  }
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(formatPreflightReport(buildPreflightReport()));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/c1ph3r/projects/jarvis-dist && node --test tests/preflight.test.js`
Expected: PASS — 2 tests.

- [ ] **Step 5: Smoke the CLI**

Run: `cd /Users/c1ph3r/projects/jarvis-dist && node plugins/jarvis/scripts/preflight.js`
Expected: prints "Project type: ..." and dep statuses (gstack/gsd/superpowers likely OK on this machine).

- [ ] **Step 6: Commit**

```bash
cd /Users/c1ph3r/projects/jarvis-dist && git add plugins/jarvis/scripts/preflight.js tests/preflight.test.js && git commit -m "feat: preflight report assembly + CLI entry"
```

---

## Task 5: Plugin + marketplace manifests (TDD on shape)

**Files:**
- Create: `.claude-plugin/marketplace.json`
- Create: `plugins/jarvis/.claude-plugin/plugin.json`
- Test: `tests/manifests.test.js`

- [ ] **Step 1: Write the failing test** — `tests/manifests.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8'));

test('marketplace.json has required fields and one plugin', () => {
  const m = readJson('.claude-plugin/marketplace.json');
  assert.equal(typeof m.name, 'string');
  assert.equal(typeof m.description, 'string');
  assert.ok(m.owner && typeof m.owner.name === 'string');
  assert.ok(Array.isArray(m.plugins) && m.plugins.length === 1);
});

test('marketplace plugin points at an existing local subdir', () => {
  const m = readJson('.claude-plugin/marketplace.json');
  const p = m.plugins[0];
  assert.equal(p.name, 'jarvis');
  assert.equal(typeof p.source, 'string');
  assert.ok(p.source.startsWith('./'));
  assert.ok(existsSync(join(root, p.source)), `plugin source ${p.source} must exist`);
});

test('plugin.json has required fields and matches marketplace name', () => {
  const m = readJson('.claude-plugin/marketplace.json');
  const pj = readJson('plugins/jarvis/.claude-plugin/plugin.json');
  assert.equal(pj.name, m.plugins[0].name);
  assert.equal(typeof pj.version, 'string');
  assert.equal(typeof pj.description, 'string');
  assert.equal(pj.skills, './skills/');
});

test('the declared skill directory exists with a SKILL.md', () => {
  assert.ok(existsSync(join(root, 'plugins/jarvis/skills/jarvis/SKILL.md')));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/c1ph3r/projects/jarvis-dist && node --test tests/manifests.test.js`
Expected: FAIL — files do not exist yet.

- [ ] **Step 3: Create `.claude-plugin/marketplace.json`**

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "jarvis",
  "description": "Jarvis — a generalized build-conductor for Claude Code that sequences validate, spec, build, and ship across gstack, GSD, and superpowers.",
  "owner": { "name": "mrashed98" },
  "plugins": [
    {
      "name": "jarvis",
      "description": "Personal build conductor: a gated validate, spec, build, ship pipeline across gstack, GSD, and superpowers.",
      "author": { "name": "mrashed98" },
      "category": "workflow",
      "source": "./plugins/jarvis",
      "homepage": "https://github.com/mrashed98/jarvis"
    }
  ]
}
```

- [ ] **Step 4: Create `plugins/jarvis/.claude-plugin/plugin.json`**

```json
{
  "name": "jarvis",
  "description": "Build conductor for Claude Code — sequences gstack (validate/review/QA/ship), GSD (spec), and superpowers (TDD build) into one gated pipeline.",
  "version": "0.1.0",
  "author": { "name": "mrashed98" },
  "homepage": "https://github.com/mrashed98/jarvis",
  "repository": "https://github.com/mrashed98/jarvis",
  "license": "MIT",
  "keywords": ["workflow", "orchestration", "conductor", "gsd", "gstack", "superpowers"],
  "skills": "./skills/"
}
```

- [ ] **Step 5: Create a placeholder skill file so the manifest test's last assertion can pass**

```bash
cd /Users/c1ph3r/projects/jarvis-dist
mkdir -p plugins/jarvis/skills/jarvis
printf -- '---\nname: jarvis\ndescription: placeholder, replaced in Task 6\n---\nplaceholder\n' > plugins/jarvis/skills/jarvis/SKILL.md
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd /Users/c1ph3r/projects/jarvis-dist && node --test tests/manifests.test.js`
Expected: PASS — 4 tests.

- [ ] **Step 7: Commit**

```bash
cd /Users/c1ph3r/projects/jarvis-dist && git add .claude-plugin/marketplace.json plugins/jarvis/.claude-plugin/plugin.json plugins/jarvis/skills/jarvis/SKILL.md tests/manifests.test.js && git commit -m "feat: marketplace + plugin manifests with shape tests"
```

---

## Task 6: Generalized (de-Gozmo) Jarvis SKILL.md + hardcoding guard (TDD)

**Files:**
- Test: `tests/skill-hardcoding.test.js`
- Modify: `plugins/jarvis/skills/jarvis/SKILL.md` (replace placeholder)

- [ ] **Step 1: Write the failing test** — `tests/skill-hardcoding.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skill = readFileSync(
  join(root, 'plugins/jarvis/skills/jarvis/SKILL.md'),
  'utf8',
);

const FORBIDDEN = [/gozmo/i, /\bexpo\b/i, /\bilife\b/i, /maestro/i, /expo export/i];

test('SKILL.md contains no project-specific (Gozmo/Expo/iLife) hardcoding', () => {
  for (const re of FORBIDDEN) {
    assert.ok(!re.test(skill), `forbidden token ${re} found in SKILL.md`);
  }
});

test('SKILL.md references the generic preflight script and the 4 phases', () => {
  assert.match(skill, /preflight\.js/);
  assert.match(skill, /Phase 1/);
  assert.match(skill, /Phase 4/);
  assert.match(skill, /CLAUDE_PLUGIN_ROOT/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/c1ph3r/projects/jarvis-dist && node --test tests/skill-hardcoding.test.js`
Expected: FAIL — placeholder SKILL.md lacks the required references (and the manifest placeholder is fine).

- [ ] **Step 3: Write the generalized SKILL.md** (replace placeholder)

Write `plugins/jarvis/skills/jarvis/SKILL.md` with the full generalized conductor. Required content (engineer must include all of it):
- YAML frontmatter: `name: jarvis`, a `description` covering "build conductor / sequences validate→spec→build→ship across gstack, GSD, superpowers; trigger when addressed as 'Jarvis'".
- **Activation** section: trigger on "Jarvis," prefix; "resume" routes to Resume.
- **The overlap rule**: gstack validates/reviews; GSD owns the spec; superpowers owns the plan+code. Each phase consumes the previous artifact. Inside the pipeline do NOT re-run superpowers brainstorming and do NOT run GSD's own build/ship skills.
- **Dependency preflight** section: at pipeline start run
  `node "${CLAUDE_PLUGIN_ROOT}/scripts/preflight.js"`; for any dep reported MISSING, surface its printed install one-liner and pause that phase until installed.
- **Run state**: scratchpad at `<active-project>/.planning/jarvis-run.md` with `request`, `current_phase`, `next_action`, `artifacts`. (Keep the exact shape so Resume parses it.)
- **Resume** section.
- **Phase 0 — Intent triage**: new build vs one-off routing.
- **Phase 1 — Validate (gstack)**: office-hours → plan-ceo-review → plan-eng-review → (design-consultation only if the change has a UI). Summarize verdict; 🛑 GATE.
- **Phase 2 — Spec (GSD)**: brand-new standalone → /gsd-new-project; feature in current repo → /gsd-spec-phase. 🛑 GATE.
- **Phase 3 — Build (Superpowers)**: writing-plans → subagent-driven-development/executing-plans with test-driven-development, finish with verification-before-completion.
- **Phase 4 — Review/QA/Doc/Ship (gstack + CI)**: /review → generic smoke pre-flight → /qa → /document-release → 🛑 GATE → /ship.
- **Generic smoke pre-flight (de-Gozmo)**: detect project type via the preflight script; run THAT project's own fast checks discovered from its manifest/scripts — e.g. Node: `npm run typecheck` (if present) + changed-scope tests (`npx jest --onlyChanged` or the repo's test script); Python: `ruff`/`mypy` if configured + `pytest` on changed scope; unknown: state that no smoke command was detected and ask the user. NO `expo export`, NO Gozmo Design handoff. Let the project's own CI be the authoritative gate.
- **Gate discipline**: never advance past 🛑 without explicit approval; update scratchpad before pausing; offer "reply go" or "/clear then 'Jarvis, resume'".
- **Command-name fallback**: gstack commands are unprefixed slash commands; if not found, look under the gstack skills dir.

CONSTRAINT: do NOT include the strings "Gozmo", "Expo", "expo export", "iLife", or "maestro" anywhere. Must include literally: `preflight.js`, `CLAUDE_PLUGIN_ROOT`, `Phase 1`, `Phase 4`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/c1ph3r/projects/jarvis-dist && node --test tests/skill-hardcoding.test.js`
Expected: PASS — 2 tests.

- [ ] **Step 5: Run the FULL suite**

Run: `cd /Users/c1ph3r/projects/jarvis-dist && npm test`
Expected: PASS — all tests across all files.

- [ ] **Step 6: Commit**

```bash
cd /Users/c1ph3r/projects/jarvis-dist && git add plugins/jarvis/skills/jarvis/SKILL.md tests/skill-hardcoding.test.js && git commit -m "feat: generalized de-Gozmo Jarvis conductor skill"
```

---

## Task 7: README + LICENSE (attribution)

**Files:**
- Create: `README.md`
- Create: `LICENSE`

- [ ] **Step 1: Create `LICENSE`** (MIT, holder "mrashed98", year 2026).

- [ ] **Step 2: Create `README.md`** including ALL of:
  - One-paragraph what-it-is (generalized Jarvis conductor).
  - **Install** (native marketplace):
    ```
    claude plugin marketplace add mrashed98/jarvis
    claude plugin install jarvis@jarvis
    ```
  - **Prerequisites** (the 3 pinned one-liners), each labeled with what it powers:
    - superpowers (build): `claude plugin install superpowers@claude-plugins-official`
    - GSD (spec): `npx @opengsd/gsd-core@latest`
    - gstack (validate/review/QA/ship): `git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup`
  - **How it works**: the 4 gated phases.
  - **Attribution / licenses**: gstack (garrytan, MIT), GSD (@opengsd / open-gsd/gsd-core), superpowers (obra, MIT). State explicitly: "Jarvis orchestrates these independent tools via their own installers; it does not bundle or redistribute their code."
  - **Layer 2 (planned)**: `npx jarvis-dist install` one-command full-stack installer — not yet shipped.

- [ ] **Step 3: Commit**

```bash
cd /Users/c1ph3r/projects/jarvis-dist && git add README.md LICENSE && git commit -m "docs: README install guide + attribution, MIT license"
```

---

## Task 8: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: ci
on:
  push:
    branches: [ main ]
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Run tests (includes manifest shape + SKILL hardcoding guard)
        run: node --test
      - name: Grep guard — no project-specific hardcoding in SKILL.md
        run: |
          ! grep -RniE 'gozmo|\bexpo\b|\bilife\b|maestro|expo export' plugins/jarvis/skills/jarvis/SKILL.md
```

- [ ] **Step 2: Run the suite locally one more time**

Run: `cd /Users/c1ph3r/projects/jarvis-dist && npm test`
Expected: PASS — all tests.

- [ ] **Step 3: Commit**

```bash
cd /Users/c1ph3r/projects/jarvis-dist && git add .github/workflows/ci.yml && git commit -m "ci: node tests + manifest validation + hardcoding guard"
```

---

## Final verification (verification-before-completion)

- [ ] `cd /Users/c1ph3r/projects/jarvis-dist && npm test` → all green; capture the count.
- [ ] `node plugins/jarvis/scripts/preflight.js` → prints a sane report on this machine.
- [ ] `grep -RniE 'gozmo|expo|ilife|maestro' plugins/jarvis/skills/jarvis/SKILL.md` → no matches.
- [ ] Confirm tree matches File Structure; no stray writes outside `/Users/c1ph3r/projects/jarvis-dist`.
- [ ] iLife untouched: `git -C /Users/c1ph3r/projects/iLife status` (if a repo) or `head -2 /Users/c1ph3r/projects/iLife/.planning/jarvis-run.md` still shows the iLife run.

---

## Spec coverage self-review

- SPEC deliverable 1 (repo skeleton) → Tasks 1, 5, 7, 8.
- SPEC deliverable 2 (generalized SKILL.md) → Task 6 (+ detection in Task 2).
- SPEC deliverable 3 (dependency preflight) → Tasks 3, 4 (+ wired into SKILL in Task 6).
- SPEC deliverable 4 (README) → Task 7.
- Acceptance: marketplace install (Task 5 manifests + Task 7 README), schema-valid manifests (Task 5), no hardcoding (Task 6 + Task 8 grep), project-type detection across Node/Python/bare (Task 2), missing-dep hint (Tasks 3/4), README content (Task 7).
- Out of scope (npx orchestrator) → correctly excluded; documented as layer 2 in README (Task 7).
