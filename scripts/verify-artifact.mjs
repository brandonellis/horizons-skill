import { readFile, realpath, mkdir, copyFile, writeFile, chmod } from 'node:fs/promises';
import { resolve, relative, dirname, isAbsolute, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { canonical, verifyHistory } from './assessment-engine.mjs';

async function safeFile(root, file) {
  if (typeof file !== 'string' || isAbsolute(file) || file.split(/[\\/]/).includes('..')) throw new Error('Manifest paths must stay inside the artifact directory');
  const target = await realpath(resolve(root, file));
  const inside = relative(root, target);
  if (!inside || inside === '..' || inside.startsWith(`..${sep}`) || isAbsolute(inside)) throw new Error('Symlink or path escapes artifact directory');
  return target;
}

export async function verifyArtifact(manifestPath, { expectedHistoryLockSha256 } = {}) {
  if (expectedHistoryLockSha256 !== undefined && (typeof expectedHistoryLockSha256 !== 'string' || !/^[a-f\d]{64}$/.test(expectedHistoryLockSha256))) throw new Error('Expected history lock SHA-256 must be 64 lowercase hexadecimal characters');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const root = await realpath(dirname(resolve(manifestPath)));
  if (manifest.schemaVersion !== 1 || manifest.visibility !== 'private') throw new Error('This verifier only handles explicitly private artifact bundles');
  if (!manifest.assessmentId || !manifest.audience || !Array.isArray(manifest.files) || !manifest.files.length) throw new Error('Manifest needs audience, assessment and allowlisted files');
  if (new Set(manifest.files.map(file => file.path)).size !== manifest.files.length) throw new Error('Duplicate manifest paths');
  const read = async file => readFile(await safeFile(root, file), 'utf8');
  for (const file of manifest.files) {
    const content = await readFile(await safeFile(root, file.path));
    const hash = createHash('sha256').update(content).digest('hex');
    if (file.sha256 !== hash) throw new Error(`Changed or stale bundle file: ${file.path}`);
  }
  for (const file of [manifest.artifactFile, manifest.ledgerFile, manifest.historyLockFile]) {
    if (!manifest.files.some(entry => entry.path === file)) throw new Error('Artifact, ledger and history lock must be allowlisted');
  }
  const ledger = JSON.parse(await read(manifest.ledgerFile));
  const historyBytes = await readFile(await safeFile(root, manifest.historyLockFile));
  const historyLockSha256 = createHash('sha256').update(historyBytes).digest('hex');
  if (expectedHistoryLockSha256 !== undefined && historyLockSha256 !== expectedHistoryLockSha256) throw new Error('Original history lock changed: restore the retained original; do not reseal it or replace the expected hash');
  const history = JSON.parse(historyBytes.toString('utf8'));
  verifyHistory(history, ledger);
  if (manifest.assessmentId !== ledger.currentAssessmentId) throw new Error('Manifest and ledger disagree on current assessment');
  if (!ledger.assessments.some(assessment => assessment.id === manifest.assessmentId)) throw new Error('Current assessment is missing from history');
  const html = await read(manifest.artifactFile);
  const embedded = html.match(/<script\b(?=[^>]*\bid="roadmap-history")(?=[^>]*\btype="application\/json")[^>]*>([\s\S]*?)<\/script>/);
  if (!embedded || canonical(JSON.parse(embedded[1])) !== canonical(ledger)) throw new Error('Visible artifact and saved ledger are different revisions');
  const lenses = ledger.assessmentLenses ?? [];
  if (!Array.isArray(lenses) || new Set(lenses.map(lens => lens.id)).size !== lenses.length) throw new Error('Standing assessment lenses need unique IDs');
  for (const lens of lenses) {
    if (typeof lens.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(lens.id)) throw new Error('Invalid standing assessment lens ID');
    if (!manifest.files.some(file => file.path === lens.sourceFile)) throw new Error(`Standing lens evidence must be allowlisted: ${lens.id}`);
    const section = new RegExp(`<(?:section|article)\\b[^>]*\\bdata-assessment-lens=["']${lens.id}["'][^>]*>`);
    if (!section.test(html)) throw new Error(`Standing assessment lens missing from artifact: ${lens.id}`);
  }
  if (ledger.presentation?.artifactBrief?.audience !== manifest.audience) throw new Error('Creation-time audience changed during publication');
  // A retraction recorded in the ledger and absent from the page is the
  // failure this state exists to prevent: the register is clean and nobody can
  // tell whether by remediation or by mis-measurement. When the current
  // assessment retracts anything, the page must print the panel's own error
  // rate where a reader will meet it, marked so this check can find it.
  const current = ledger.assessments.find(assessment => assessment.id === manifest.assessmentId);
  const retracted = (current.findings ?? current.findingStates ?? []).filter(finding => finding.status === 'retracted');
  if (retracted.length && !/\bdata-panel-error-rate=["'][^"']+["']/.test(html)) throw new Error(`Current assessment retracts ${retracted.map(finding => finding.id).join(', ')} but the artifact prints no panel error rate (add data-panel-error-rate="<retracted> of <first seen on previous>" where the measurement band shows it)`);
  return { root, manifest, verifiedFiles: manifest.files.length, historyLockSha256,
    historyLockPreservation: expectedHistoryLockSha256 === undefined ? 'not-checked' : 'verified' };
}

export async function stagePrivateBundle(manifestPath, destination, options = {}) {
  const result = await verifyArtifact(manifestPath, options);
  if (result.manifest.files.some(file => file.path === 'publication-manifest.json')) throw new Error('Publication manifest cannot include itself');
  const output = resolve(destination);
  await mkdir(output, { mode: 0o700 });
  for (const file of result.manifest.files) {
    const target = resolve(output, file.path);
    await mkdir(dirname(target), { recursive: true, mode: 0o700 });
    await copyFile(await safeFile(result.root, file.path), target);
    await chmod(target, 0o600);
  }
  const targetManifest = resolve(output, 'publication-manifest.json');
  await writeFile(targetManifest, JSON.stringify(result.manifest, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  await verifyArtifact(targetManifest, options);
  return { directory: output, assessmentId: result.manifest.assessmentId, uploaded: false, visibility: 'private', historyLockSha256: result.historyLockSha256, historyLockPreservation: result.historyLockPreservation };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [manifestPath, ...args] = process.argv.slice(2);
    const usage = 'Usage: node verify-artifact.mjs MANIFEST [--history-lock-sha256 ORIGINAL_HASH] [--private-bundle NEW_DIRECTORY]';
    if (!manifestPath || manifestPath.startsWith('--')) throw new Error(usage);
    const flags = new Map();
    for (let i = 0; i < args.length; i += 2) {
      if (!['--private-bundle', '--history-lock-sha256'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--') || flags.has(args[i])) throw new Error(usage);
      flags.set(args[i], args[i + 1]);
    }
    const options = { expectedHistoryLockSha256: flags.get('--history-lock-sha256') };
    const destination = flags.get('--private-bundle');
    const result = destination ? await stagePrivateBundle(manifestPath, destination, options) : await verifyArtifact(manifestPath, options);
    console.log(JSON.stringify(destination ? result : { verifiedFiles: result.verifiedFiles, assessmentId: result.manifest.assessmentId, historyLockSha256: result.historyLockSha256, historyLockPreservation: result.historyLockPreservation }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
