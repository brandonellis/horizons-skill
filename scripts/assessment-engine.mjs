import { createHash } from 'node:crypto';

export const TIERS = ['F', 'D', 'C', 'B', 'A', 'A+'];

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  if (value === undefined || (typeof value === 'number' && !Number.isFinite(value))) {
    throw new Error('Only finite JSON values can be hashed');
  }
  return JSON.stringify(value);
}

export function fingerprint(value) {
  return createHash('sha256').update(canonical(value)).digest('hex');
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(values, name) {
  requireValue(Array.isArray(values), `${name} must be an array`);
  requireValue(values.every(value => typeof value === 'string' && value.length > 0), `${name} needs nonempty IDs`);
  requireValue(new Set(values).size === values.length, `Duplicate ${name}`);
}

function timestamp(value) {
  return typeof value === 'string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
}

export function contractFingerprint(contract) {
  const { approval, status, ...instrument } = contract;
  return fingerprint(instrument);
}

export function validateContract(contract) {
  requireValue(contract.schemaVersion === 1, 'Unsupported contract schema');
  requireValue(typeof contract.id === 'string' && contract.id.length > 0, 'Missing contract ID');
  requireValue(typeof contract.baselineId === 'string' && contract.baselineId.length > 0, 'Missing original baseline');
  requireValue(['draft', 'approved'].includes(contract.status), 'Invalid contract status');
  requireValue(contract.aggregation === 'lowest-mandatory-cell', 'Unsupported aggregation policy');
  unique(contract.scopes, 'scopes');
  unique(contract.initialFindingIds, 'initial finding IDs');
  requireValue(contract.scopes.length > 0 && contract.cells?.length > 0, 'Contract needs scope and cells');
  unique(contract.cells.map(cell => cell.id), 'cell IDs');
  unique(contract.criteria?.map(criterion => criterion.id), 'criterion IDs');
  requireValue(Number.isFinite(contract.findingEvidenceMaxAgeHours) && contract.findingEvidenceMaxAgeHours > 0, 'Invalid finding evidence window');
  for (const scope of contract.scopes) {
    requireValue(contract.cells.some(cell => cell.scope === scope && cell.mandatory === true), `No mandatory cells in ${scope}`);
  }
  for (const cell of contract.cells) {
    requireValue(contract.scopes.includes(cell.scope), `Unknown scope for ${cell.id}`);
    requireValue(typeof cell.mandatory === 'boolean' && cell.component && cell.dimension, `Invalid cell ${cell.id}`);
    for (const tier of ['D', 'C', 'B', 'A']) {
      requireValue(contract.criteria.some(criterion => criterion.cellId === cell.id && criterion.tier === tier), `${cell.id} has no ${tier} acceptance test`);
    }
  }
  for (const criterion of contract.criteria) {
    requireValue(contract.cells.some(cell => cell.id === criterion.cellId), `Unknown cell for ${criterion.id}`);
    requireValue(TIERS.slice(1).includes(criterion.tier), `Unsupported tier for ${criterion.id}`);
    requireValue(typeof criterion.test === 'string' && criterion.test.trim() && typeof criterion.method === 'string' && criterion.method.trim(), `Missing observable test for ${criterion.id}`);
    requireValue(Number.isFinite(criterion.maxAgeHours) && criterion.maxAgeHours > 0, `Invalid evidence window for ${criterion.id}`);
    requireValue(typeof criterion.thisAssessment === 'boolean', `Missing observation policy for ${criterion.id}`);
    if (criterion.notApplicableReason !== undefined) requireValue(criterion.notApplicableReason.trim().length > 0, `Empty applicability exception for ${criterion.id}`);
  }
  if (contract.status === 'approved') {
    requireValue(contract.approval?.reference && Number.isFinite(timestamp(contract.approval.approvedAt)), 'An approved contract needs a dated approval reference');
    requireValue(contract.approval.contractHash === contractFingerprint(contract), 'Approved contract changed without new approval');
  }
  return contractFingerprint(contract);
}

function evidenceResult(record, assessment, scope, maxAgeHours, thisAssessment) {
  if (!record || record.result === 'unknown') return 'unknown';
  if (!Array.isArray(record.evidenceRefs) || !record.evidenceRefs.length || !record.evidenceRefs.every(ref => typeof ref === 'string' && ref.trim())) return 'unknown';
  const observed = timestamp(record.observedAt);
  const assessed = timestamp(assessment.observedAt);
  if (!Number.isFinite(observed) || observed > assessed || assessed - observed > maxAgeHours * 3_600_000) return 'unknown';
  if (thisAssessment && record.assessmentId !== assessment.id) return 'unknown';
  const references = scope === 'code' ? assessment.sourceCodeRefs : assessment.runtimeRefs;
  const subject = record.subject;
  if (!subject || subject.scope !== scope || !Array.isArray(references)) return 'unknown';
  if (scope === 'code') {
    if (!subject.repository || !/^[a-f\d]{40}$/i.test(subject.commit ?? '')) return 'unknown';
  } else if (!subject.service || !subject.revision || !/sha256:[a-f\d]{64}$/i.test(subject.imageDigest ?? '') || !/^[a-f\d]{40}$/i.test(subject.commit ?? '')) return 'unknown';
  if (!references.some(reference => canonical(reference) === canonical(subject))) return 'unknown';
  return record.result;
}

export function evaluateAssessment(contract, assessment) {
  const contractHash = validateContract(contract);
  requireValue(assessment.id && Number.isFinite(timestamp(assessment.observedAt)), 'Invalid assessment identity or timestamp');
  if (contract.status === 'approved') requireValue(timestamp(assessment.observedAt) >= timestamp(contract.approval.approvedAt), 'Cannot apply a later approval retroactively');
  requireValue(assessment.baselineId === contract.baselineId && assessment.contractId === contract.id && assessment.contractHash === contractHash, 'Assessment does not match frozen contract');
  unique(assessment.observations?.map(observation => observation.criterionId), 'observation criterion IDs');
  unique(assessment.findings?.map(finding => `${finding.scope}:${finding.id}`), 'finding states');
  const observations = new Map(assessment.observations.map(observation => [observation.criterionId, observation]));
  for (const observation of assessment.observations) {
    requireValue(contract.criteria.some(criterion => criterion.id === observation.criterionId), `Unknown criterion ${observation.criterionId}`);
    requireValue(['pass', 'fail', 'unknown', 'not-applicable'].includes(observation.result), `Invalid observation result for ${observation.criterionId}`);
  }
  for (const finding of assessment.findings) {
    requireValue(contract.scopes.includes(finding.scope) && finding.id, 'Unknown finding scope or ID');
    requireValue(['resolved', 'partial', 'open', 'unknown', 'retracted'].includes(finding.status) && typeof finding.blocking === 'boolean', `Invalid finding ${finding.id}`);
    // A retraction says the finding was never true as written. It is not a
    // closure, so it earns none of the evidence-freshness pass `resolved` gets,
    // and it must carry what contradicts it and which assessment said so.
    if (finding.status === 'retracted') requireValue(Array.isArray(finding.contradictedBy) && finding.contradictedBy.length > 0 && finding.contradictedBy.every(reference => typeof reference === 'string' && reference.trim()) && typeof finding.retractedInAssessmentId === 'string' && finding.retractedInAssessmentId.trim(), `Retracted finding ${finding.id} needs contradicting evidence and the retracting assessment`);
  }
  for (const gap of assessment.coverageGaps ?? []) requireValue(contract.scopes.includes(gap.scope) && gap.reason, 'Invalid coverage gap');
  const cells = contract.cells.map(cell => {
    const criteria = contract.criteria.filter(criterion => criterion.cellId === cell.id).map(criterion => {
      const observation = observations.get(criterion.id);
      let result = evidenceResult(observation, assessment, cell.scope, criterion.maxAgeHours, criterion.thisAssessment);
      if (result === 'not-applicable') result = criterion.notApplicableReason ? 'pass' : 'unknown';
      return { id: criterion.id, tier: criterion.tier, result, test: criterion.test };
    });
    let verifiedTier = 'F';
    for (const tier of TIERS.slice(1)) {
      const required = criteria.filter(criterion => criterion.tier === tier);
      if (!required.length || required.some(criterion => criterion.result !== 'pass')) break;
      verifiedTier = tier;
    }
    const incomplete = criteria.some(criterion => criterion.result === 'unknown');
    const nextTier = TIERS[TIERS.indexOf(verifiedTier) + 1];
    return { ...cell, verifiedTier, grade: incomplete || contract.status !== 'approved' ? null : verifiedTier, incomplete, criteria, nextChecks: criteria.filter(criterion => criterion.tier === nextTier && criterion.result !== 'pass') };
  });
  const scopes = {};
  for (const scope of contract.scopes) {
    const mandatory = cells.filter(cell => cell.scope === scope && cell.mandatory);
    const states = assessment.findings.filter(finding => finding.scope === scope).map(finding => ({ ...finding, status: finding.status === 'resolved' && evidenceResult({ ...finding, result: 'pass' }, assessment, scope, contract.findingEvidenceMaxAgeHours, true) !== 'pass' ? 'unknown' : finding.status }));
    for (const id of contract.initialFindingIds) requireValue(states.some(finding => finding.id === id), `Missing original finding ${id} in ${scope}; use unknown, not omission`);
    const progress = compareFindings(contract.initialFindingIds, null, states);
    const blockers = states.filter(finding => finding.status !== 'resolved' && finding.status !== 'retracted' && (contract.initialFindingIds.includes(finding.id) || finding.blocking)).map(finding => finding.id).sort();
    const incomplete = mandatory.some(cell => cell.incomplete) || states.some(finding => finding.status === 'unknown' && (contract.initialFindingIds.includes(finding.id) || finding.blocking)) || (assessment.coverageGaps ?? []).some(gap => gap.scope === scope);
    const limitingRank = Math.min(...mandatory.map(cell => TIERS.indexOf(cell.verifiedTier)));
    let grade = TIERS[limitingRank];
    if (grade === 'A+' && blockers.length) grade = 'A';
    const status = contract.status !== 'approved' ? 'contract-pending' : incomplete ? 'incomplete' : 'assessed';
    scopes[scope] = { status, grade: status === 'assessed' ? grade : null, limitingCells: mandatory.filter(cell => TIERS.indexOf(cell.verifiedTier) === limitingRank).map(cell => cell.id), blockers, progress, aPlusCertified: status === 'assessed' && grade === 'A+' };
  }
  const operationalScopes = contract.scopes.filter(scope => scope !== 'code');
  const operationalComplete = operationalScopes.length > 0 && operationalScopes.every(scope => scopes[scope].status === 'assessed');
  const operationalGrade = operationalComplete ? TIERS[Math.min(...operationalScopes.map(scope => TIERS.indexOf(scopes[scope].grade)))] : null;
  const operationalOverall = { scopes: operationalScopes, grade: operationalGrade, aPlusCertified: operationalComplete && operationalGrade === 'A+' };
  return { assessmentId: assessment.id, observedAt: assessment.observedAt, baselineId: contract.baselineId, contractHash, cells, scopes, operationalOverall };
}

export function compareFindings(initialIds, previous, current) {
  unique(initialIds, 'initial finding IDs');
  for (const [name, states] of [['current', current], ['previous', previous]]) {
    if (states === null) continue;
    unique(states.map(state => state.id), `${name} findings`);
    for (const state of states) requireValue(['resolved', 'partial', 'open', 'unknown', 'retracted'].includes(state.status), `Invalid ${name} finding status`);
    for (const id of initialIds) requireValue(states.some(state => state.id === id), `Missing original ${name} finding ${id}`);
  }
  const cohort = current.filter(state => initialIds.includes(state.id));
  const ids = status => cohort.filter(state => state.status === status).map(state => state.id).sort();
  const resolvedIds = ids('resolved');
  const retractedIds = ids('retracted');
  const outside = current.filter(state => !initialIds.includes(state.id));
  const before = previous === null ? null : new Set(previous.filter(state => initialIds.includes(state.id) && state.status === 'resolved').map(state => state.id));
  const previouslyRetracted = previous === null ? new Set() : new Set(previous.filter(state => state.status === 'retracted').map(state => state.id));
  // The denominator never shrinks and a retraction never joins the resolved
  // count: `resolvedFraction` is still resolved over ALL original findings.
  // Retractions are reported beside it so a reader can see how many of the
  // original findings turned out to be the panel's error rather than the
  // project's debt, without that error ever reading as progress.
  return {
    denominator: initialIds.length, resolvedIds, partialIds: ids('partial'), openIds: ids('open'), unknownIds: ids('unknown'), retractedIds,
    resolvedFraction: initialIds.length ? resolvedIds.length / initialIds.length : null,
    newOpenIds: outside.filter(state => state.status !== 'resolved' && state.status !== 'retracted').map(state => state.id).sort(),
    newRetractedIds: outside.filter(state => state.status === 'retracted').map(state => state.id).sort(),
    sincePrevious: before === null ? null : {
      newlyResolvedIds: resolvedIds.filter(id => !before.has(id)),
      // A finding that was resolved before and is retracted now was never
      // owed, so it is not "reopened": it moved from one non-debt state to
      // another and appears under newlyRetractedIds instead.
      reopenedIds: [...before].filter(id => !resolvedIds.includes(id) && !retractedIds.includes(id)).sort(),
      newlyRetractedIds: current.filter(state => state.status === 'retracted' && !previouslyRetracted.has(state.id)).map(state => state.id).sort(),
    },
  };
}

export function sealHistory(ledger) {
  requireValue(ledger.originalBaselineId && Array.isArray(ledger.assessments), 'Missing historical lineage');
  unique(ledger.assessments.map(assessment => assessment.id), 'assessment IDs');
  return {
    schemaVersion: 1,
    originalBaselineId: ledger.originalBaselineId,
    originalBaselineHash: fingerprint(ledger.originalBaseline ?? ledger.baselines?.find(baseline => baseline.id === ledger.originalBaselineId)),
    assessments: ledger.assessments.map(assessment => ({ id: assessment.id, hash: fingerprint(assessment) })),
  };
}

export function verifyHistory(lock, ledger) {
  const current = sealHistory(ledger);
  requireValue(lock.originalBaselineId === current.originalBaselineId && lock.originalBaselineHash === current.originalBaselineHash, 'Original baseline changed');
  for (const [index, record] of lock.assessments.entries()) {
    requireValue(current.assessments[index]?.id === record.id && current.assessments[index]?.hash === record.hash, `Historical assessment changed or disappeared: ${record.id}`);
  }
  return true;
}
