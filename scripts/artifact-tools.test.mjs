import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, symlink, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { sealHistory } from './assessment-engine.mjs';
import { verifyArtifact, stagePrivateBundle } from './verify-artifact.mjs';
import { renderOutcomeStory, renderNextChecks, renderDeliveryMilestones } from './render-progress.mjs';

async function fixture(context) {
  const root = await mkdtemp(join(tmpdir(), 'roadmap-bundle-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const ledger = { originalBaselineId: 'initial', originalBaseline: { grade: 'B+' }, currentAssessmentId: 'first', assessments: [{ id: 'first', grade: 'B+' }], presentation: { artifactBrief: { audience: 'Private reviewers' } } };
  const files = {
    'ledger.json': JSON.stringify(ledger),
    'history.json': JSON.stringify(sealHistory(ledger)),
    'index.html': `<html><script type="application/json" id="roadmap-history">${JSON.stringify(ledger)}</script></html>`,
  };
  for (const [name, content] of Object.entries(files)) await writeFile(join(root, name), content);
  const manifest = { schemaVersion: 1, visibility: 'private', audience: 'Private reviewers', assessmentId: 'first', artifactFile: 'index.html', ledgerFile: 'ledger.json', historyLockFile: 'history.json', files: Object.entries(files).map(([path, content]) => ({ path, sha256: createHash('sha256').update(content).digest('hex') })) };
  const path = join(root, 'publication-manifest.json');
  const save = () => writeFile(path, JSON.stringify(manifest));
  await save();
  return { root, ledger, files, manifest, path, save };
}

test('verified private bundle copies only the allowlist and reports no upload', async context => {
  const data = await fixture(context);
  await writeFile(join(data.root, 'do-not-share.txt'), 'not allowlisted');
  assert.equal((await verifyArtifact(data.path)).verifiedFiles, 3);
  const target = join(data.root, 'bundle');
  const result = await stagePrivateBundle(data.path, target);
  assert.equal(result.uploaded, false);
  await assert.rejects(readFile(join(target, 'do-not-share.txt')), /ENOENT/);
  assert.equal((await stat(target)).mode & 0o777, 0o700);
  assert.equal((await stat(join(target, 'index.html'))).mode & 0o777, 0o600);
  await assert.rejects(stagePrivateBundle(data.path, target), /EEXIST/);
});

test('file tampering, publication scope changes and stale manifest fail closed', async context => {
  const data = await fixture(context);
  data.manifest.visibility = 'public'; await data.save();
  await assert.rejects(verifyArtifact(data.path), /explicitly private/);
  data.manifest.visibility = 'private'; data.manifest.assessmentId = 'different'; await data.save();
  await assert.rejects(verifyArtifact(data.path), /disagree/);
  data.manifest.assessmentId = 'first'; await data.save();
  await writeFile(join(data.root, 'index.html'), 'changed');
  await assert.rejects(verifyArtifact(data.path), /Changed or stale/);
});

test('a freshly hashed HTML file cannot hide a different embedded assessment', async context => {
  const data = await fixture(context);
  const html = data.files['index.html'].replace('"currentAssessmentId":"first"', '"currentAssessmentId":"other"');
  await writeFile(join(data.root, 'index.html'), html);
  data.manifest.files.find(file => file.path === 'index.html').sha256 = createHash('sha256').update(html).digest('hex');
  await data.save();
  await assert.rejects(verifyArtifact(data.path), /different revisions/);
});

test('a reassessment appends history and updates both ledger and embedded current identity', async context => {
  const data = await fixture(context);
  const history = await readFile(join(data.root, 'history.json'), 'utf8');
  data.ledger.assessments.push({ id: 'second', grade: 'A-' });
  data.ledger.currentAssessmentId = 'second';
  data.manifest.assessmentId = 'second';
  const update = async (file, content) => {
    await writeFile(join(data.root, file), content);
    data.manifest.files.find(entry => entry.path === file).sha256 = createHash('sha256').update(content).digest('hex');
    await data.save();
  };
  await update('ledger.json', JSON.stringify(data.ledger));
  await assert.rejects(verifyArtifact(data.path), /different revisions/);
  await update('index.html', `<html><script type="application/json" id="roadmap-history">${JSON.stringify(data.ledger)}</script></html>`);
  assert.equal((await verifyArtifact(data.path)).manifest.assessmentId, 'second');
  assert.equal(await readFile(join(data.root, 'history.json'), 'utf8'), history);
  assert.equal(data.ledger.originalBaselineId, 'initial');
  assert.deepEqual(data.ledger.assessments[0], { id: 'first', grade: 'B+' });
});

test('a retraction recorded in the ledger must be printed on the page as the panel error rate', async context => {
  const data = await fixture(context);
  data.ledger.assessments.push({ id: 'second', grade: 'B+', findings: [{ id: 'phantom', scope: 'code', status: 'retracted', blocking: false, contradictedBy: ['src/limits.mjs at the cited commit enforces the cap'], retractedInAssessmentId: 'second' }] });
  data.ledger.currentAssessmentId = 'second';
  data.manifest.assessmentId = 'second';
  const update = async (file, content) => {
    await writeFile(join(data.root, file), content);
    data.manifest.files.find(entry => entry.path === file).sha256 = createHash('sha256').update(content).digest('hex');
    await data.save();
  };
  await update('ledger.json', JSON.stringify(data.ledger));
  const page = body => `<html>${body}<script type="application/json" id="roadmap-history">${JSON.stringify(data.ledger)}</script></html>`;
  // Ledger says retracted, page says nothing: the register would be indistinguishable from one cleaned by remediation.
  await update('index.html', page('<p>Findings: 0 open.</p>'));
  await assert.rejects(verifyArtifact(data.path), /retracts phantom but the artifact prints no panel error rate/);
  // An empty attribute is not a printed rate.
  await update('index.html', page('<p data-panel-error-rate="">Panel error rate</p>'));
  await assert.rejects(verifyArtifact(data.path), /prints no panel error rate/);
  await update('index.html', page('<p data-panel-error-rate="1 of 1">Panel error rate: 1 of 1 findings first seen on the previous card retracted (instrument, not project).</p>'));
  assert.equal((await verifyArtifact(data.path)).manifest.assessmentId, 'second');
  // A current assessment with no retraction owes no such line.
  data.ledger.assessments[1].findings[0].status = 'open';
  delete data.ledger.assessments[1].findings[0].contradictedBy;
  await update('ledger.json', JSON.stringify(data.ledger));
  await update('index.html', page('<p>Findings: 1 open.</p>'));
  assert.equal((await verifyArtifact(data.path)).manifest.assessmentId, 'second');
});

test('creation-time audience cannot change silently', async context => {
  const data = await fixture(context); data.manifest.audience = 'Public investors'; await data.save();
  await assert.rejects(verifyArtifact(data.path), /audience changed/);
});

test('a retained lock hash rejects resealing even when the rewritten manifest and history agree', async context => {
  const data = await fixture(context);
  const original = await verifyArtifact(data.path);
  assert.equal(original.historyLockPreservation, 'not-checked');
  const options = { expectedHistoryLockSha256: original.historyLockSha256 };
  data.ledger.assessments.push({ id: 'second', grade: 'A' });
  data.ledger.currentAssessmentId = 'second';
  data.manifest.assessmentId = 'second';
  const update = async (file, content) => {
    await writeFile(join(data.root, file), content);
    data.manifest.files.find(entry => entry.path === file).sha256 = createHash('sha256').update(content).digest('hex');
  };
  await update('ledger.json', JSON.stringify(data.ledger));
  await update('index.html', `<html><script type="application/json" id="roadmap-history">${JSON.stringify(data.ledger)}</script></html>`);
  await data.save();
  assert.equal((await verifyArtifact(data.path, options)).historyLockPreservation, 'verified');
  // This was the observed failure: the model extended the lock and rehashed the
  // manifest, allowing a self-consistency check to claim history was preserved.
  await update('history.json', JSON.stringify(sealHistory(data.ledger)));
  await data.save();
  assert.equal((await verifyArtifact(data.path)).historyLockPreservation, 'not-checked');
  await assert.rejects(verifyArtifact(data.path, options), /Original history lock changed/);
  await assert.rejects(stagePrivateBundle(data.path, join(data.root, 'export'), options), /Original history lock changed/);
  await assert.rejects(stat(join(data.root, 'export')), /ENOENT/);
});

test('lock preservation compares bytes, and refuses malformed expected hashes', async context => {
  const data = await fixture(context);
  const options = { expectedHistoryLockSha256: (await verifyArtifact(data.path)).historyLockSha256 };
  const content = `${data.files['history.json']}\n`;
  await writeFile(join(data.root, 'history.json'), content);
  data.manifest.files.find(file => file.path === 'history.json').sha256 = createHash('sha256').update(content).digest('hex');
  await data.save();
  await assert.rejects(verifyArtifact(data.path, options), /Original history lock changed/);
  for (const value of ['', null, 'abc', 'A'.repeat(64), 123]) {
    await assert.rejects(verifyArtifact(data.path, { expectedHistoryLockSha256: value }), /64 lowercase hexadecimal/);
  }
});

test('CLI carries the original lock pin through verification and optional export', async context => {
  const data = await fixture(context);
  const script = fileURLToPath(new URL('./verify-artifact.mjs', import.meta.url));
  const run = promisify(execFile);
  const initial = JSON.parse((await run(process.execPath, [script, data.path])).stdout);
  assert.equal(initial.historyLockPreservation, 'not-checked');
  const verified = JSON.parse((await run(process.execPath, [script, data.path, '--history-lock-sha256', initial.historyLockSha256])).stdout);
  assert.equal(verified.historyLockPreservation, 'verified');
  const exported = JSON.parse((await run(process.execPath, [script, data.path, '--private-bundle', join(data.root, 'export'), '--history-lock-sha256', initial.historyLockSha256])).stdout);
  assert.equal(exported.historyLockPreservation, 'verified');
  assert.equal(exported.uploaded, false);
  await assert.rejects(run(process.execPath, [script, data.path, '--history-lock-sha256', '0'.repeat(64)]), /Original history lock changed/);
  for (const args of [['--history-lock-sha256'], ['--private-bundle'], ['--unknown', 'x'], ['--history-lock-sha256', initial.historyLockSha256, '--history-lock-sha256', initial.historyLockSha256]]) {
    await assert.rejects(run(process.execPath, [script, data.path, ...args]), /Usage:/);
  }
});

test('a registered scale lens cannot disappear during component-only regeneration', async context => {
  const data = await fixture(context);
  data.ledger.assessmentLenses = [{ id: 'scalability', sourceFile: 'scale.json' }];
  const source = JSON.stringify({ id: 'scalability', lastAssessedOn: '2026-01-01' });
  await writeFile(join(data.root, 'scale.json'), source);
  data.manifest.files.push({ path: 'scale.json', sha256: createHash('sha256').update(source).digest('hex') });
  const update = async (file, content) => {
    await writeFile(join(data.root, file), content);
    data.manifest.files.find(entry => entry.path === file).sha256 = createHash('sha256').update(content).digest('hex');
    await data.save();
  };
  await update('ledger.json', JSON.stringify(data.ledger));
  const history = `<script type="application/json" id="roadmap-history">${JSON.stringify(data.ledger)}</script>`;
  await update('index.html', `<html>${history}</html>`);
  await assert.rejects(verifyArtifact(data.path), /Standing assessment lens missing/);
  await update('index.html', `<html>${history}<section data-assessment-lens="scalability">Dated scale grade</section></html>`);
  assert.equal((await verifyArtifact(data.path)).verifiedFiles, 4);
  data.manifest.files = data.manifest.files.filter(file => file.path !== 'scale.json');
  await data.save();
  await assert.rejects(verifyArtifact(data.path), /evidence must be allowlisted/);
});

test('path traversal and symlink escapes cannot add files to a bundle', async context => {
  const data = await fixture(context);
  data.manifest.files.push({ path: '../outside', sha256: 'unused' }); await data.save();
  await assert.rejects(verifyArtifact(data.path), /inside the artifact/);
  data.manifest.files.pop();
  await symlink('/etc/hosts', join(data.root, 'outside'));
  data.manifest.files.push({ path: 'outside', sha256: 'unused' }); await data.save();
  await assert.rejects(verifyArtifact(data.path), /escapes artifact/);
});

test('outcome renderer escapes content, requires proof and rejects script links', () => {
  const story = { baselineId: 'initial', assessmentId: 'current', observedAt: '2026-01-01T00:00:00Z', heading: 'Verified outcomes', summary: 'Meaningful progress', observationLabel: 'Evidence', evidenceHref: '#evidence', sincePreviousLabel: 'Unavailable', wins: [{ id: 'win', title: '<script>bad</script>', outcome: 'A real outcome', proofLabel: 'Observed', scopeLabel: 'Staging', evidenceHref: '#evidence' }] };
  assert.match(renderOutcomeStory(story), /&lt;script&gt;/);
  story.wins[0].evidenceHref = 'javascript:alert(1)'; assert.throws(() => renderOutcomeStory(story), /Unsafe evidence/);
  story.wins[0].evidenceHref = ''; assert.throws(() => renderOutcomeStory(story), /proof and scope/);
});

test('next checks disclose owner, acceptance and environment with native details', () => {
  const components = [{ id: 'component', name: 'Component', grade: 'B', nextOutcome: 'Safer operation', auditHref: '#audit', actions: [{ title: 'Exercise recovery', acceptance: 'Prove restored data matches the backup', owner: 'Unassigned', scope: 'Staging first', status: 'Proposed', evidenceHref: '#evidence' }] }];
  const html = renderNextChecks(components);
  assert.match(html, /<details[^>]+id="next-component"/);
  assert.match(html, /Unassigned · Staging first/);
  assert.doesNotMatch(html, /<details[^>]+\bopen\b/);
  delete components[0].actions[0].owner; assert.throws(() => renderNextChecks(components), /need acceptance, owner/);
});

test('milestone renderer retains unscheduled commitments and observation labels', () => {
  const html = renderDeliveryMilestones([{ title: 'Reliable releases', plannedLabel: 'No committed date', observedLabel: 'Observed January 2', scopeLabel: 'Production', stateLabel: 'Verified', evidenceHref: '#evidence' }]);
  assert.match(html, /No committed date/); assert.match(html, /Observed January 2/);
  assert.match(html, /not an invented completion date/);
});
