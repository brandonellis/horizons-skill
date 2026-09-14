import assert from 'node:assert/strict';
import test from 'node:test';
import { completionPresentation } from './render-completion.mjs';
import { renderRoadmapMatrix } from './render-roadmap-matrix.mjs';
import { renderRoadmapTimeline } from './render-roadmap-timeline.mjs';

const completed = { state: 'complete', label: 'Complete', scope: 'Verified code', evidenceHref: '#work' };
const milestone = { ...completed, state: 'milestone-complete', label: 'Core delivered', remainingLabel: 'Follow-ups remain' };
const render = completion => {
  const item = { id: 'work', title: 'Reliable delivery', statusLabel: '1/1 cited tickets Done', completion, themeId: 't1', themeName: 'Trust', start: 0, duration: 2, windowType: 'source-stated', windowLabel: 'January to February', sourceNote: 'Approved planning record' };
  return [
    renderRoadmapMatrix({ items: [item], themes: [{ id: 't1', name: 'Trust' }], streams: [{ id: 'product', name: 'Product' }], horizons: [{ id: 'now', name: 'Now' }], placements: [{ itemId: 'work', themeId: 't1', streamId: 'product', horizonId: 'now' }] }),
    renderRoadmapTimeline({ months: ['Jan', 'Feb', 'Mar'], quarters: [{ label: 'Q1', months: 3 }], groups: [{ name: 'Now', items: [item] }] }),
  ];
};

test('completed work has the same explicit presentation state and working link in both charts', () => {
  for (const html of render(completed)) {
    assert.match(html, /data-completion-state="complete"/);
    assert.match(html, /data-completion-evidence="#work"/);
    assert.match(html, /href="#work"/);
    assert.match(html, /class="rm-completion-label">[\s\S]*?<\/svg>Done<\/span>/);
    assert.doesNotMatch(html, /aria-disabled|\bdisabled\b|tabindex="-1"/);
  }
});

test('a completed milestone keeps remaining work visible instead of claiming full completion', () => {
  for (const html of render(milestone)) {
    assert.match(html, /data-completion-state="milestone-complete"/);
    assert.match(html, /Core delivered/);
    assert.match(html, /class="rm-completion-remaining">Follow-ups remain/);
    assert.doesNotMatch(html, /data-completion-state="complete"/);
  }
});

test('completed-ticket counts alone do not apply completion styling', () => {
  for (const html of render(undefined)) {
    assert.match(html, /1\/1 cited tickets Done/);
    assert.doesNotMatch(html, /data-completion-state/);
  }
});

test('completion requires scoped evidence and cannot hide remaining work', () => {
  for (const override of [{ state: 'done' }, { label: '' }, { scope: '' }, { evidenceHref: 'javascript:alert(1)' }, { remainingLabel: 'Still open' }]) {
    assert.throws(() => completionPresentation({ ...completed, ...override }));
  }
  assert.throws(() => completionPresentation({ ...milestone, remainingLabel: '' }), /remaining work/);
});

test('completion labels and scope are escaped without changing date geometry', () => {
  const presentation = completionPresentation({ ...completed, label: '<script>', scope: 'Code "review"' });
  assert.match(presentation.statusHtml, /&lt;script&gt;/);
  assert.match(presentation.attributes, /&quot;review&quot;/);
  const before = render(undefined)[1].match(/style="--start:[^"]+"/)[0];
  assert.equal(render(milestone)[1].match(/style="--start:[^"]+"/)[0], before);
});
