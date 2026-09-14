import { evaluateAssessment, TIERS } from './assessment-engine.mjs';
import { escapeHtml as esc } from './render-progress.mjs';

// Planning over a recorded assessment. Never writes observations or issues a grade.
export function gradeOpportunities({ contract, assessment, tickets, effortUnit }) {
  const verdict = evaluateAssessment(contract, assessment);
  if (contract.status !== 'approved') throw new Error('Grade planning needs an approved existing contract');
  if (!Array.isArray(tickets)) throw new Error('Grade planning needs ticket mappings');
  if (tickets.some(ticket => ticket.effort != null) && (typeof effortUnit !== 'string' || !effortUnit.trim())) throw new Error('Supplied effort needs one declared consistent unit');
  const ids = new Set();
  for (const ticket of tickets) {
    if (!ticket.id || ids.has(ticket.id) || !ticket.title) throw new Error('Tickets need unique IDs and titles');
    ids.add(ticket.id);
    if (!Array.isArray(ticket.criterionIds) || ticket.criterionIds.some(id => !contract.criteria.some(c => c.id === id))) throw new Error('Ticket mapping names an unknown criterion');
    if (!Array.isArray(ticket.mappingEvidenceRefs) || (ticket.criterionIds.length && (!ticket.mappingEvidenceRefs.length || !ticket.mappingEvidenceRefs.every(ref => typeof ref === 'string' && ref.trim())))) throw new Error('Criterion mappings need evidence; do not infer from ticket titles');
    if (ticket.effort != null && (!Number.isFinite(ticket.effort) || ticket.effort <= 0)) throw new Error('Effort must be a positive supplied estimate');
    if (!Array.isArray(ticket.dependsOn) || ticket.dependsOn.some(id => !tickets.some(t => t.id === id)) || ticket.dependsOn.includes(ticket.id)) throw new Error('Dependencies need other known tickets');
  }
  const visit = (id, path = new Set()) => {
    if (path.has(id)) throw new Error('Cyclic ticket dependency');
    const next = new Set([...path, id]); for (const dependency of tickets.find(t => t.id === id).dependsOn) visit(dependency, next);
  };
  tickets.forEach(ticket => visit(ticket.id));
  const groups = contract.scopes.map(scope => {
    const current = verdict.scopes[scope];
    const cells = verdict.cells.filter(c => c.scope === scope && c.mandatory);
    const candidate = TIERS[Math.min(...cells.map(c => TIERS.indexOf(c.verifiedTier))) + 1];
    const target = candidate && cells.every(cell => cell.criteria.some(c => c.tier === candidate)) ? candidate : null;
    const required = cells.flatMap(cell => cell.criteria.filter(c => c.result !== 'pass' && (c.result === 'unknown' || (target !== null && TIERS.indexOf(c.tier) <= TIERS.indexOf(target)))).map(c => ({ ...c, cellId: cell.id, component: cell.component, dimension: cell.dimension, method: contract.criteria.find(raw => raw.id === c.id).method })));
    const mapped = tickets.filter(t => t.criterionIds.some(id => required.some(c => c.id === id)));
    return { scope, currentGrade: current.grade, status: current.status, target: current.status === 'incomplete' ? null : target,
      conditionalTarget: target, limitingCells: current.limitingCells, required, ticketIds: mapped.map(t => t.id),
      unmappedChecks: required.filter(c => !mapped.some(t => t.criterionIds.includes(c.id))),
      coverageGaps: (assessment.coverageGaps || []).filter(gap => gap.scope === scope), findingBlockers: current.blockers,
      explanation: current.status === 'incomplete' ? 'Restore missing evidence before projecting a letter. Unknown does not mean failed.' : target ? `Conditional path to ${target}: all listed checks must pass on reassessment; other passes must remain valid. Findings still block A+.` : 'No higher grade gate is defined by this contract. Do not invent an A+ acceptance standard.' };
  });
  const rows = tickets.map(ticket => {
    const criteria = verdict.cells.flatMap(cell => cell.criteria.filter(c => ticket.criterionIds.includes(c.id)).map(c => ({ ...c, scope: cell.scope, component: cell.component, dimension: cell.dimension, cellId: cell.id, currentGrade: cell.grade, nextTier: cell.criteria.some(check => check.tier === TIERS[TIERS.indexOf(cell.verifiedTier) + 1]) ? TIERS[TIERS.indexOf(cell.verifiedTier) + 1] : null, method: contract.criteria.find(raw => raw.id === c.id).method })));
    const pending = criteria.filter(c => c.result !== 'pass');
    const blocking = groups.filter(g => g.required.some(c => ticket.criterionIds.includes(c.id)));
    const recovery = blocking.some(g => g.required.some(c => ticket.criterionIds.includes(c.id) && c.result === 'unknown'));
    const category = recovery ? 'Restore assessment evidence' : blocking.length ? 'Unlock the overall grade' : pending.length ? 'Improve a component' : criteria.length ? 'No demonstrated grade uplift' : 'Mapping needed';
    const rank = recovery ? 0 : blocking.length ? 1 : pending.length ? 2 : criteria.length ? 3 : 4;
    return { ...ticket, effortUnit, criteria, category, rank, scopes: blocking.map(g => g.scope),
      remainingTicketIds: [...new Set(blocking.flatMap(g => g.ticketIds.filter(id => id !== ticket.id)))],
      effect: blocking.length ? 'Contributes to a shared gate; ticket closure alone cannot earn a letter.' : pending.length ? 'Addresses component criteria; the current overall bottleneck remains elsewhere.' : 'No verified mapping to an unmet grade gate.' };
  }).sort((a, b) => a.rank - b.rank || (a.effort ?? Infinity) - (b.effort ?? Infinity) || a.id.localeCompare(b.id));
  return { assessmentId: assessment.id, observedAt: assessment.observedAt, groups, tickets: rows };
}
export function renderGradeOpportunities(input) {
  const plan = gradeOpportunities(input);
  return `<section id="grade-opportunities" class="hz-section"><h2>What would raise this grade?</h2><p>Planning from assessment ${esc(plan.assessmentId)}, recorded ${esc(plan.observedAt)}. Conditional opportunities, not new grades. Priority reflects grade constraints, not overall business priority or WSJF.</p>${plan.groups.map(group => `<details open><summary>${esc(group.scope)}: ${esc(group.currentGrade || 'Incomplete')}${group.target && group.currentGrade !== group.target ? ` → ${esc(group.target)} if verified` : ''}</summary><p>${esc(group.explanation)}</p><ul>${group.required.map(check => `<li><strong>${esc(check.component)} / ${esc(check.dimension)}</strong>: ${esc(check.test)} <small>(${esc(check.result)}; ${esc(check.id)})</small><p>Verify: ${esc(check.method)}</p></li>`).join('')}</ul>${group.unmappedChecks.length ? `<p>Ticket mapping needed: ${group.unmappedChecks.map(c => esc(c.id)).join(', ')}.</p>` : ''}${group.findingBlockers.length ? `<p>Unresolved findings: ${group.findingBlockers.map(esc).join(', ')}. A+ also requires their verified closure.</p>` : ''}${group.coverageGaps.map(gap => `<p>Coverage gap: ${esc(gap.reason)}</p>`).join('')}</details>`).join('')}<ol class="hz-ticket-priorities">${plan.tickets.map(ticket => `<li><strong>${esc(ticket.id)} · ${esc(ticket.title)}</strong><p>${esc(ticket.category)}. ${esc(ticket.effect)}</p>${ticket.criteria.filter(c => c.result !== 'pass').map(c => `<p>${esc(c.scope)} / ${esc(c.component)}: ${esc(c.currentGrade || 'Incomplete')}${c.nextTier ? `; next tier ${esc(c.nextTier)}` : ''}. ${esc(c.test)}<br>Proof required: ${esc(c.method)}</p>`).join('')}${ticket.remainingTicketIds.length ? `<p>Other tickets at the shared gate: ${ticket.remainingTicketIds.map(esc).join(', ')}.</p>` : ''}${ticket.dependsOn.length ? `<p>Depends on: ${ticket.dependsOn.map(esc).join(', ')}.</p>` : ''}<p>Mapping evidence: ${ticket.mappingEvidenceRefs.map(esc).join('; ') || 'Not recorded'}. Effort: ${ticket.effort == null ? 'not estimated' : `${esc(ticket.effort)} ${esc(ticket.effortUnit)}`}.</p></li>`).join('')}</ol></section>`;
}
