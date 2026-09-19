export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function link(href, label) {
  if (!/^(?:#[\w-]+|https:\/\/[^\s]+|[\w-][\w./-]*\.(?:html|json|md)(?:#[\w-]+)?)$/.test(href) || href.split('/').includes('..')) throw new Error('Unsafe evidence link');
  return `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
}

function count(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a nonnegative integer`);
  return value;
}

export function renderFindingProgress(cohort) {
  const total = count(cohort.total, 'Original cohort');
  const segments = [
    ['fixed', 'Verified in code', cohort.verified],
    ['partial', 'Partly resolved', cohort.partial],
    ['open', 'Still open', cohort.open],
    ['unknown', 'Not verified', cohort.unknown ?? 0],
    // Never true as written. Counted so the denominator still adds up, and
    // never folded into "verified": a retraction is not a remediation.
    ['retracted', 'Retracted', cohort.retracted ?? 0],
  ];
  if (segments.reduce((sum, segment) => sum + count(segment[2], segment[1]), 0) !== total) throw new Error('Finding counts must match the original cohort');
  if (!/^#[\w-]+$/.test(cohort.registerHref)) throw new Error('Findings need a local register anchor');
  if (!cohort.baselineLabel || !cohort.observationLabel) throw new Error('Findings need baseline and observation labels');
  const bars = segments.filter(segment => segment[2] > 0).map(([status, label, amount]) => `<a class="is-${status}" href="${escapeHtml(cohort.registerHref)}" data-finding-filter-target="${status}" style="flex:${amount}" aria-label="${amount} of ${total} original findings: ${label}"><strong>${amount}</strong><span>${label}</span></a>`).join('');
  return `<p class="rm-measure-context">${escapeHtml(cohort.baselineLabel)} · ${total} original findings</p>${total ? `<div class="rm-finding-segments" role="group" aria-label="Progress against the original findings">${bars}</div>` : '<p>No original findings were recorded.</p>'}<p class="rm-measure-context">${escapeHtml(cohort.observationLabel)}. Select a segment for the exact findings and remaining work.</p>`;
}

export function renderDeliveryProgress(delivery) {
  count(delivery.completed, 'Delivered tickets');
  count(delivery.newlyAccounted, 'Newly accounted tickets');
  if (delivery.newlyAccounted > delivery.completed) throw new Error('Newly accounted tickets cannot exceed the delivery count');
  if (!delivery.windowLabel) throw new Error('Delivery needs a dated observation window');
  const references = delivery.references;
  let context = '';
  if (references) {
    count(references.done, 'Completed references');
    count(references.total, 'Referenced tickets');
    if (references.done > references.total) throw new Error('Completed references cannot exceed the reference set');
    context = `<details class="rm-delivery-context"><summary>How delivered work relates to assessments</summary><p>${references.done} of ${references.total} tickets referenced across prior assessments are marked Done. This is a separate ticket set, not the original finding denominator or proof of acceptance.</p>${link(references.href, 'See the referenced ticket set')}</details>`;
  }
  return `<section class="rm-delivery-progress" aria-labelledby="delivered-work-heading"><h2 id="delivered-work-heading">Work delivered</h2><p class="rm-delivery-count"><strong>${delivery.completed}</strong> tickets marked Done</p><p class="rm-measure-context">${escapeHtml(delivery.windowLabel)}</p><p>${link(delivery.href, `${delivery.newlyAccounted} newly accounted for`)} since the previous reconciliation. Ticket closure records delivery, not an automatic grade increase.</p>${context}</section>`;
}

export function renderRoadmapReturn() {
  return '<nav class="rm-detail-navigation" aria-label="Return from initiative details"><a href="#roadmap-nnl" data-roadmap-return>Back to roadmap</a></nav>';
}

export function renderOutcomeStory(story) {
  if (!story.baselineId || !story.assessmentId || !story.observedAt || !story.wins.length) throw new Error('Outcomes need baseline and observation provenance');
  const wins = story.wins.map(win => {
    if (!win.id || !win.title || !win.outcome || !win.evidenceHref || !win.proofLabel || !win.scopeLabel) throw new Error('A win needs an outcome, proof and scope');
    return `<li><div class="rm-outcome-proof">${escapeHtml(win.proofLabel)} <span>${escapeHtml(win.scopeLabel)}</span></div><h3>${escapeHtml(win.title)}</h3><p>${escapeHtml(win.outcome)}</p>${link(win.evidenceHref, 'View verification')}</li>`;
  }).join('');
  return `<section class="rm-outcomes" id="verified-outcomes" aria-labelledby="verified-outcomes-heading"><div class="rm-story-heading"><h2 id="verified-outcomes-heading">${escapeHtml(story.heading)}</h2>${link(story.evidenceHref, story.observationLabel)}</div><p class="rm-description">${escapeHtml(story.summary)}</p><ol class="rm-outcome-list">${wins}</ol><details class="rm-comparison-note"><summary>Since the previous assessment</summary><p>${escapeHtml(story.sincePreviousLabel)}</p></details></section>`;
}

export function renderNextChecks(components) {
  return `<section class="rm-next-checks" id="next-grade-checks" aria-labelledby="next-grade-heading"><div class="rm-story-heading"><h3 id="next-grade-heading">What moves us forward</h3>${link('#grading-contract', 'How grades will work')}</div><p class="rm-description">Choose a component to see its next proof. These actions address known gaps, not guaranteed letter increases.</p><div class="rm-check-list">${components.map(component => {
    if (!component.id || !component.actions?.length) throw new Error('Each component needs a stable ID and next actions');
    return `<details class="rm-next-check" id="next-${escapeHtml(component.id)}"><summary><span>${escapeHtml(component.name)}</span><span class="rm-next-check-grade">${escapeHtml(component.grade)} <small>snapshot</small></span><span class="rm-next-check-preview">${escapeHtml(component.nextOutcome)}</span></summary><ol>${component.actions.map(action => {
      if (!action.acceptance || !action.owner || !action.scope || !action.evidenceHref) throw new Error('Next actions need acceptance, owner, environment and source');
      return `<li><strong>${escapeHtml(action.title)}</strong><p>${escapeHtml(action.acceptance)}</p><p class="rm-check-meta">${escapeHtml(action.owner)} · ${escapeHtml(action.scope)} · ${escapeHtml(action.status)}</p>${link(action.evidenceHref, action.sourceLabel ?? 'Source requirement')}</li>`;
    }).join('')}</ol>${link(component.auditHref, 'Read the full assessment')}</details>`;
  }).join('')}</div></section>`;
}

export function renderDeliveryMilestones(milestones) {
  const rows = milestones.map(milestone => {
    if (!milestone.title || !milestone.plannedLabel || !milestone.observedLabel || !milestone.evidenceHref) throw new Error('Milestones need explicit schedule and evidence labels');
    return `<tr><th scope="row">${escapeHtml(milestone.title)}</th><td>${escapeHtml(milestone.plannedLabel)}</td><td>${escapeHtml(milestone.observedLabel)}</td><td>${escapeHtml(milestone.scopeLabel)}</td><td>${link(milestone.evidenceHref, milestone.stateLabel)}</td></tr>`;
  }).join('');
  return `<details class="rm-milestone-comparison" id="milestone-comparison"><summary>Planned and observed delivery <span>Keep commitments separate from verification dates</span></summary><div class="rm-table-region" role="region" aria-label="Planned versus observed milestones" tabindex="0"><table class="rm-table"><thead><tr><th scope="col">Outcome</th><th scope="col">Original commitment</th><th scope="col">Observation</th><th scope="col">Scope</th><th scope="col">Evidence</th></tr></thead><tbody>${rows}</tbody></table></div><p class="rm-chart-note">An observation date is not an invented completion date. Unscheduled work stays unscheduled; historical Gantt bars retain their original geometry and scenario labels.</p></details>`;
}
