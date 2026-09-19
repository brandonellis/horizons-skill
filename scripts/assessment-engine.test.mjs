import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIERS, canonical, fingerprint, contractFingerprint, validateContract, evaluateAssessment, compareFindings, sealHistory, verifyHistory } from './assessment-engine.mjs';

function fixture() {
  const contract = {
    schemaVersion: 1, id: 'instrument-1', baselineId: 'initial', status: 'approved',
    aggregation: 'lowest-mandatory-cell', scopes: ['code', 'staging', 'production'],
    initialFindingIds: ['finding-1'], findingEvidenceMaxAgeHours: 24,
    cells: ['code', 'staging', 'production'].map(scope => ({ id: `${scope}-testing`, component: 'platform', dimension: 'testing', scope, mandatory: true })),
  };
  contract.criteria = contract.cells.flatMap(cell => TIERS.slice(1).map(tier => ({ id: `${cell.id}-${tier}`, cellId: cell.id, tier, test: `Observable ${tier} check`, method: 'Run the declared probe', maxAgeHours: 24, thisAssessment: true })));
  contract.approval = { reference: 'User confirmed this exact contract', approvedAt: '2026-01-01T00:00:00Z', contractHash: contractFingerprint(contract) };
  const sourceCodeRefs = [{ scope: 'code', repository: 'example', commit: 'a'.repeat(40) }];
  const runtimeRefs = ['staging', 'production'].map(scope => ({ scope, service: 'web', revision: 'revision-1', commit: 'a'.repeat(40), imageDigest: `sha256:${'b'.repeat(64)}` }));
  const subjects = [...sourceCodeRefs, ...runtimeRefs];
  const evidence = scope => ({ evidenceRefs: ['evidence/probe.json'], observedAt: '2026-01-02T00:00:00Z', assessmentId: 'current', subject: subjects.find(subject => subject.scope === scope) });
  const assessment = {
    id: 'current', baselineId: 'initial', contractId: contract.id, contractHash: contractFingerprint(contract), observedAt: '2026-01-02T01:00:00Z', sourceCodeRefs, runtimeRefs,
    observations: contract.criteria.map(criterion => ({ criterionId: criterion.id, result: 'pass', ...evidence(contract.cells.find(cell => cell.id === criterion.cellId).scope) })),
    findings: contract.scopes.map(scope => ({ id: 'finding-1', scope, status: 'resolved', blocking: true, ...evidence(scope) })),
    coverageGaps: [],
  };
  return { contract, assessment };
}

test('unchanged evidence produces exactly the same verdict and denominator', () => {
  const { contract, assessment } = fixture();
  const first = evaluateAssessment(contract, assessment);
  assert.deepEqual(first, evaluateAssessment(JSON.parse(JSON.stringify(contract)), JSON.parse(JSON.stringify(assessment))));
  assert.equal(first.scopes.production.grade, 'A+');
  assert.equal(first.scopes.production.progress.denominator, 1);
});

test('draft contracts cannot award grades even with perfect observations', () => {
  const { contract, assessment } = fixture(); contract.status = 'draft'; delete contract.approval;
  assert.equal(evaluateAssessment(contract, assessment).scopes.code.grade, null);
  assert.equal(evaluateAssessment(contract, assessment).scopes.code.status, 'contract-pending');
});

test('changing approved criteria, denominators or thresholds invalidates approval', () => {
  for (const change of [contract => contract.criteria.pop(), contract => contract.initialFindingIds.push('another'), contract => contract.criteria[0].maxAgeHours++]) {
    const { contract } = fixture(); change(contract);
    assert.throws(() => validateContract(contract), /changed without new approval/);
  }
});

test('missing, stale, future, wrong-run and undocumented evidence never earns a pass', () => {
  for (const change of [observation => observation.evidenceRefs = [], observation => observation.observedAt = '2025-01-01T00:00:00Z', observation => observation.observedAt = '2027-01-01T00:00:00Z', observation => observation.assessmentId = 'previous', observation => observation.result = 'unknown']) {
    const { contract, assessment } = fixture(); change(assessment.observations[0]);
    assert.equal(evaluateAssessment(contract, assessment).scopes.code.status, 'incomplete');
  }
  const { contract, assessment } = fixture(); assessment.observations.shift();
  assert.equal(evaluateAssessment(contract, assessment).scopes.code.grade, null);
});

test('code and staging fixes cannot pass production or mismatched revisions', () => {
  const { contract, assessment } = fixture();
  const production = assessment.observations.find(observation => observation.subject.scope === 'production');
  production.subject = { ...assessment.runtimeRefs[0] };
  const result = evaluateAssessment(contract, assessment);
  assert.equal(result.scopes.staging.grade, 'A+');
  assert.equal(result.scopes.production.grade, null);
  production.subject = { ...assessment.runtimeRefs[1], revision: 'unverified' };
  assert.equal(evaluateAssessment(contract, assessment).scopes.production.grade, null);
});

