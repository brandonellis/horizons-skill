import { realpathSync } from 'node:fs';
import { readFile, writeFile, rename, unlink, lstat, mkdir, open } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { digest, validateModel, readEmbeddedModel, refreshModel, applyMoves, addGradePlanning } from './roadmap-model.mjs';
import { renderStarter } from './render-starter.mjs';

async function existing(path) {
  try { const info = await lstat(path); if (!info.isFile() || info.isSymbolicLink()) throw new Error('Canonical entry must be a regular file'); return await readFile(path, 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
export function verifyStarter(html) {
  const model = readEmbeddedModel(html);
  const markup = html.replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/g, '$1</script>');
  const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate artifact anchor');
  for (const [, id] of markup.matchAll(/\shref="#([^"]+)"/g)) if (!ids.includes(id)) throw new Error(`Broken artifact link: ${id}`);
  for (const item of model.items) if (!ids.includes(`detail-${item.id}`)) throw new Error('Missing initiative detail');
  if (!html.includes(`data-digest="${digest(model)}"`)) throw new Error('Embedded model digest mismatch');
  return { revision: model.revision, items: model.items.length, historyEvents: model.history.length };
}
export async function stageRoadmap(output, { snapshot, proposal, approval, gradePlanning } = {}) {
  output = resolve(output); await mkdir(dirname(output), { recursive: true });
  const oldHtml = await existing(output), current = oldHtml === null ? null : readEmbeddedModel(oldHtml);
  let next;
  if (gradePlanning) { if (!current) throw new Error('Grade planning needs an existing roadmap'); next = addGradePlanning(current, gradePlanning); }
  else if (proposal) { if (!current) throw new Error('Movement needs an existing canonical roadmap'); next = applyMoves(current, proposal, { approval }); }
  else { validateModel(snapshot); next = current ? refreshModel(current, snapshot) : snapshot; }
  if (!current && (next.revision !== 1 || next.history.length)) throw new Error('New roadmap must start at revision 1 with empty history');
  if (current && JSON.stringify(next) === JSON.stringify(current)) return { output, revision: current.revision, status: 'unchanged', hosted: false };
  const html = renderStarter(next); verifyStarter(html);
  const checkpoint = { schemaVersion: 1, baseHash: oldHtml === null ? null : digest(oldHtml), model: next, htmlHash: digest(html) };
  await writeFile(`${output}.pending.json`, JSON.stringify(checkpoint, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  return { output, checkpoint: `${output}.pending.json`, revision: next.revision, status: 'staged' };
}
export async function commitRoadmap(output) {
  output = resolve(output);
  const lockPath = `${output}.lock`, temporary = `${output}.tmp`;
  const lock = await open(lockPath, 'wx', 0o600);
  let wroteTemporary = false;
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
    const checkpoint = JSON.parse(await readFile(`${output}.pending.json`, 'utf8'));
    if (checkpoint.schemaVersion !== 1) throw new Error('Unsupported checkpoint');
    const currentHtml = await existing(output);
    if (currentHtml !== null && digest(currentHtml) === checkpoint.htmlHash && JSON.stringify(readEmbeddedModel(currentHtml)) === JSON.stringify(checkpoint.model)) {
      const verified = verifyStarter(currentHtml);
      await unlink(`${output}.pending.json`);
      return { output, ...verified, status: 'saved', recoveredAfterReplacement: true, hosted: false, browserChecked: false };
    }
    if ((currentHtml === null ? null : digest(currentHtml)) !== checkpoint.baseHash) throw new Error('Canonical roadmap changed after staging; preserve it, reread and restage');
    const next = validateModel(checkpoint.model);
    if (currentHtml !== null) {
      const current = readEmbeddedModel(currentHtml);
      if (next.project.id !== current.project.id || next.project.audience !== current.project.audience || next.revision !== current.revision + 1 || JSON.stringify(next.history.slice(0, current.history.length)) !== JSON.stringify(current.history)) throw new Error('Checkpoint changed project, audience, revision or prior history');
    }
    const html = renderStarter(next), verified = verifyStarter(html);
    if (digest(html) !== checkpoint.htmlHash) throw new Error('Checkpoint or renderer changed; restage before committing');
    const mode = currentHtml === null ? 0o600 : (await lstat(output)).mode & 0o777;
    await writeFile(temporary, html, { flag: 'wx', mode });
    wroteTemporary = true;
    // Recheck immediately before atomic replacement, including edits made outside this helper.
    const latest = await existing(output);
    if ((latest === null ? null : digest(latest)) !== checkpoint.baseHash) throw new Error('Concurrent edit detected; canonical artifact preserved');
    await rename(temporary, output);
    await unlink(`${output}.pending.json`);
    return { output, ...verified, status: 'saved', hosted: false, browserChecked: false };
  } finally {
    await lock.close(); await unlink(lockPath);
    if (wroteTemporary) await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
}
export async function run(args) {
  const [command, output, input, ...options] = args;
  if (!output || !['build', 'refresh', 'move', 'resume', 'verify', 'extract', 'priorities'].includes(command)) throw new Error('Usage: roadmap-pipeline.mjs build|refresh|move|priorities <canonical.html> <input.json> [--stage] [--approve <reference>]; resume|verify|extract <canonical.html>');
  if (['resume','verify','extract'].includes(command) && (input || options.length)) throw new Error('Unexpected arguments');
  if (command === 'resume') return commitRoadmap(output);
  if (command === 'verify') return verifyStarter(await readFile(output, 'utf8'));
  if (command === 'extract') return readEmbeddedModel(await readFile(output, 'utf8'));
  if (!input) throw new Error('Input JSON is required');
  let stageOnly = false, approval;
  for (let i = 0; i < options.length; i++) {
    if (options[i] === '--stage') stageOnly = true;
    else if (options[i] === '--approve' && options[i + 1] && !options[i + 1].startsWith('--')) approval = options[++i];
    else throw new Error(`Unknown or incomplete option: ${options[i]}`);
  }
  if (command === 'build' && await existing(resolve(output)) !== null) throw new Error('Build refuses to replace an existing file; use refresh');
  if (command === 'refresh' && await existing(resolve(output)) === null) throw new Error('Refresh needs an existing canonical file');
  if (command !== 'move' && approval) throw new Error('--approve applies only to reviewed moves');
  const data = JSON.parse(await readFile(input, 'utf8'));
  const staged = await stageRoadmap(output, command === 'move' ? { proposal: data, approval } : command === 'priorities' ? { gradePlanning: data } : { snapshot: data });
  return stageOnly || staged.status === 'unchanged' ? staged : commitRoadmap(output);
}
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) run(process.argv.slice(2)).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
