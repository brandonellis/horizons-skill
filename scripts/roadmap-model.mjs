import { gradeOpportunities } from './grade-opportunities.mjs';
import { createHash } from 'node:crypto';

export const HORIZONS = ['now', 'next', 'later'];
export const DELIVERY = ['planned', 'in-progress', 'marked-done', 'verified', 'blocked', 'reopened'];
const text = (value, label) => { if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be nonempty text`); };
const id = (value, label) => { if (typeof value !== 'string' || !/^[a-z][a-z0-9-]*$/.test(value)) throw new Error(`${label} must be a safe stable ID`); };
const date = value => { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error('Evidence needs an ISO timestamp'); };
export const digest = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
export function validateModel(model) {
  if (model?.schemaVersion !== 1) throw new Error('Unsupported roadmap schemaVersion');
  id(model.project?.id, 'Project'); text(model.project.name, 'Project name'); text(model.project.audience, 'Audience');
  if (!Number.isSafeInteger(model.revision) || model.revision < 1) throw new Error('Revision must be a positive integer');
  date(model.observedAt);
  if (!Array.isArray(model.sources) || !Array.isArray(model.items) || !Array.isArray(model.history)) throw new Error('Sources, items and history must be arrays');
  const sources = new Set();
  for (const source of model.sources) {
    id(source.id, 'Source'); if (sources.has(source.id)) throw new Error('Duplicate source ID'); sources.add(source.id);
    text(source.label, 'Source label'); date(source.observedAt);
    if (Date.parse(source.observedAt) > Date.parse(model.observedAt)) throw new Error('Source observation cannot be newer than the evidence snapshot');
    if (!['record', 'anecdote'].includes(source.kind) || typeof source.confirmed !== 'boolean') throw new Error('Source authority needs a tier and confirmation state');
    if (source.href != null && !/^https?:\/\/[^\s<>"']+$/i.test(source.href)) throw new Error('Source links must use HTTP(S); local citations belong in locator');
    if (source.locator != null) text(source.locator, 'Source locator');
  }
  const refs = (values, label, required = false) => {
    if (!Array.isArray(values) || (required && !values.length) || values.some(value => !sources.has(value))) throw new Error(`${label} needs known source refs`);
  };
  const items = new Set();
  for (const item of model.items) {
    id(item.id, 'Item'); if (items.has(item.id)) throw new Error('Duplicate item ID'); items.add(item.id);
    for (const key of ['title', 'stream', 'problem', 'outcome', 'successMeasure', 'nextProof']) text(item[key], key);
    if (item.owner != null) text(item.owner, 'Owner');
    if (item.horizon !== null && !HORIZONS.includes(item.horizon)) throw new Error('Horizon must be now, next, later or null');
    refs(item.refs, 'Item', true);
    if (!DELIVERY.includes(item.delivery?.status)) throw new Error('Unknown delivery state');
    refs(item.delivery.evidenceRefs, 'Delivery', item.delivery.status === 'verified');
    if (!['unmeasured', 'measured'].includes(item.impact?.status)) throw new Error('Impact must be measured or unmeasured');
    text(item.impact.summary, 'Impact summary'); refs(item.impact.evidenceRefs, 'Impact', item.impact.status === 'measured');
    if (item.decision != null) text(item.decision, 'Decision');
  }
  for (const event of model.history) {
    if (!['refresh', 'move', 'grade-plan'].includes(event.type)) throw new Error('Unknown history event');
    date(event.at);
    if (!Number.isSafeInteger(event.revision) || event.revision < 2 || event.revision > model.revision) throw new Error('Invalid history revision');
    if (event.type === 'move') {
      if (!items.has(event.itemId) || !HORIZONS.includes(event.to) || (event.from !== null && !HORIZONS.includes(event.from))) throw new Error('Invalid movement history');
      text(event.reason, 'Movement reason'); text(event.approval, 'Movement approval');
    }
  }
  if (model.gradePlanning) gradeOpportunities(model.gradePlanning);
  return model;
}
export function changesSince(previous, current) {
  validateModel(current); if (!previous) return [];
  validateModel(previous);
  const old = new Map(previous.items.map(item => [item.id, item]));
  const sourceChanges = new Set(current.sources.filter(source => { const prior = previous.sources.find(s => s.id === source.id); const content = ({ observedAt, ...rest }) => rest; return !prior || JSON.stringify(content(prior)) !== JSON.stringify(content(source)); }).map(source => source.id));
  return current.items.flatMap(item => {
    const before = old.get(item.id);
    if (!before) return [{ itemId: item.id, kind: 'added', before: null, after: item.title }];
    const changes = [];
    if (before.delivery.status !== item.delivery.status) changes.push({ itemId: item.id, kind: 'delivery', before: before.delivery.status, after: item.delivery.status });
    if (before.horizon !== item.horizon) changes.push({ itemId: item.id, kind: 'move', before: before.horizon, after: item.horizon });
    if (JSON.stringify(before.impact) !== JSON.stringify(item.impact)) changes.push({ itemId: item.id, kind: 'impact', before: before.impact.summary, after: item.impact.summary });
    if (before.decision !== item.decision) changes.push({ itemId: item.id, kind: 'decision', before: before.decision || 'None recorded', after: item.decision || 'Resolved in sources' });
    if ([...item.refs, ...item.delivery.evidenceRefs, ...item.impact.evidenceRefs].some(id => sourceChanges.has(id)) || JSON.stringify(before.refs) !== JSON.stringify(item.refs) || JSON.stringify(before.delivery.evidenceRefs) !== JSON.stringify(item.delivery.evidenceRefs)) changes.push({ itemId: item.id, kind: 'evidence', before: before.refs, after: item.refs });
    return changes;
  });
}
export function refreshModel(current, snapshot) {
  validateModel(current); validateModel(snapshot);
  if (snapshot.project.id !== current.project.id || snapshot.project.audience !== current.project.audience) throw new Error('Refresh cannot change project or audience');
  if (snapshot.revision !== current.revision) throw new Error('Stale snapshot revision; reread the canonical roadmap');
  if (Date.parse(snapshot.observedAt) < Date.parse(current.observedAt)) throw new Error('Snapshot is older than the roadmap');
  if (JSON.stringify(snapshot.gradePlanning) !== JSON.stringify(current.gradePlanning)) throw new Error('Evidence refresh cannot replace a recorded grade assessment; use the grading workflow');
  if (JSON.stringify(snapshot.history) !== JSON.stringify(current.history)) throw new Error('Refresh cannot rewrite history');
  const incoming = new Map(snapshot.items.map(item => [item.id, item]));
  for (const item of current.items) {
    if (!incoming.has(item.id)) throw new Error(`Refresh omitted ${item.id}; preserve it and record the unresolved source gap`);
    if (incoming.get(item.id).horizon !== item.horizon) throw new Error('Refresh cannot move commitments; use a reviewed movement proposal');
  }
  for (const item of snapshot.items) if (!current.items.some(old => old.id === item.id) && item.horizon !== null) throw new Error('New refresh items need an unplaced horizon until a planning decision');
  const result = structuredClone(snapshot); result.project = structuredClone(current.project);
  result.revision = current.revision + 1;
  result.history.push({ type: 'refresh', revision: result.revision, at: snapshot.observedAt, changes: changesSince(current, snapshot) });
  return validateModel(result);
}
export function applyMoves(current, proposal, { approval, at = new Date().toISOString() } = {}) {
  validateModel(current); text(approval, 'Explicit movement approval'); date(at);
  if (proposal?.schemaVersion !== 1 || proposal.projectId !== current.project.id || proposal.baseRevision !== current.revision || proposal.baseDigest !== digest(current)) throw new Error('Stale or mismatched movement proposal; reread and review the current roadmap');
  if (!Array.isArray(proposal.moves) || !proposal.moves.length) throw new Error('Proposal has no moves');
  const result = structuredClone(current), seen = new Set(); result.revision++;
  for (const move of proposal.moves) {
    const item = result.items.find(item => item.id === move.itemId);
    if (!item || seen.has(item.id) || item.horizon !== move.from || !HORIZONS.includes(move.to) || move.to === move.from) throw new Error('Invalid, duplicate or stale move');
    text(move.reason, 'Movement reason'); seen.add(item.id);
    result.history.push({ type: 'move', revision: result.revision, at, itemId: item.id, from: item.horizon, to: move.to, reason: move.reason, approval });
    item.horizon = move.to;
  }
  // Evidence freshness is unchanged by a planning decision.
  return validateModel(result);
}
export function readEmbeddedModel(html) {
  if (/id=["']roadmap-history["']/.test(html)) throw new Error('Assessed artifacts require the grading workflow; this pipeline cannot replace them');
  const match = html.match(/<script id="horizons-model" type="application\/json"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('No supported Horizons model; preserve this legacy artifact and use its existing workflow');
  return validateModel(JSON.parse(match[1]));
}

export function addGradePlanning(current, input, at = new Date().toISOString()) {
  validateModel(current); gradeOpportunities(input); date(at);
  if (current.gradePlanning && (JSON.stringify(current.gradePlanning.contract) !== JSON.stringify(input.contract) || JSON.stringify(current.gradePlanning.assessment) !== JSON.stringify(input.assessment))) throw new Error('Priorities cannot replace recorded assessments or rubrics; use the grading workflow');
  if (JSON.stringify(current.gradePlanning) === JSON.stringify(input)) return structuredClone(current);
  const next = structuredClone(current); next.gradePlanning = structuredClone(input); next.revision++;
  next.history.push({ type: 'grade-plan', at, revision: next.revision, assessmentId: input.assessment.id });
  return validateModel(next);
}
