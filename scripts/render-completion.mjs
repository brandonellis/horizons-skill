import { escapeHtml } from './render-progress.mjs';

export function completionPresentation(completion) {
  if (completion == null) return { attributes: '', statusHtml: '', statusText: '' };
  if (!['complete', 'milestone-complete'].includes(completion.state)) throw new Error('Completion needs an explicit supported state');
  if (!completion.label?.trim() || !completion.scope?.trim() || !/^#[a-z][a-z0-9-]*$/.test(completion.evidenceHref)) throw new Error('Completion needs a label, scope and canonical evidence anchor');
  if (completion.state === 'milestone-complete' && !completion.remainingLabel?.trim()) throw new Error('Milestone completion must name remaining work');
  if (completion.state === 'complete' && completion.remainingLabel) throw new Error('Remaining initiative work is not full completion');
  const stateLabel = completion.label.trim().toLowerCase() === 'complete' ? 'Done' : completion.label.trim();
  const icon = '<svg class="rm-completion-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="m3 8 3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return {
    attributes: ` data-completion-state="${completion.state}" data-completion-scope="${escapeHtml(completion.scope)}" data-completion-evidence="${escapeHtml(completion.evidenceHref)}"`,
    statusHtml: `<span class="rm-completion-label">${icon}${escapeHtml(stateLabel)}</span>${completion.remainingLabel ? `<span class="rm-completion-remaining">${escapeHtml(completion.remainingLabel)}</span>` : ''}`,
    statusText: [stateLabel, completion.remainingLabel].filter(Boolean).join(' · '),
  };
}
