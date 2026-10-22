import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLearningWheel, renderLoopCycle, validateLearningWheel, wheelSummary, loopWitnessed } from './render-learning-wheel.mjs';

const stages = state => ['signal', 'transform', 'artifact', 'consumption'].map(id => ({ id, state, label: id, note: 'n' }));
const model = () => ({
  observedOn: '2026-10-22',
  targets: [{ id: 'memory', label: 'Account memory' }, { id: 'rubric', label: 'Scoring rubric' }],
  loops: [
    { id: 'a', name: 'Account learning', status: 'on', learnsFrom: 'rep feedback', improves: 'memory', stages: stages('observed') },
    { id: 'b', name: 'Calibration', status: 'idle', learnsFrom: 'deal outcomes', improves: 'rubric', whyStatus: 'No outcomes yet', stages: stages('unknown') },
    { id: 'c', name: 'Sharing <script>', status: 'off', learnsFrom: 'proven plays', improves: 'memory', whyStatus: 'Paid add-on', stages: [...stages('observed').slice(0, 3), { id: 'consumption', state: 'unknown', label: 'x', note: 'n' }], tickets: [{ id: 'T-1', href: 'javascript:alert(1)' }] },
  ],
});

test('refuses a loop that is off with no reason, an unknown target, or a bad status', () => {
  const m = model(); delete m.loops[2].whyStatus; assert.throws(() => validateLearningWheel(m), /needs whyStatus/);
  const n = model(); n.loops[0].improves = 'nope'; assert.throws(() => validateLearningWheel(n), /must name a target/);
  const o = model(); o.loops[0].status = 'maybe'; assert.throws(() => validateLearningWheel(o), /status must be/);
  const p = model(); p.loops[0].stages = p.loops[0].stages.slice(0, 3); assert.throws(() => validateLearningWheel(p), /stages must be/);
});

test('a loop is seen working only when every stage is observed, and only then gets a moving current', () => {
  const m = model();
  assert.equal(loopWitnessed(m.loops[0]), true);
  assert.equal(loopWitnessed(m.loops[2]), false, 'three observed stages are not a closed loop');
  assert.match(renderLoopCycle(m.loops[0]), /lw-current/);
  assert.doesNotMatch(renderLoopCycle(m.loops[2]), /lw-current/);
  assert.match(renderLoopCycle(m.loops[0]), /lw-return/, 'the return arrow is drawn');
});

test('summary counts and the rendered section escape text and drop unsafe links', () => {
  const m = model();
  assert.deepEqual(wheelSummary(m), { on: 1, older: 1, off: 1, total: 3, witnessed: 1 });
  const html = renderLearningWheel(m);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Sharing &lt;script&gt;/);
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /1 on<\/strong>/);
  assert.ok(html.indexOf('lw-loop-a') < html.indexOf('lw-loop-b') && html.indexOf('lw-loop-b') < html.indexOf('lw-loop-c'), 'on, then waiting, then off');
});

test('flywheel: refuses unknown links, draws the four stages, and moves only when a loop was seen working', async () => {
  const { renderFlywheel, validateFlywheel } = await import('./render-learning-wheel.mjs');
  const m = model();
  m.flywheel = { products: [{ id: 'plans', label: 'Account plans' }], responses: [{ id: 'fb', label: 'Rep feedback' }], guards: [{ id: 'g', label: 'Model checks', status: 'on' }] };
  m.targets[0].feeds = ['plans'];
  m.loops[0].responses = ['fb'];
  const bad = structuredClone(m); bad.targets[0].feeds = ['nope']; assert.throws(() => validateFlywheel(bad), /unknown product/);
  const bad2 = structuredClone(m); bad2.loops[0].responses = ['nope']; assert.throws(() => validateFlywheel(bad2), /unknown response/);
  const svg = renderFlywheel(m);
  for (const s of ['Agents', 'People', 'Loops', 'Knowledge', 'WATCHING THE CYCLE', 'uses account memory', 'feeds account plans']) assert.match(svg, new RegExp(s));
  assert.match(svg, /lw-current/);
  const still = structuredClone(m); still.loops[0].stages = still.loops[0].stages.map(s => ({ ...s, state: 'carried' }));
  assert.doesNotMatch(renderFlywheel(still), /lw-current/);
  assert.match(renderLearningWheel(m), /lw-flywheel/, 'the section uses the flywheel when the model has one');
  assert.match(renderLearningWheel(m), /lw-fw-list[\s\S]*Rep feedback[\s\S]*feeds account plans/, 'with a stacked version of the same stages');
  assert.doesNotMatch(renderLearningWheel(model()), /lw-flywheel/, 'and the overview otherwise');
});
