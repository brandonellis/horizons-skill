import { escapeHtml } from './render-progress.mjs';

// `retracted` is a finding shown never to have been true as written. It is not
// a closure: it leaves the fixed count and the remaining count both untouched,
// and the record stays in the register at its original ID with the evidence
// that contradicts it. A board cleaned by deletion and a board cleaned by
// remediation look identical afterwards; this state is what keeps them apart.
const statuses = ['fixed', 'partial', 'open', 'unknown', 'retracted'];
const labels = { fixed: 'Fixed in code', partial: 'Partial', open: 'Open', unknown: 'Not verified', retracted: 'Retracted' };
const order = ['partial', 'open', 'unknown', 'fixed', 'retracted'];
const plain = value => escapeHtml(String(value).replace(/\s*—\s*/g, ': '));
const anchor = id => `finding-${id}`;

function link(href, label) {
  if (!/^(?:https:\/\/[^\s]+|#[a-zA-Z0-9-]+)$/.test(href)) throw new Error('Finding links must be HTTPS or local anchors');
  return `<a href="${escapeHtml(href)}">${plain(label)}</a>`;
}

export function validateCohort(model) {
  if (!model.baselineId || !model.assessmentId || !model.observedAt || !model.trackerObservedLabel) throw new Error('Cohort needs independent assessment and tracker provenance');
  const ids = model.findings.map(finding => finding.id);
  if (new Set(ids).size !== ids.length || new Set(model.initialIds).size !== model.initialIds.length || [...model.initialIds].sort().join('|') !== [...ids].sort().join('|')) throw new Error('Every original finding must appear exactly once');
  for (const finding of model.findings) {
    if (!/^[A-Za-z0-9-]+$/.test(finding.id) || !statuses.includes(finding.status)) throw new Error('Invalid finding identity or status');
    if (!finding.title || !finding.shortTitle || !finding.reason || !finding.verifiedWork || !finding.remainingWork || !finding.trackerStatus || !finding.owner || !finding.steps?.length || !finding.references?.length) throw new Error(`Missing explanation or original acceptance for ${finding.id}`);
    for (const step of finding.steps) if (!step.label || !['verified', 'remaining', 'unknown'].includes(step.status)) throw new Error(`Invalid acceptance step for ${finding.id}`);
    if (finding.status === 'partial' && (!finding.steps.some(step => step.status === 'verified') || !finding.steps.some(step => step.status !== 'verified'))) throw new Error(`Partial needs both verified work and a remaining original requirement: ${finding.id}`);
    if (finding.status === 'fixed' && finding.steps.some(step => step.status !== 'verified')) throw new Error(`A fixed finding still has an unmet original requirement: ${finding.id}`);
    if (finding.status === 'retracted') {
      if (!finding.contradictedBy?.length || !finding.retractedInAssessmentId) throw new Error(`A retracted finding needs the contradicting evidence and the assessment that retracted it: ${finding.id}`);
      if (finding.steps.some(step => step.status === 'verified')) throw new Error(`A retracted finding cannot also claim verified remediation: ${finding.id}`);
    }
  }
  return Object.fromEntries(statuses.map(status => [status, model.findings.filter(finding => finding.status === status).length]));
}

export function renderCohortSummary(model) {
  const counts = validateCohort(model);
  const statusLink = (status, text) => `<a href="#cohort-findings" data-finding-filter-target="${status}">${text}</a>`;
  const cellClass = { fixed: 'is-done', partial: 'is-partial', retracted: 'is-retracted' };
  const cells = model.findings.map(finding => `<li class="${cellClass[finding.status] ?? ''}"><a href="#${anchor(finding.id)}" title="${plain(`${finding.id}: ${finding.shortTitle}. ${finding.reason}`)}" aria-label="${plain(`${finding.id}: ${finding.shortTitle}; ${labels[finding.status]}; view completed and remaining work`)}"></a></li>`).join('');
  const partials = model.findings.filter(finding => finding.status === 'partial').slice(0, 3).map(finding => `<li>${link('#' + anchor(finding.id), finding.id)} <span>${plain(finding.reason)}</span></li>`).join('');
  const extras = [counts.unknown ? statusLink('unknown', counts.unknown + ' not verified') : '', counts.retracted ? statusLink('retracted', counts.retracted + ' retracted') : ''].filter(Boolean).map(text => ' · ' + text).join('');
  return `<figure><figcaption>Original ticketed findings</figcaption><div class="rm-cohort-legend"><strong>${statusLink('fixed', counts.fixed + ' fixed')}</strong><span>${statusLink('partial', counts.partial + ' partial')} · ${statusLink('open', counts.open + ' open')}${extras}</span></div><ol class="rm-cohort-cells" aria-label="Source-verified status of the original ${model.initialIds.length} ticketed findings">${cells}</ol><a class="rm-cohort-link" href="#cohort-findings" data-finding-filter-target="remaining">See the tickets and what remains</a>${partials ? '<ul class="rm-partial-preview" aria-label="Why these findings are partial">' + partials + '</ul>' : ''}<p class="rm-chart-note">Status is based on the recorded assessment, not whether Linear says Done. A retracted finding was never true as written; it is neither fixed nor remaining and stays listed with the evidence that contradicts it. Select a count or a finding for its original requirements and evidence.</p></figure>`;
}

export function renderCohortDetails(model) {
  const counts = validateCohort(model);
  const remaining = model.initialIds.length - counts.fixed - counts.retracted;
  const filters = [['remaining', `Remaining ${remaining}`], ['partial', `Partial ${counts.partial}`], ['open', `Open ${counts.open}`], ['fixed', `Fixed ${counts.fixed}`], ['all', `All ${model.initialIds.length}`]];
  if (counts.unknown) filters.splice(3, 0, ['unknown', `Not verified ${counts.unknown}`]);
  if (counts.retracted) filters.splice(filters.length - 1, 0, ['retracted', `Retracted ${counts.retracted}`]);
  const controls = filters.map(([value, label]) => `<button type="button" data-finding-filter="${value}" aria-pressed="${value === 'remaining'}">${label}</button>`).join('');
  const rows = [...model.findings].sort((first, second) => order.indexOf(first.status) - order.indexOf(second.status)).map(finding => {
    const discrepancy = finding.status === 'retracted' ? '' : finding.status !== 'fixed' && finding.trackerStatus === 'Done' ? 'Tracker says Done; the original requirement is not fully verified.' : finding.status === 'fixed' && finding.trackerStatus !== 'Done' ? 'Original code acceptance is verified; the tracker has not been closed.' : '';
    const steps = finding.steps.map(step => `<li><span class="rm-step-state is-${step.status}">${step.status === 'verified' ? 'Verified' : step.status === 'remaining' ? 'Still required' : 'Not verified'}</span><span>${plain(step.label)}</span></li>`).join('');
    const retraction = finding.status === 'retracted' ? `<div class="rm-finding-retraction"><h4>Retracted in ${plain(finding.retractedInAssessmentId)}</h4><p>Never true as written. The original record is kept; the evidence below contradicts it.</p><div class="rm-source-links">${finding.contradictedBy.map(reference => link(reference.href, reference.label)).join(' ')}</div></div>` : '';
    return `<details class="rm-finding-record" id="${anchor(finding.id)}" data-finding-id="${finding.id}" data-finding-status="${finding.status}"><summary><span class="rm-finding-identity">${plain(finding.id)}</span><span>${plain(finding.shortTitle)}</span><span class="rm-finding-state is-${finding.status}">${labels[finding.status]}</span></summary><p class="rm-finding-reason">${plain(finding.reason)}</p><p class="rm-tracker-title">Tracker title: ${plain(finding.title)}</p><p class="rm-finding-meta">${link(finding.url, `Open ${finding.id} in Linear`)} · ${plain(finding.owner)} · Tracker: ${plain(finding.trackerStatus)}</p>${discrepancy ? '<p class="rm-status-discrepancy">' + plain(discrepancy) + '</p>' : ''}${retraction}<div class="rm-finding-work"><div><h4>Verified work</h4><p>${plain(finding.verifiedWork)}</p></div><div><h4>Still required for the original finding</h4><p>${plain(finding.remainingWork)}</p></div></div><ul class="rm-acceptance-steps" aria-label="Original acceptance breakdown for ${finding.id}">${steps}</ul><p class="rm-finding-runtime"><strong>Staging:</strong> ${plain(finding.staging)}<br><strong>Production:</strong> ${plain(finding.production)}</p>${finding.residual ? '<p class="rm-chart-note">Separate follow-up, not an added closure requirement: ' + plain(finding.residual) + '</p>' : ''}<div class="rm-source-links">${finding.references.map(reference => link(reference.href, reference.label)).join(' ')}</div></details>`;
  }).join('');
  const retractedNote = counts.retracted ? ` · ${counts.retracted} retracted` : '';
  return `<details class="rm-cohort-register" id="cohort-findings" data-finding-register data-finding-default-filter="remaining"><summary><span>Original findings: what is fixed and what remains</span><span>${remaining} need closure · ${counts.fixed} fixed in code${retractedNote}</span></summary><p class="rm-description">The original ${model.initialIds.length}-ticket subset is unchanged. Code verification: ${plain(model.observedAt)}. ${plain(model.trackerObservedLabel)}. This is an explanation of the existing assessment, not a fresh audit or a regrade.</p><div class="rm-finding-filters" role="group" aria-label="Filter original findings by verification status" data-enhance-control hidden>${controls}</div><p class="rm-chart-note" data-finding-count role="status" aria-live="polite">${model.initialIds.length} original findings</p>${rows}</details>`;
}
