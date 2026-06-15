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
