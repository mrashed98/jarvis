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
