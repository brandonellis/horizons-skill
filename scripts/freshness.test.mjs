import test from 'node:test';
import assert from 'node:assert/strict';
import { FRESHNESS_KINDS, resolveMaxAges, ageInDays, freshnessAttributes, renderFreshnessBadge, renderFreshnessStrip, freshnessScript, auditFreshness, carriedPhrase } from './freshness.mjs';

const block = (over = {}) => ({ id: 'envs', kind: 'probe', observedOn: '2026-10-12', label: 'Environments', ...over });
const pageWith = options => (...blocks) => `<html>${renderFreshnessStrip()}${blocks.map(b => `<section${freshnessAttributes(b, options)}>${renderFreshnessBadge(b)}</section>`).join('')}${freshnessScript}</html>`;
const page = pageWith();

test('kinds are a closed set with the documented default ages, and overrides are checked', () => {
  assert.deepEqual(FRESHNESS_KINDS, { probe: 3, delivery: 7, grade: 30, architecture: 30, learning: 30 });
  assert.equal(resolveMaxAges({ probe: 5 }).probe, 5);
  assert.throws(() => resolveMaxAges({ vibes: 3 }), /Unknown freshness kind/);
  assert.throws(() => resolveMaxAges({ probe: 0 }), /positive whole number/);
  assert.equal(ageInDays('2026-10-12', '2026-10-26'), 14);
  assert.throws(() => ageInDays('2026-02-30', '2026-03-01'), /real YYYY-MM-DD/);
});

test('fresh, stale and carried blocks all render their date and verify on an ordinary page', () => {
  const fresh = block({ id: 'grades', kind: 'grade', observedOn: '2026-10-21', label: 'Grades' });
  const stale = block();
  const carried = block({ id: 'learning', kind: 'learning', observedOn: '2026-08-01', label: 'Learning', carried: true });
  const html = page(fresh, stale, carried);
  assert.match(html, /data-kind="probe" data-observed-on="2026-10-12" data-max-age-days="3"/);
  assert.match(html, /data-carried="not rechecked since 2026-08-01"/);
  assert.match(html, /<span class="fz-carried">not rechecked since 2026-08-01<\/span>/);
  assert.match(html, /<time datetime="2026-10-12">2026-10-12<\/time>/);
  assert.equal(auditFreshness(html).length, 3);
});

test('the strip pre-renders stale blocks as of a date, and lists carried ones with their phrase', () => {
  const blocks = [block({ id: 'grades', kind: 'grade', observedOn: '2026-10-21', label: 'Grades' }), block(), block({ id: 'old', kind: 'delivery', observedOn: '2026-10-01', label: 'Delivery', carried: true })];
  const strip = renderFreshnessStrip({ blocks, asOf: '2026-10-26' });
  assert.doesNotMatch(strip, /hidden/);
  assert.match(strip, /href="#envs">Environments/);
  assert.match(strip, /not rechecked since 2026-10-01/);
  assert.doesNotMatch(strip, /#grades/);
  assert.match(renderFreshnessStrip({ blocks: [blocks[0]], asOf: '2026-10-26' }), /hidden/);
});

test('a dated block without a kind or a date, or with a wrong age, is refused', () => {
  const strip = renderFreshnessStrip();
  assert.throws(() => auditFreshness(`${strip}<section id="a" data-observed-on="2026-10-01">${freshnessScript}`), /needs data-kind/);
  assert.throws(() => auditFreshness(`${strip}<section id="a" data-kind="probe" data-max-age-days="3">${freshnessScript}`), /needs data-observed-on/);
  assert.throws(() => auditFreshness(page(block()).replace('data-max-age-days="3"', 'data-max-age-days="9"')), /must be 3/);
  assert.throws(() => auditFreshness(page(block()).replace(/<p class="fz-badge"[\s\S]*?<\/p>/, '')), /no visible age/);
  assert.throws(() => auditFreshness(page(block()).replace(freshnessScript, '')), /no freshness script/);
  assert.throws(() => freshnessAttributes(block({ kind: 'vibes' })), /kind must be one of/);
  assert.throws(() => freshnessAttributes(block({ label: '' })), /label is required/);
  // Attribute text inside a script body is data, not a block.
  assert.deepEqual(auditFreshness('<script type="application/json">{"x":"<p data-observed-on=\\"bad\\">"}</script>'), []);
});

test('a refresh that leaves a block stale fails unless the block says it was carried', () => {
  const html = page(block({ id: 'grades', kind: 'grade', observedOn: '2026-10-21', label: 'Grades' }), block());
  assert.throws(() => auditFreshness(html, { refreshedOn: '2026-10-26' }), /envs: refreshed 2026-10-26 but still observed 2026-10-12/);
  assert.equal(auditFreshness(page(block({ carried: true })), { refreshedOn: '2026-10-26' }).length, 1);
  const longer = pageWith({ maxAgeDays: { probe: 20 } })(block());
  assert.equal(auditFreshness(longer, { refreshedOn: '2026-10-26', maxAgeDays: { probe: 20 } }).length, 1);
  assert.throws(() => auditFreshness(longer), /must be 3 for kind probe/);
  assert.throws(() => auditFreshness(page(block({ carried: true })).replace(carriedPhrase('2026-10-12'), 'carried'), {}), /data-carried must read/);
  assert.throws(() => auditFreshness(page(block({ observedOn: '2026-10-30' })), { refreshedOn: '2026-10-26' }), /after the refresh date/);
});

test('a section family keeps one current copy; older copies are dated History', () => {
  const current = block({ id: 'delivery', kind: 'delivery', observedOn: '2026-10-21', label: 'Delivery', family: 'delivery' });
  const older = block({ id: 'delivery-1012', kind: 'delivery', observedOn: '2026-10-12', label: 'Delivery', family: 'delivery', supersededOn: '2026-10-21' });
  const html = page(current, older);
  assert.match(html, /Observed <time datetime="2026-10-12">2026-10-12<\/time> · superseded 2026-10-21/);
  assert.equal(auditFreshness(html, { refreshedOn: '2026-10-26' }).length, 2);
  assert.throws(() => auditFreshness(page(current, { ...older, supersededOn: undefined })), /family delivery has 2 current copies/);
  assert.throws(() => freshnessAttributes({ ...older, supersededOn: '2026-10-01' }), /before observedOn/);
});
