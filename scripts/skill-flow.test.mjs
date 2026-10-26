import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSkillFlow, renderSkillFlowSvg, validateSkillFlow, scenarioMembership, skillFlowLayout, skillFlowScript } from './render-skill-flow.mjs';

const model = () => ({
  lanes: [{ id: 'people', label: 'People' }, { id: 'runs', label: 'Steps' }, { id: 'tools', label: 'Tools' }],
  nodes: [
    { id: 'op', kind: 'person', lane: 'people', col: 0, label: 'Operator' },
    { id: 'owner', kind: 'person', lane: 'people', col: 2, label: 'Owner <b>' },
    { id: 'a', kind: 'run', lane: 'runs', col: 0, label: 'Collect', status: 'live' },
    { id: 'b', kind: 'run', lane: 'runs', col: 1, label: 'Research', multiple: true, status: 'building', tag: 'T-2' },
    { id: 'c', kind: 'run', lane: 'runs', col: 2, label: 'Report' },
    { id: 'search', kind: 'tool', lane: 'tools', col: 1, label: 'search', status: 'live' },
  ],
  edges: [
    { from: 'op', to: 'a', kind: 'handoff', label: 'start' },
    { from: 'a', to: 'b', kind: 'handoff' },
    { id: 'skip', from: 'a', to: 'c', kind: 'handoff', label: 'nothing new' },
    { from: 'b', to: 'c', kind: 'handoff' },
    { from: 'c', to: 'owner', kind: 'gate', label: 'sign-off' },
    { from: 'search', to: 'b', kind: 'uses' },
  ],
  scenarios: [
    { id: 'full', label: 'New items', note: 'Every step runs.', members: ['b', 'search'] },
    { id: 'none', label: 'Nothing new', note: 'Research is skipped.', members: ['skip'] },
  ],
  order: [{ node: 'op', title: 'Operator starts it' }, { node: 'a', title: 'Collect', detail: 'one file' }],
});

test('refuses unknown kinds, missing ends, unknown members, duplicate ids and a lone step', () => {
  const kind = model(); kind.nodes[0].kind = 'robot'; assert.throws(() => validateSkillFlow(kind), /kind must be/);
  const ekind = model(); ekind.edges[0].kind = 'maybe'; assert.throws(() => validateSkillFlow(ekind), /kind must be/);
  const missing = model(); missing.edges[1].to = 'nope'; assert.throws(() => validateSkillFlow(missing), /missing node/);
  const member = model(); member.scenarios[0].members.push('ghost'); assert.throws(() => validateSkillFlow(member), /ghost is not a node or edge/);
  const dup = model(); dup.edges[2].id = 'a'; assert.throws(() => validateSkillFlow(dup), /duplicate id a/);
  const overlap = model(); overlap.nodes[5].lane = 'runs'; assert.throws(() => validateSkillFlow(overlap), /overlaps/);
  const halfway = model(); halfway.nodes[5].col = 1.5; assert.equal(validateSkillFlow(halfway), true, 'a half column is allowed');
  const close = model(); close.nodes[3].col = 0.5; assert.throws(() => validateSkillFlow(close), /overlaps/);
  const frac = model(); frac.nodes[5].col = 1.25; assert.throws(() => validateSkillFlow(frac), /whole or half/);
  const gate = model(); gate.edges[4].to = 'a'; assert.throws(() => validateSkillFlow(gate), /gate edge must touch a person/);
  const status = model(); status.nodes[2].status = 'soon'; assert.throws(() => validateSkillFlow(status), /status must be/);
  const order = model(); order.order[0].node = 'x'; assert.throws(() => validateSkillFlow(order), /does not exist/);
  const lone = model(); lone.edges = lone.edges.filter(e => e.kind !== 'handoff' || e.from === 'op'); assert.throws(() => validateSkillFlow(lone), /one step is not a flow/);
  assert.equal(validateSkillFlow(model()), true);
});

test('avenues: unnamed elements are always on, named ones only where listed, edges follow their ends', () => {
  const on = scenarioMembership(model());
  assert.deepEqual(on.a, ['full', 'none']);
  assert.deepEqual(on.b, ['full']);
  assert.deepEqual(on.skip, ['none'], 'a named edge is on only where listed');
  assert.deepEqual(on['edge-1'], ['full'], 'a->b dims when b is off');
});

test('layout comes from lane and column indexes', () => {
  const L = skillFlowLayout(model());
  assert.equal(L.boxes.a.y, L.boxes.b.y, 'same lane, same row, same top');
  assert.ok(L.boxes.b.x > L.boxes.a.x && L.boxes.op.y < L.boxes.a.y && L.boxes.a.y < L.boxes.search.y);
  assert.equal(L.lanes.length, 3);
});

test('renders the swimlane, chips, order and status, escaped and usable without script', () => {
  const html = renderSkillFlow(model());
  assert.match(html, /Owner &lt;b&gt;/);
  assert.doesNotMatch(html, /<b>/);
  assert.match(renderSkillFlowSvg(model()), /class="sf-node sf-run sf-building"[\s\S]*sf-stack/, 'a building, multi-run step draws dashed and stacked');
  assert.match(html, /data-sf="none"/);
  assert.match(html, /class="sf-chips"[^>]*hidden/, 'chips stay hidden until the script runs');
  assert.match(html, /<dl class="sf-avenues"><dt>New items<\/dt>/, 'every avenue is readable as text');
  assert.match(html, /<li class="sf-human"><span class="sf-who">Operator starts it/);
  assert.match(html, /Being built<\/h3><ul><li>Research <span class="sf-ticket">T-2/);
  assert.match(skillFlowScript, /sf-dim/);
});
