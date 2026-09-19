import assert from 'node:assert/strict';
import test from 'node:test';
import { renderFindingProgress, renderDeliveryProgress, renderRoadmapReturn } from './render-progress.mjs';

const cohort = { total: 12, verified: 4, partial: 3, open: 5, registerHref: '#findings', baselineLabel: 'Baseline: January 1', observationLabel: 'Reviewed January 8' };
const delivery = { completed: 42, newlyAccounted: 7, windowLabel: 'January 1 to January 8', href: '#delivery', references: { done: 20, total: 35, href: '#references' } };

test('findings have labeled, actionable segments on the unchanged denominator', () => {
  const html = renderFindingProgress(cohort);
  assert.match(html, /12 original findings/);
  for (const [status, amount] of [['fixed', 4], ['partial', 3], ['open', 5]]) {
    assert.match(html, new RegExp(`data-finding-filter-target="${status}" style="flex:${amount}"`));
    assert.match(html, new RegExp(`${amount} of 12 original findings`));
  }
  assert.match(html, /Baseline: January 1/);
  assert.match(html, /Reviewed January 8/);
  assert.doesNotMatch(html, /role="img"/);
});

test('finding totals reject missing, fractional, negative or changed counts', () => {
  for (const override of [{ total: 13 }, { verified: -1 }, { partial: 1.5 }, { open: undefined }, { verified: NaN }]) {
    assert.throws(() => renderFindingProgress({ ...cohort, ...override }));
  }
  assert.throws(() => renderFindingProgress({ ...cohort, baselineLabel: '' }), /baseline/);
  assert.throws(() => renderFindingProgress({ ...cohort, registerHref: 'javascript:alert(1)' }), /anchor/);
});

test('unknown and empty cohorts are explicit rather than invented zeros', () => {
  assert.match(renderFindingProgress({ ...cohort, total: 14, unknown: 2 }), /Not verified/);
  const html = renderFindingProgress({ ...cohort, total: 0, verified: 0, partial: 0, open: 0 });
  assert.match(html, /No original findings were recorded/);
  assert.doesNotMatch(html, /flex:0/);
});

test('throughput and referenced tickets cannot masquerade as finding acceptance', () => {
  const html = renderDeliveryProgress(delivery);
  assert.match(html, /42<\/strong> tickets marked Done/);
  assert.match(html, /7 newly accounted for/);
  assert.match(html, /<details class="rm-delivery-context">/);
  assert.match(html, /20 of 35 tickets referenced/);
  assert.match(html, /not the original finding denominator or proof of acceptance/);
  assert.doesNotMatch(html, /<details[^>]*\bopen[\s>]/);
  assert.throws(() => renderDeliveryProgress({ ...delivery, newlyAccounted: 43 }), /exceed/);
  assert.throws(() => renderDeliveryProgress({ ...delivery, windowLabel: '' }), /dated/);
  assert.throws(() => renderDeliveryProgress({ ...delivery, references: { ...delivery.references, done: 36 } }), /exceed/);
});

test('rendered measures escape content and refuse unsafe evidence links', () => {
  assert.match(renderFindingProgress({ ...cohort, baselineLabel: '<script>' }), /&lt;script&gt;/);
  assert.match(renderDeliveryProgress({ ...delivery, windowLabel: '<script>' }), /&lt;script&gt;/);
  assert.throws(() => renderDeliveryProgress({ ...delivery, href: 'javascript:alert(1)' }), /Unsafe/);
  assert.throws(() => renderDeliveryProgress({ ...delivery, references: { ...delivery.references, href: '../private.json' } }), /Unsafe/);
});

test('initiative return is a real link with a no-script and shared-link fallback', () => {
  assert.match(renderRoadmapReturn(), /href="#roadmap-nnl" data-roadmap-return>Back to roadmap/);
  assert.doesNotMatch(renderRoadmapReturn(), /hidden|onclick|javascript:/);
});

test('a retracted segment keeps the denominator whole without joining the verified count', () => {
  const html = renderFindingProgress({ ...cohort, total: 13, retracted: 1 });
  assert.match(html, /data-finding-filter-target="retracted" style="flex:1"/);
  assert.match(html, /1 of 13 original findings: Retracted/);
  assert.match(html, /data-finding-filter-target="fixed" style="flex:4"/);
  assert.throws(() => renderFindingProgress({ ...cohort, retracted: 1 }), /match the original cohort/);
});
