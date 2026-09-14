import assert from 'node:assert/strict';

const safeId = value => typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value);
const dated = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const roles = new Set(['supporting', 'follow-up', 'regression']);
const workTypes = new Set(['capability', 'improvement', 'bug', 'unknown']);

export function classifyWork(labels = []) {
  // Connectors may return null for an unselected optional labels field.
  if (labels == null) return 'unknown';
  assert(Array.isArray(labels), 'Work labels must be an array or null');
  const normalized = labels.map(label => {
    const name = typeof label === 'string' ? label : label?.name;
    assert(typeof name === 'string', 'Work labels need string names');
    return name.toLowerCase();
  });
  if (normalized.includes('bug')) return 'bug';
  if (normalized.includes('feature')) return 'capability';
  if (normalized.includes('improvement')) return 'improvement';
  return 'unknown';
}

export function buildFeatureRollups(input) {
  assert.equal(input.schemaVersion, 1);
  assert(input.baselineId && dated(input.observedAt) && dated(input.since), 'Keep baseline and observation dates');
  assert(Date.parse(input.since) <= Date.parse(input.observedAt));
  const features = new Map();
  for (const feature of input.features) {
    assert(safeId(feature.id) && !features.has(feature.id) && feature.title, 'Features need unique stable IDs');
    assert(Array.isArray(feature.originalIssueIds), 'Retain original citations independently');
    assert.equal(new Set(feature.originalIssueIds).size, feature.originalIssueIds.length);
    const milestones = feature.milestones || [];
    assert.equal(new Set(milestones.map(milestone => milestone.id)).size, milestones.length);
    for (const milestone of milestones) {
      assert(safeId(milestone.id) && milestone.title && milestone.scope && milestone.sourceHref);
      assert(['delivered', 'reported-complete', 'in-progress', 'unknown'].includes(milestone.state));
      if (['delivered', 'reported-complete'].includes(milestone.state)) {
        assert(dated(milestone.completedAt), 'Completed milestones need their own date');
        if (milestone.state === 'delivered') assert(milestone.acceptance, 'Delivery needs scoped acceptance evidence');
      }
    }
    features.set(feature.id, { ...feature, milestones, records: [], secondaryRecords: [] });
  }
  const issues = new Map();
  for (const issue of input.issues) {
    assert(issue.id && issue.title && dated(issue.observedAt), 'Issue records need identity, title and observation');
    assert(!issues.has(issue.id), 'Resolve duplicate observations before building the rollup');
    assert(Date.parse(issue.observedAt) <= Date.parse(input.observedAt));
    issues.set(issue.id, issue);
  }
  for (const feature of features.values()) {
    assert(feature.originalIssueIds.every(id => issues.has(id)), 'Original citations cannot disappear');
  }
  const decisions = new Map();
  for (const decision of input.decisions || []) {
    assert(issues.has(decision.issueId) && !decisions.has(decision.issueId));
    assert(features.has(decision.primaryFeatureId) && decision.sourceHref && decision.reason, 'Mappings need reviewed evidence');
    assert(dated(decision.reviewedAt) && Date.parse(decision.reviewedAt) <= Date.parse(input.observedAt));
    assert(!decision.role || roles.has(decision.role));
    assert(!decision.type || workTypes.has(decision.type));
    assert((decision.secondaryFeatureIds || []).every(id => features.has(id)));
    if (decision.role === 'regression') assert(decision.acceptanceRegression, 'A regression must name the broken acceptance');
    decisions.set(decision.issueId, decision);
  }
  const unmapped = [];
  const records = [];
  for (const issue of issues.values()) {
    const matches = [...features.values()].flatMap(feature => {
      const reasons = [];
      if (feature.originalIssueIds.includes(issue.id)) reasons.push('original citation');
      if (issue.projectId && feature.projectIds?.includes(issue.projectId)) reasons.push('project membership');
      if (issue.parentId && feature.parentIds?.includes(issue.parentId)) reasons.push('parent membership');
      if (issue.projectMilestone?.id && feature.milestoneIds?.includes(issue.projectMilestone.id)) reasons.push('milestone membership');
      return reasons.length ? [{ featureId: feature.id, reasons }] : [];
    });
    const decision = decisions.get(issue.id);
    const originals = matches.filter(match => match.reasons.includes('original citation'));
    const candidates = originals.length ? originals : matches;
    const primaryFeatureId = decision?.primaryFeatureId || (candidates.length === 1 ? candidates[0].featureId : null);
    const primary = features.get(primaryFeatureId);
    const state = issue.statusType || 'unknown';
    const completed = state === 'completed';
    const record = {
      ...issue, type: decision?.type || classifyWork(issue.labels), primaryFeatureId,
      role: primary?.originalIssueIds.includes(issue.id) ? 'original-requirement' : decision?.role || 'supporting',
      membership: { matches, decision: decision || null },
      completed, newlyCompleted: completed && dated(issue.completedAt) && Date.parse(issue.completedAt) > Date.parse(input.since) && Date.parse(issue.completedAt) <= Date.parse(input.observedAt),
      bucket: completed ? 'completed' : ['canceled', 'duplicate'].includes(state) ? 'excluded' : ['backlog', 'unstarted', 'started'].includes(state) ? 'open' : 'unknown',
      secondaryFeatureIds: [...new Set([...matches.map(match => match.featureId), ...(decision?.secondaryFeatureIds || [])])].filter(id => id !== primaryFeatureId),
    };
    records.push(record);
    if (!primary) {
      unmapped.push({ ...record, mappingReason: candidates.length > 1 ? 'Ambiguous feature membership' : 'No verified feature relationship' });
      continue;
    }
    primary.records.push(record);
    for (const id of record.secondaryFeatureIds) features.get(id).secondaryRecords.push(record);
  }
  for (const feature of features.values()) {
    feature.original = feature.originalIssueIds.map(id => records.find(record => record.id === id));
    feature.completed = feature.records.filter(record => record.completed);
    feature.newlyCompleted = feature.completed.filter(record => record.newlyCompleted);
    feature.remainingOriginal = feature.original.filter(record => record.bucket === 'open');
    feature.additionalOpen = feature.records.filter(record => record.bucket === 'open' && record.role !== 'original-requirement');
    const visibleRecords = [...new Map([...feature.original, ...feature.records].map(record => [record.id, record])).values()];
    feature.excluded = visibleRecords.filter(record => record.bucket === 'excluded');
    feature.unknown = visibleRecords.filter(record => record.bucket === 'unknown');
  }
  return {
    schemaVersion: 1, baselineId: input.baselineId, observedAt: input.observedAt, since: input.since,
    features: [...features.values()], records, unmapped,
    totals: {
      mapped: records.filter(record => record.primaryFeatureId).length,
      completed: records.filter(record => record.primaryFeatureId && record.completed).length,
      newlyCompleted: records.filter(record => record.primaryFeatureId && record.newlyCompleted).length,
      unmapped: unmapped.length,
    },
  };
}
