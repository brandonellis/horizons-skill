import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCohort, renderCohortSummary, renderCohortDetails } from './render-cohort-findings.mjs';

function fixture() {
  return {
    baselineId: 'initial', assessmentId: 'current', observedAt: '2026-01-02T00:00:00Z', trackerObservedLabel: 'Tracker checked January 3', initialIds: ['APP-1', 'APP-2'],
    findings: [
      { id: 'APP-1', title: 'Original cache requirement', shortTitle: 'Expire cached results', status: 'partial', reason: 'Cache exists; expiry is not implemented.', verifiedWork: 'The cache stores results.', remainingWork: 'Add expiry.', trackerStatus: 'Done', owner: 'Owner', url: 'https://example.com/issues/APP-1', steps: [{ label: 'Store results', status: 'verified' }, { label: 'Expire results', status: 'remaining' }], references: [{ href: '#proof', label: 'Original proof' }], staging: 'Partial', production: 'Not deployed' },
      { id: 'APP-2', title: 'Original retry requirement', shortTitle: 'Retry safely', status: 'fixed', reason: 'Original retry protection is verified.', verifiedWork: 'Idempotent retry guard runs.', remainingWork: 'None for the original finding.', trackerStatus: 'Todo', owner: 'Owner', url: 'https://example.com/issues/APP-2', steps: [{ label: 'Guard retries', status: 'verified' }], references: [{ href: '#proof', label: 'Original proof' }], staging: 'Verified', production: 'Not exercised' },
    ],
  };
}

test('every count and cell opens the exact finding set, not a generic audit', () => {
  const html = renderCohortSummary(fixture());
  assert.match(html, /href="#finding-APP-1"/);
  assert.match(html, /href="#finding-APP-2"/);
  assert.match(html, /data-finding-filter-target="partial">1 partial/);
  assert.match(html, /data-finding-filter-target="fixed">1 fixed/);
  assert.match(html, /Cache exists; expiry is not implemented/);
});

test('partial means verified work plus an unmet original requirement, not ticket state', () => {
  const html = renderCohortDetails(fixture());
  assert.match(html, /data-finding-id="APP-1" data-finding-status="partial"/);
  assert.match(html, /Tracker says Done; the original requirement is not fully verified/);
  assert.match(html, /Store results/); assert.match(html, /Expire results/);
  assert.match(html, /https:\/\/example.com\/issues\/APP-1/);
  assert.match(html, /Tracker checked January 3/);
});

test('a verified finding remains fixed even if the tracker has not been closed', () => {
  const html = renderCohortDetails(fixture());
  assert.match(html, /data-finding-id="APP-2" data-finding-status="fixed"/);
  assert.match(html, /Original code acceptance is verified; the tracker has not been closed/);
});

test('unexplained partials and unverified fixed findings fail validation', () => {
  const model = fixture(); model.findings[0].steps[1].status = 'verified';
  assert.throws(() => validateCohort(model), /Partial needs both/);
  model.findings[0].steps[1].status = 'remaining'; model.findings[1].steps[0].status = 'unknown';
  assert.throws(() => validateCohort(model), /fixed finding still has an unmet/);
});

test('original findings cannot disappear or be duplicated in the comparison', () => {
  const model = fixture(); model.findings.pop();
  assert.throws(() => validateCohort(model), /Every original finding/);
  model.findings.push(model.findings[0]);
  assert.throws(() => validateCohort(model), /Every original finding/);
});

test('untrusted labels are escaped and unsafe evidence navigation is refused', () => {
  const model = fixture(); model.findings[0].shortTitle = '<script>not markup</script>';
  assert.match(renderCohortDetails(model), /&lt;script&gt;/);
  model.findings[0].references[0].href = 'javascript:alert(1)';
  assert.throws(() => renderCohortDetails(model), /HTTPS or local anchors/);
});

function retracted() {
  const model = fixture();
  model.initialIds.push('APP-3');
  model.findings.push({
    id: 'APP-3', title: 'Original size-cap claim', shortTitle: 'Cap request size', status: 'retracted',
    reason: 'The cited file enforces a cap at the cited commit; the finding was never true as written.',
    verifiedWork: 'None claimed.', remainingWork: 'None: the requirement the finding named was already met when it was filed.',
    trackerStatus: 'Todo', owner: 'Owner', url: 'https://example.com/issues/APP-3',
    steps: [{ label: 'Cap request size', status: 'unknown' }], references: [{ href: '#proof', label: 'Original proof' }],
    contradictedBy: [{ href: '#cap-check', label: 'MAX_VALUE_LENGTH check at the cited commit' }], retractedInAssessmentId: 'current',
    staging: 'Not applicable', production: 'Not applicable',
  });
  return model;
}

test('a retracted finding needs its contradicting evidence and the retracting assessment', () => {
  const model = retracted();
  assert.doesNotThrow(() => validateCohort(model));
  const missingEvidence = retracted(); delete missingEvidence.findings[2].contradictedBy;
  assert.throws(() => validateCohort(missingEvidence), /contradicting evidence/);
  const missingAssessment = retracted(); delete missingAssessment.findings[2].retractedInAssessmentId;
  assert.throws(() => validateCohort(missingAssessment), /contradicting evidence/);
  const claimsRemediation = retracted(); claimsRemediation.findings[2].steps[0].status = 'verified';
  assert.throws(() => validateCohort(claimsRemediation), /cannot also claim verified remediation/);
});

test('a retraction is counted as neither fixed nor remaining, and the record stays listed with its evidence', () => {
  const model = retracted();
  const summary = renderCohortSummary(model);
  assert.match(summary, /data-finding-filter-target="fixed">1 fixed/);
  assert.match(summary, /data-finding-filter-target="retracted">1 retracted/);
  assert.match(summary, /class="is-retracted"><a href="#finding-APP-3"/);
  const details = renderCohortDetails(model);
  assert.match(details, /1 need closure · 1 fixed in code · 1 retracted/);
  assert.match(details, /data-finding-id="APP-3" data-finding-status="retracted"/);
  assert.match(details, /Retracted in current/);
  assert.match(details, /MAX_VALUE_LENGTH check at the cited commit/);
  assert.match(details, /data-finding-filter="retracted"/);
  assert.doesNotMatch(details, /APP-3[\s\S]{0,400}Tracker says Done/);
  // The denominator is unchanged: three originals, all still listed.
  assert.match(details, /3 original findings/);
});
