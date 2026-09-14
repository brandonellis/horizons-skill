import assert from 'node:assert/strict';
import { escapeHtml as escape } from './render-progress.mjs';

const lensStatuses = ['assessed', 'reassessment-required', 'historical'];
const letter = value => typeof value === 'string' && /^(?:[ABCD][+-]?|F)$/.test(value);
const day = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
const informationOnly = component => component.movementClass === 'information' || component.movementClass === 'instrument';
const transition = component => informationOnly(component)
  ? `${escape(component.grade)} · previously ${escape(component.previousGrade)} (new judgment)`
  : `${escape(component.previousGrade)} → ${escape(component.grade)}`;
const text = value => typeof value === 'string' && value.trim().length > 0;

function dateLabel(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'date unavailable';
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

// A lens is not a component. It grades a different question on its own scale,
// it was added after the baseline panel, and it never enters an overall letter.
// Leaving lens letters off the strip hid two of the estate's lowest grades
// behind a scroll; putting them on it without marking them would silently widen
// the instrument. So a lens tile carries its own scope, its own date, and the
// note below stays with the strip.
function renderLensTiles(assessment, componentIds) {
  const lenses = assessment.lenses ?? [];
  if (!lenses.length) return { tiles: '', note: '' };
  assert(text(assessment.baselineId), 'Lens tiles must name the baseline they sit outside');
  const seen = new Set();
  const tiles = lenses.map(lens => {
    assert(text(lens.id) && /^[a-z][a-z0-9-]*$/.test(lens.id), 'A lens needs an anchor-safe id');
    assert(!componentIds.has(lens.id), `A lens may not reuse a component id: ${lens.id}`);
    assert(!seen.has(lens.id), `A lens is listed twice: ${lens.id}`);
    seen.add(lens.id);
    assert(text(lens.name), 'A lens tile needs a name');
    assert(letter(lens.grade), `A lens tile needs its own letter: ${lens.id}`);
    assert(day(lens.observedOn), `A lens tile needs the date it was assessed: ${lens.id}`);
    assert(lensStatuses.includes(lens.status), `Unknown lens status: ${lens.status}`);
    assert(!lens.firstAssessedOn || day(lens.firstAssessedOn), 'A lens first-assessed date must be a date');
    const stale = lens.status !== 'assessed';
    const label = `${stale ? 'Last assessed' : 'Assessed'} · ${dateLabel(lens.observedOn)}`;
    return `<a href="#${escape(lens.id)}" class="rm-grade-tile" data-grade-scope="lens" data-lens-id="${escape(lens.id)}" data-grade-state="${escape(stale ? 'not-reassessed' : 'assessed-qualitative-snapshot')}"><span>${escape(lens.name)} <small>lens</small></span><strong>${escape(lens.grade)}</strong><span>${escape(label)}</span></a>`;
  }).join('');
  // A lens name can end in its own punctuation, so the sentence adds a full
  // stop only when the last name does not carry one, and the wording holds for
  // one lens or five.
  const names = lenses.map(lens => escape(lens.name));
  const stop = /[.?!]$/.test(names.at(-1)) ? '' : '.';
  const note = `Lens tiles on this strip: ${names.join(' · ')}${stop} Each grades a cross-cutting question on its own scale, carries its own date, and sits outside baseline ${escape(assessment.baselineId)}, its finding denominator and any overall letter.`;
  return { tiles, note };
}

export function renderLetterReassessment(assessment) {
  const componentIds = new Set(assessment.components.map(component => component.id));
  const tiles = assessment.components.map(component => {
    const assessed = component.status === 'assessed-qualitative-snapshot';
    const label = assessed ? `${component.grade === component.previousGrade ? 'Rechecked' : 'Regraded'} · ${dateLabel(component.observedAt)}` : `Last reported · ${dateLabel(component.lastObservedAt)}`;
    return `<a href="#grade-${escape(component.id)}" class="rm-grade-tile" data-grade-scope="component" data-component-id="${escape(component.id)}" data-grade-state="${escape(component.status)}"><span>${escape(component.name)}</span><strong>${escape(assessed ? component.grade : component.lastReportedGrade)}</strong><span>${escape(label)}</span></a>`;
  }).join('');
  const details = assessment.components.map(component => {
    if (component.status !== 'assessed-qualitative-snapshot') return `<details id="grade-${escape(component.id)}"><summary>${escape(component.name)} · ${component.status === 'blocked' ? 'Blocked' : 'Not reassessed'}</summary><p>Last reported: ${escape(component.lastReportedGrade)} at ${escape(component.lastObservedAt ?? 'an unrecorded time')}. This is not a fresh grade.</p>${component.reason ? `<p>${escape(component.reason)}</p>` : ''}</details>`;
    return `<details id="grade-${escape(component.id)}"><summary>${escape(component.name)} · ${transition(component)}</summary><p>${escape(component.rationale)}</p><p><strong>Verified improvements</strong></p><ul>${component.verifiedImprovements.map(text => `<li>${escape(text)}</li>`).join('')}</ul><p><strong>What still holds the grade back</strong></p><ul>${component.nextGradeRequirements.map(text => `<li>${escape(text)}</li>`).join('')}</ul><p>Qualitative code assessment on ${escape(dateLabel(component.observedAt))}. Not an operational certification.</p><details><summary>Source references and coverage</summary><p>Recorded at ${escape(component.observedAt)}.</p><ul>${component.evidenceRefs.map(reference => `<li>${escape(reference)}</li>`).join('')}</ul><p>${escape((component.coverage.limitations ?? []).join(' '))}</p></details></details>`;
  }).join('');
  const reviewed = assessment.components.filter(component => component.status === 'assessed-qualitative-snapshot');
  const movement = reviewed.length ? `<ul class="rm-grade-movement" aria-label="Changes in the latest component review">${reviewed.map(component => `<li><a href="#grade-${escape(component.id)}"><span>${escape(component.name)}</span><strong>${informationOnly(component) ? `${escape(component.grade)} <small>previously ${escape(component.previousGrade)}</small>` : `${escape(component.previousGrade)} <span aria-label="to">→</span> ${escape(component.grade)}`}</strong><span>${informationOnly(component) ? 'New judgment · not an earned trend' : component.grade === component.previousGrade ? 'Unchanged · see what remains' : 'Regraded · see the evidence'}</span></a></li>`).join('')}</ul>` : '';
  const lenses = renderLensTiles(assessment, componentIds);
  return { tiles: `<div class="rm-grade-grid">${tiles}${lenses.tiles}</div>`, details, movement, lensNote: lenses.note };
}
