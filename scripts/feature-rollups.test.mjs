import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFeatureRollups, classifyWork } from './feature-rollups.mjs';
import { renderFeatureDetail, renderFeatureProgress, renderWorkRecords } from './render-feature-rollups.mjs';

const observedAt = '2026-06-03T12:00:00Z';
const issue = (id, patch = {}) => ({ id, title: `Work ${id}`, statusType: 'completed', completedAt: '2026-06-03T10:00:00Z', observedAt, labels: ['Bug'], url: `https://example.com/issues/${id}`, ...patch });
const feature = (id, patch = {}) => ({ id, title: id, originalIssueIds: [], ...patch });
const input = patch => ({ schemaVersion: 1, baselineId: 'original', since: '2026-06-02T12:00:00Z', observedAt, features: [feature('engine', { originalIssueIds: ['ENG-1'], projectIds: ['engine-project'] })], issues: [issue('ENG-1'), issue('ENG-2', { projectId: 'engine-project' })], ...patch });
const decision = patch => ({ issueId: 'ENG-2', primaryFeatureId: 'engine', sourceHref: 'https://example.com/decision', reason: 'Reviewed acceptance and ownership', reviewedAt: observedAt, ...patch });

test('additional completed bugs earn credit without altering original scope', () => {
  const source = input();
  const before = structuredClone(source);
  const model = buildFeatureRollups(source);
  assert.deepEqual(source, before);
  assert.deepEqual(model.features[0].originalIssueIds, ['ENG-1']);
  assert.equal(model.features[0].completed.length, 2);
  assert.equal(model.features[0].remainingOriginal.length, 0);
  assert.match(renderFeatureDetail(model.features[0]), /Completed improvements and fixes/);
  assert.match(renderFeatureDetail(model.features[0]), /1\/1 original cited tickets Done/);
});

test('open follow-ups stay separate and cannot reset a delivered milestone', () => {
  const milestone = { id: 'core', title: 'Core transition', state: 'delivered', scope: 'Code only', completedAt: '2026-06-01T10:00:00Z', sourceHref: 'https://example.com/proof', acceptance: 'Original transition acceptance verified' };
  const model = buildFeatureRollups(input({ features: [feature('engine', { originalIssueIds: ['ENG-1'], milestones: [milestone] })], issues: [issue('ENG-1'), issue('ENG-2', { statusType: 'started', completedAt: null })], decisions: [decision({ role: 'follow-up' })] }));
  assert.deepEqual(model.features[0].milestones, [milestone]);
  assert.equal(model.features[0].additionalOpen[0].id, 'ENG-2');
  assert.equal(model.features[0].remainingOriginal.length, 0);
  assert.match(renderFeatureDetail(model.features[0]), /Additional work and follow-ups/);
});

test('one primary feature receives credit while secondary features retain links', () => {
  const model = buildFeatureRollups(input({ features: [feature('engine', { originalIssueIds: ['ENG-1'], projectIds: ['shared'] }), feature('safety', { projectIds: ['shared'] })], issues: [issue('ENG-1', { projectId: 'shared' }), issue('ENG-2', { projectId: 'shared' })], decisions: [decision({ primaryFeatureId: 'safety' })] }));
  assert.equal(model.totals.completed, 2);
  assert.equal(model.features[0].completed.length, 1);
  assert.equal(model.features[1].completed.length, 1);
  assert.equal(model.features[1].secondaryRecords[0].id, 'ENG-1');
  assert.match(renderFeatureDetail(model.features[1]), /Counted once/);
});

test('ambiguous shared originals need a decision, not arbitrary double credit', () => {
  const model = buildFeatureRollups(input({ features: [feature('engine', { originalIssueIds: ['ENG-1'] }), feature('safety', { originalIssueIds: ['ENG-1'] })], issues: [issue('ENG-1')] }));
  assert.equal(model.totals.completed, 0);
  assert.equal(model.unmapped[0].mappingReason, 'Ambiguous feature membership');
  assert.equal(model.features[0].original.length, 1);
});

test('parent and milestone membership discover work beyond a title match', () => {
  const model = buildFeatureRollups(input({ features: [feature('engine', { parentIds: ['ENG-0'], milestoneIds: ['m1'] })], issues: [issue('ENG-1', { parentId: 'ENG-0' }), issue('ENG-2', { projectMilestone: { id: 'm1' } }), issue('ENG-3', { title: 'engine fix' })] }));
  assert.equal(model.totals.completed, 2);
  assert.equal(model.unmapped[0].id, 'ENG-3');
});

