import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Importing a helper from `node -`, `node -e`, or another module must be inert.
// Resolve symlinks for real CLI files without interpreting '-' as a filename.
export function isMain(moduleUrl) {
  if (!process.argv[1] || process.argv[1] === '-') return false;
  try { return moduleUrl === pathToFileURL(realpathSync(process.argv[1])).href; }
  catch (error) { if (['ENOENT', 'ENOTDIR'].includes(error.code)) return false; throw error; }
}
