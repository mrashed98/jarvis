#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { detectDeps } from '../plugins/jarvis/scripts/deps.js';
import { detectJarvis, planInstall } from '../plugins/jarvis/scripts/install-plan.js';

export const HELP = `jarvis installer

Usage: npx github:mrashed98/jarvis [options]

Installs Jarvis (marketplace + plugin) and its dependencies
(superpowers, GSD, gstack). Anything already installed is skipped.

Options:
  -y, --yes       Run without the confirmation prompt
  -n, --dry-run   Print the plan and exit; change nothing
  -h, --help      Show this help
`;

export function parseArgs(argv) {
  const flags = { yes: false, dryRun: false, help: false, unknown: null };
  for (const a of argv) {
    if (a === '--yes' || a === '-y') flags.yes = true;
    else if (a === '--dry-run' || a === '-n') flags.dryRun = true;
    else if (a === '--help' || a === '-h') flags.help = true;
    else flags.unknown = a;
  }
  return flags;
}

export function formatPlan(plan) {
  const lines = ['Jarvis install plan:'];
  for (const s of plan) {
    lines.push(`  ${s.skip ? 'skip (present)' : 'INSTALL       '} ${s.label}`);
    if (!s.skip) lines.push(`                 $ ${s.cmd}`);
  }
  const todo = plan.filter((s) => !s.skip);
  lines.push('');
  lines.push(
    todo.length
      ? `${todo.length} to install.`
      : 'Everything already installed — nothing to do.',
  );
  return lines.join('\n');
}

const defaultRun = (cmd) => execSync(cmd, { stdio: 'inherit' });

/** Execute non-skipped steps in order via an injected runner (testable). */
export function runPlan(plan, { run = defaultRun, dryRun = false } = {}) {
  const executed = [];
  for (const s of plan) {
    if (s.skip) continue;
    if (dryRun) {
      executed.push({ id: s.id, dryRun: true });
      continue;
    }
    run(s.cmd);
    executed.push({ id: s.id });
  }
  return { executed };
}

function gatherPresent() {
  return { ...detectDeps(), jarvis: detectJarvis() };
}

function confirm() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('Proceed? [y/N] ', (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

export async function main(argv = process.argv.slice(2)) {
  const flags = parseArgs(argv);
  if (flags.help) {
    console.log(HELP);
    return 0;
  }
  if (flags.unknown) {
    console.error(`Unknown argument: ${flags.unknown}\n\n${HELP}`);
    return 1;
  }
  const plan = planInstall(gatherPresent());
  console.log(formatPlan(plan));
  const todo = plan.filter((s) => !s.skip);
  if (todo.length === 0) return 0;
  if (flags.dryRun) {
    console.log('\n[dry-run] no changes made.');
    return 0;
  }
  if (!flags.yes && !(await confirm())) {
    console.log('Aborted.');
    return 0;
  }
  runPlan(plan, {});
  console.log('\nDone. Restart Claude Code to pick up newly installed plugins/skills.');
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => process.exit(code));
}