test('Done is not verified closure and stale closure evidence becomes unknown', () => {
  const { contract, assessment } = fixture();
  assessment.findings[2].trackerStatus = 'Done'; assessment.findings[2].status = 'open';
  let result = evaluateAssessment(contract, assessment).scopes.production;
  assert.equal(result.grade, 'A'); assert.equal(result.progress.resolvedIds.length, 0);
  assessment.findings[2].status = 'resolved'; assessment.findings[2].evidenceRefs = [];
  result = evaluateAssessment(contract, assessment).scopes.production;
  assert.equal(result.grade, null); assert.equal(result.progress.unknownIds.length, 1);
});

test('new blockers prevent A+ without increasing the original denominator', () => {
  const { contract, assessment } = fixture();
  assessment.findings.push({ id: 'new-exposure', scope: 'production', status: 'open', blocking: true });
  const result = evaluateAssessment(contract, assessment).scopes.production;
  assert.equal(result.grade, 'A'); assert.equal(result.progress.denominator, 1);
  assert.deepEqual(result.progress.newOpenIds, ['new-exposure']);
});

test('missing original findings fail validation rather than disappearing', () => {
  const { contract, assessment } = fixture(); assessment.findings.pop();
  assert.throws(() => evaluateAssessment(contract, assessment), /Missing original finding/);
});

test('scope coverage gaps and disabled gates block readiness', () => {
  const { contract, assessment } = fixture();
  assessment.coverageGaps.push({ scope: 'production', reason: 'New service has no approved criteria' });
  assert.equal(evaluateAssessment(contract, assessment).scopes.production.grade, null);
  assessment.coverageGaps = [];
  assessment.observations.find(observation => observation.criterionId === 'production-testing-A+').result = 'fail';
  assert.equal(evaluateAssessment(contract, assessment).scopes.production.grade, 'A');
});

test('highest fully passed cumulative tier wins, not an average', () => {
  const { contract, assessment } = fixture();
  assessment.observations.find(observation => observation.criterionId === 'code-testing-B').result = 'fail';
  assert.equal(evaluateAssessment(contract, assessment).scopes.code.grade, 'C');
});

test('without explicit A+ tests the ceiling is A', () => {
  const { contract, assessment } = fixture();
  contract.criteria = contract.criteria.filter(criterion => criterion.tier !== 'A+');
  contract.approval.contractHash = contractFingerprint(contract); assessment.contractHash = contractFingerprint(contract);
  assessment.observations = assessment.observations.filter(observation => !observation.criterionId.endsWith('A+'));
  assert.equal(evaluateAssessment(contract, assessment).scopes.production.grade, 'A');
});

test('not-applicable requires an exception frozen in the contract', () => {
  const { contract, assessment } = fixture(); assessment.observations[0].result = 'not-applicable';
  assert.equal(evaluateAssessment(contract, assessment).scopes.code.grade, null);
  contract.criteria[0].notApplicableReason = 'Approved applicability exception';
  contract.approval.contractHash = contractFingerprint(contract); assessment.contractHash = contractFingerprint(contract);
  assert.equal(evaluateAssessment(contract, assessment).scopes.code.grade, 'A+');
});

test('duplicate observations and unsupported tiers are rejected', () => {
  const { contract, assessment } = fixture(); assessment.observations.push(assessment.observations[0]);
  assert.throws(() => evaluateAssessment(contract, assessment), /Duplicate/);
  contract.criteria[0].tier = 'B+'; assert.throws(() => validateContract(contract), /no D acceptance test|Unsupported tier/);
});

test('reopened original findings reduce progress; missing comparisons stay unavailable', () => {
  const result = compareFindings(['old'], [{ id: 'old', status: 'resolved' }], [{ id: 'old', status: 'partial' }, { id: 'new', status: 'open' }]);
  assert.equal(result.denominator, 1); assert.deepEqual(result.sincePrevious.reopenedIds, ['old']);
  assert.equal(result.resolvedFraction, 0);
  assert.equal(compareFindings([], null, []).resolvedFraction, null);
  assert.equal(compareFindings([], null, []).sincePrevious, null);
});

test('history permits append-only assessments and rejects edited or removed originals', () => {
  const ledger = { originalBaselineId: 'initial', originalBaseline: { asReported: 'B+' }, assessments: [{ id: 'first', grade: 'B+' }] };
  const lock = sealHistory(ledger); ledger.assessments.push({ id: 'second', grade: 'B' });
  assert.equal(verifyHistory(lock, ledger), true);
  ledger.assessments[0].grade = 'A'; assert.throws(() => verifyHistory(lock, ledger), /Historical assessment/);
  ledger.assessments.shift(); assert.throws(() => verifyHistory(lock, ledger), /Historical assessment/);
  ledger.originalBaseline.asReported = 'A'; assert.throws(() => verifyHistory(lock, ledger), /Original baseline/);
});

