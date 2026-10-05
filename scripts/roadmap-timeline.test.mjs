import test from 'node:test';
import assert from 'node:assert/strict';
import { renderRoadmapTimeline, packTimelineTracks, scheduleCoverage } from './render-roadmap-timeline.mjs';

const fixture = () => ({
  months: ['Jan', 'Feb', 'Mar'], quarters: [{ label: 'Q1', months: 3 }],
  groups: [{ name: 'Now', items: [{ id: 'delivery', title: 'Reliable delivery', themeId: 't1', themeName: 'Trust', start: 0, duration: 2, windowType: 'scenario', windowLabel: 'Planning scenario', sourceNote: 'Original planning workshop', statusLabel: '2/3 cited tickets Done' }] }],
});

test('compact timeline keeps windows, theme controls and completion scope separate', () => {
  const html = renderRoadmapTimeline(fixture());
  assert.match(html, /--start:0%;--duration:66\.666/);
  assert.match(html, /class="rm-gantt-bar is-scenario"/);
  assert.match(html, /2\/3 cited tickets Done/);
  assert.match(html, /data-roadmap-theme-choice="t1"/);
  assert.match(html, /href="#delivery"/);
  assert.doesNotMatch(html, /width:66|progressbar/);
});

test('timeline rejects invalid dates, missing provenance and duplicate IDs', () => {
  for (const change of [item => { item.duration = 4; }, item => { item.start = NaN; }, item => { item.windowType = ''; }, item => { item.sourceNote = ''; }, item => { item.themeId = 'bad"id'; }]) {
    const model = fixture(); change(model.groups[0].items[0]);
    assert.throws(() => renderRoadmapTimeline(model));
  }
  const model = fixture(); model.groups[0].items.push({ ...model.groups[0].items[0] });
  assert.throws(() => renderRoadmapTimeline(model), /unique/);
});

test('timeline escapes text and rejects calendar mismatch', () => {
  const model = fixture(); model.groups[0].items[0].title = '<script>unsafe</script>';
  assert.doesNotMatch(renderRoadmapTimeline(model), /<script>/);
  model.quarters[0].months = 4;
  assert.throws(() => renderRoadmapTimeline(model), /calendar/);
});