test('canceled, duplicate, unknown, and reopened issues are not completed', () => {
  const model = buildFeatureRollups(input({ issues: [issue('ENG-1', { statusType: 'started' }), issue('ENG-2', { projectId: 'engine-project', statusType: 'duplicate' }), issue('ENG-3', { projectId: 'engine-project', statusType: 'canceled' }), issue('ENG-4', { projectId: 'engine-project', statusType: 'custom' })] }));
  assert.equal(model.totals.completed, 0);
  assert.equal(model.features[0].remainingOriginal.length, 1);
  assert.equal(model.features[0].excluded.length, 2);
  assert.equal(model.features[0].unknown.length, 1);
});

test('updating old completed work does not make it newly delivered', () => {
  const model = buildFeatureRollups(input({ issues: [issue('ENG-1', { completedAt: '2026-06-01T00:00:00Z', updatedAt: observedAt }), issue('ENG-2', { projectId: 'engine-project', completedAt: null })] }));
  assert.equal(model.totals.completed, 2);
  assert.equal(model.totals.newlyCompleted, 0);
});

test('work types come from labels, not inferred intent', () => {
  assert.equal(classifyWork(['security', 'performance']), 'unknown');
  assert.equal(classifyWork([{ name: 'Bug' }]), 'bug');
  assert.equal(classifyWork(['Feature']), 'capability');
  assert.equal(classifyWork(['Improvement']), 'improvement');
});

test('shared original unknown states remain visible under either feature', () => {
  const model = buildFeatureRollups(input({ features: [feature('engine', { originalIssueIds: ['ENG-1'] }), feature('safety', { originalIssueIds: ['ENG-1'] })], issues: [issue('ENG-1', { statusType: 'custom' })], decisions: [decision({ issueId: 'ENG-1' })] }));
  for (const record of model.features) {
    assert.equal(record.unknown[0].id, 'ENG-1');
    assert.match(renderFeatureDetail(record), /Status needs verification/);
  }
});

test('summary uses singular counts and has no fabricated empty denominator', () => {
  const model = buildFeatureRollups(input({ features: [feature('engine', { projectIds: ['engine-project'] })], issues: [issue('ENG-2', { projectId: 'engine-project' })] }));
  assert.match(renderFeatureProgress(model), /1 bug fix</);
  assert.doesNotMatch(renderFeatureProgress(model), /1 bug fixes/);
  assert.match(renderFeatureDetail(model.features[0]), /No original ticket set was recorded/);
  assert.doesNotMatch(renderFeatureDetail(model.features[0]), /0\/0/);
});

test('reject duplicate observations, lost originals and unsupported regression claims', () => {
  assert.throws(() => buildFeatureRollups(input({ issues: [issue('ENG-1'), issue('ENG-1')] })), /duplicate observations/);
  assert.throws(() => buildFeatureRollups(input({ issues: [] })), /Original citations/);
  assert.throws(() => buildFeatureRollups(input({ decisions: [decision({ role: 'regression' })] })), /broken acceptance/);
  assert.throws(() => buildFeatureRollups(input({ decisions: [decision({ sourceHref: '' })] })), /reviewed evidence/);
});

test('safe static drill-downs retain titles, status, dates and all records', () => {
  const model = buildFeatureRollups(input({ issues: [issue('ENG-1', { title: '<script>unsafe</script>' }), issue('ENG-2', { projectId: 'engine-project', statusType: 'backlog', completedAt: null })] }));
  const html = renderFeatureDetail(model.features[0]);
  assert(!html.includes('<script>'));
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /Done · Bug fix · completed Jun 3, 2026/);
  assert.match(html, /Backlog · Bug fix/);
  assert.equal((html.match(/data-work-id=/g) || []).length, 2);
  assert.match(renderFeatureProgress(model), /#feature-work-engine/);
  assert.throws(() => renderWorkRecords([{ ...model.records[0], url: 'javascript:alert(1)' }]), /safe source/);
});

// Optional tracker metadata must not block a complete delivery reconciliation.
test('null or omitted labels retain unknown work type without losing delivery', () => {
  assert.equal(classifyWork(null), 'unknown');
  assert.equal(classifyWork(), 'unknown');
  const source = input({ issues: [issue('ENG-1', { labels: null })] });
  const before = structuredClone(source);
  const model = buildFeatureRollups(source);
  assert.equal(model.records[0].type, 'unknown');
  assert.equal(model.records[0].completed, true);
  assert.deepEqual(model.features[0].originalIssueIds, ['ENG-1']);
  assert.deepEqual(source, before);
  assert.throws(() => classifyWork('Bug'), /array/);
  assert.throws(() => classifyWork([null]), /string names/);
});