test('canonical fingerprints ignore object key order but preserve ordered evidence', () => {
  assert.equal(fingerprint({ beta: 2, alpha: 1 }), fingerprint({ alpha: 1, beta: 2 }));
  assert.notEqual(fingerprint(['first', 'second']), fingerprint(['second', 'first']));
  assert.throws(() => canonical({ missing: undefined }), /finite JSON/);
});

test('the weakest mandatory dimension limits a scope, not optional cells', () => {
  const { contract, assessment } = fixture();
  for (const [id, mandatory] of [['code-security', true], ['code-optional', false]]) {
    contract.cells.push({ id, component: 'platform', dimension: id, scope: 'code', mandatory });
    for (const tier of TIERS.slice(1)) {
      contract.criteria.push({ ...contract.criteria[0], id: `${id}-${tier}`, cellId: id, tier });
      assessment.observations.push({ ...assessment.observations[0], criterionId: `${id}-${tier}`, result: id === 'code-optional' || tier === 'B' ? 'fail' : 'pass' });
    }
  }
  contract.approval.contractHash = contractFingerprint(contract); assessment.contractHash = contractFingerprint(contract);
  const result = evaluateAssessment(contract, assessment);
  assert.equal(result.scopes.code.grade, 'C');
  assert.deepEqual(result.scopes.code.limitingCells, ['code-security']);
});

test('combined operational A+ requires every in-scope tier', () => {
  const { contract, assessment } = fixture();
  assessment.coverageGaps.push({ scope: 'production', reason: 'Production access unavailable' });
  const result = evaluateAssessment(contract, assessment);
  assert.equal(result.scopes.staging.aPlusCertified, true);
  assert.equal(result.operationalOverall.aPlusCertified, false);
  assert.equal(result.operationalOverall.grade, null);
  assert.equal(result.observedAt, assessment.observedAt);
});

test('a later approval cannot reinterpret an earlier assessment', () => {
  const { contract, assessment } = fixture(); contract.approval.approvedAt = '2026-01-03T00:00:00Z';
  assert.throws(() => evaluateAssessment(contract, assessment), /retroactively/);
});

test('a retraction needs contradicting evidence, blocks nothing, and never counts as resolved', () => {
  const { contract, assessment } = fixture();
  const evidence = assessment.findings[0];
  assessment.findings.push({ id: 'phantom', scope: 'production', status: 'retracted', blocking: true, contradictedBy: ['src/limits.mjs at the cited commit enforces the cap'], retractedInAssessmentId: 'current', evidenceRefs: evidence.evidenceRefs, observedAt: evidence.observedAt, assessmentId: 'current', subject: evidence.subject });
  const result = evaluateAssessment(contract, assessment);
  assert.deepEqual(result.scopes.production.blockers, [], 'a retracted finding is not owed, so it cannot block');
  assert.equal(result.scopes.production.grade, 'A+');
  assert.deepEqual(result.scopes.production.progress.newRetractedIds, ['phantom']);
  assert.deepEqual(result.scopes.production.progress.newOpenIds, []);
  for (const strip of [finding => delete finding.contradictedBy, finding => { finding.contradictedBy = []; }, finding => delete finding.retractedInAssessmentId, finding => { finding.contradictedBy = ['  ']; }]) {
    const broken = fixture(); broken.assessment.findings.push({ ...assessment.findings.at(-1) }); strip(broken.assessment.findings.at(-1));
    assert.throws(() => evaluateAssessment(broken.contract, broken.assessment), /contradicting evidence and the retracting assessment/);
  }
});

test('retracting an original finding leaves the denominator and the resolved fraction alone', () => {
  const result = compareFindings(['old', 'never'], [{ id: 'old', status: 'resolved' }, { id: 'never', status: 'open' }], [{ id: 'old', status: 'resolved' }, { id: 'never', status: 'retracted' }, { id: 'extra', status: 'retracted' }]);
  assert.equal(result.denominator, 2);
  assert.deepEqual(result.resolvedIds, ['old']);
  assert.deepEqual(result.retractedIds, ['never']);
  assert.equal(result.resolvedFraction, 0.5, 'a retraction is not a closure and must not lift the fraction');
  assert.deepEqual(result.newOpenIds, []);
  assert.deepEqual(result.newRetractedIds, ['extra']);
  assert.deepEqual(result.sincePrevious.newlyRetractedIds, ['extra', 'never']);
  assert.deepEqual(result.sincePrevious.reopenedIds, []);
});

test('a previously resolved finding that is now retracted is not reported as reopened', () => {
  const result = compareFindings(['old'], [{ id: 'old', status: 'resolved' }], [{ id: 'old', status: 'retracted' }]);
  assert.deepEqual(result.sincePrevious.reopenedIds, []);
  assert.deepEqual(result.sincePrevious.newlyRetractedIds, ['old']);
  assert.deepEqual(result.resolvedIds, []);
});