test('reprioritized unscheduled work stays linked without inventing a date bar', () => {
  const model = fixture();
  Object.assign(model.groups[0].items[0], { windowType: 'unscheduled', start: null, duration: null, windowLabel: 'Now · dates not set', sourceNote: 'User raised the priority; no dates supplied' });
  const html = renderRoadmapTimeline(model);
  assert.match(html, /rm-gantt-unscheduled/);
  assert.match(html, /Now · dates not set/);
  assert.match(html, /href="#delivery"/);
  assert.doesNotMatch(html, /class="rm-gantt-bar|--start:|--duration:/);
  model.groups[0].items[0].start = 0;
  assert.throws(() => renderRoadmapTimeline(model), /cannot carry a dated window/);
});

test('theme lanes replace repeated horizon groups and put titles and progress inside bars', () => {
  const model = fixture();
  model.groups.push({ name: 'Next', items: [{ ...model.groups[0].items[0], id: 'access', title: 'Access controls', start: 2, duration: 1 }] });
  const html = renderRoadmapTimeline(model);
  assert.equal((html.match(/data-roadmap-lane="t1"/g) || []).length, 1);
  assert.equal((html.match(/data-roadmap-track>/g) || []).length, 1);
  assert.match(html, /<strong>Theme<\/strong>/);
  assert.match(html, /<a[^>]+class="rm-gantt-bar[^>]*><strong class="rm-gantt-title">Reliable delivery<\/strong><span class="rm-gantt-status">2\/3 cited tickets Done/);
  assert.doesNotMatch(html, /rm-gantt-group|rm-gantt-label/);
});

test('track packing shares free calendar space without shifting any source window', () => {
  const items = [
    { id: 'later', start: 3, duration: 3 },
    { id: 'long', start: 0, duration: 3 },
    { id: 'overlap', start: 1.5, duration: 1.5 },
    { id: 'unknown', windowType: 'unscheduled', start: null, duration: null },
  ];
  const original = structuredClone(items);
  assert.deepEqual(packTimelineTracks(items).map(track => track.map(item => item.id)), [['long', 'later'], ['overlap']]);
  assert.deepEqual(items, original);
});

test('multi-theme work has one primary lane but retains every membership', () => {
  const model = fixture();
  model.themes = [{ id: 't2', name: 'Data' }, { id: 't1', name: 'Trust' }];
  model.groups[0].items[0].throughlineIds = ['t1', 't2'];
  const html = renderRoadmapTimeline(model);
  assert.equal((html.match(/data-roadmap-item="delivery"/g) || []).length, 1);
  assert.match(html, /data-throughlines="t1 t2"/);
  assert.match(html, /Also: Data/);
  assert.doesNotMatch(html, /data-roadmap-lane="t2"/);
  model.groups[0].items[0].throughlineIds = ['t1', 'missing'];
  assert.throws(() => renderRoadmapTimeline(model), /known themes/);
});

test('theme order is explicit and missing titles or conflicting theme names are rejected', () => {
  const model = fixture();
  model.themes = [{ id: 't2', name: 'Data' }, { id: 't1', name: 'Trust' }];
  model.groups[0].items.push({ ...model.groups[0].items[0], id: 'data', themeId: 't2', themeName: 'Data' });
  const html = renderRoadmapTimeline(model);
  assert(html.indexOf('data-roadmap-lane="t2"') < html.indexOf('data-roadmap-lane="t1"'));
  model.groups[0].items[0].title = '';
  assert.throws(() => renderRoadmapTimeline(model), /titles/);
  model.groups[0].items[0].title = 'Delivery';
  model.groups[0].items[0].themeName = 'Something different';
  assert.throws(() => renderRoadmapTimeline(model), /names must agree/);
});

test('an all-undated lane has no calendar track or fake starting position', () => {
  const model = fixture();
  Object.assign(model.groups[0].items[0], { windowType: 'unscheduled', start: null, duration: null, windowLabel: 'Now priority · dates not set' });
  const html = renderRoadmapTimeline(model);
  assert.match(html, /rm-gantt-undated/);
  assert.match(html, /Now priority · dates not set/);
  assert.doesNotMatch(html, /class="rm-gantt-track"|--start:/);
});

test('every timeline states its scheduling coverage', () => {
  const model = fixture();
  model.groups[0].items.push({ ...model.groups[0].items[0], id: 'stated', windowType: 'source-stated', start: 1, duration: 1 }, { ...model.groups[0].items[0], id: 'undated', windowType: 'unscheduled', start: null, duration: null, windowLabel: 'Dates not set' });
  const html = renderRoadmapTimeline(model);
  assert.match(html, /data-schedule-coverage="committed:1 proposed:1 unscheduled:1">1 committed \/ 1 proposed \/ 1 unscheduled</);
  assert.equal(scheduleCoverage(model).handoff, 'Timeline: 1 committed / 1 proposed / 1 unscheduled');
});

test('an all-undated gantt renders the shelf and says why no chart was drawn', () => {
  const model = { groups: [{ name: 'Now', items: [{ id: 'delivery', title: 'Reliable delivery', themeId: 't1', themeName: 'Trust', windowType: 'unscheduled', windowLabel: 'Now · dates not set', sourceNote: 'Tracker has no target dates' }] }] };
  const html = renderRoadmapTimeline(model);
  assert.match(html, /Gantt not drawn: no source-stated or approved dates yet\. 1 initiative needs a date window/);
  assert.match(html, /rm-gantt-unscheduled/);
  assert.match(html, /is-unscheduled-only/);
  assert.doesNotMatch(html, /class="rm-gantt-bar|--start:/);
  assert.equal(scheduleCoverage(model).handoff, 'Gantt not drawn: 0 sourced or approved dates, 1 unscheduled');
  model.groups[0].items[0] = { ...model.groups[0].items[0], windowType: 'scenario', start: 0, duration: 1 };
  assert.throws(() => renderRoadmapTimeline(model), /months, quarters/);
});
