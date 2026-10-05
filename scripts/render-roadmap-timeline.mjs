import { escapeHtml } from './render-progress.mjs';
import { completionPresentation } from './render-completion.mjs';

export function packTimelineTracks(items) {
  const tracks = [];
  const scheduled = items.filter(item => item.windowType !== 'unscheduled').sort((left, right) => left.start - right.start || right.duration - left.duration);
  for (const item of scheduled) {
    let track = tracks.find(candidate => candidate.at(-1).start + candidate.at(-1).duration <= item.start);
    if (!track) { track = []; tracks.push(track); }
    track.push(item);
  }
  return tracks;
}

// Scheduling coverage, stated beside every timeline and in the handoff:
// source-stated windows are commitments, approved scenarios are proposals.
export function scheduleCoverage(model) {
  const items = (model.groups || []).flatMap(group => group.items || []);
  const count = type => items.filter(item => item.windowType === type).length;
  const committed = count('source-stated'), proposed = count('scenario'), unscheduled = count('unscheduled');
  const text = `${committed} committed / ${proposed} proposed / ${unscheduled} unscheduled`;
  return { committed, proposed, unscheduled, text, drawn: committed + proposed > 0,
    handoff: committed + proposed ? `Timeline: ${text}` : `Gantt not drawn: 0 sourced or approved dates, ${unscheduled} unscheduled` };
}

export function renderRoadmapTimeline(model) {
  if (!model.groups?.length) throw new Error('Timeline needs months, quarters and groups');
  const coverage = scheduleCoverage(model);
  // With no sourced or approved window there is nothing to place on a calendar:
  // render the honest unscheduled shelf instead of an empty or invented chart.
  if (!coverage.drawn) model = { ...model, months: model.months?.length ? model.months : ['Dates not set'], quarters: model.quarters?.length ? model.quarters : [{ label: 'No dated windows', months: model.months?.length || 1 }] };
  if (!model.months?.length || !model.quarters?.length) throw new Error('Timeline needs months, quarters and groups');
  if (model.quarters.some(quarter => !Number.isInteger(quarter.months) || quarter.months <= 0) || model.quarters.reduce((total, quarter) => total + quarter.months, 0) !== model.months.length) throw new Error('Quarter spans must cover the calendar');
  const ids = new Set();
  const themes = new Map();
  for (const theme of model.themes || []) {
    if (!/^[a-z][a-z0-9-]*$/.test(theme.id) || !theme.name || themes.has(theme.id)) throw new Error('Timeline themes need unique safe IDs and names');
    themes.set(theme.id, { ...theme, items: [] });
  }
  for (const group of model.groups) {
    for (const item of group.items) {
      if (!/^[a-z][a-z0-9-]*$/.test(item.id) || ids.has(item.id)) throw new Error('Timeline needs unique safe item IDs');
      ids.add(item.id);
      if (!/^[a-z][a-z0-9-]*$/.test(item.themeId) || !item.themeName) throw new Error('Timeline needs a named theme');
      if (!item.title) throw new Error('Timeline bars need initiative titles');
      if (model.themes && !themes.has(item.themeId)) throw new Error('Timeline item needs a declared theme');
      if (!themes.has(item.themeId)) themes.set(item.themeId, { id: item.themeId, name: item.themeName, items: [] });
      if (themes.get(item.themeId).name !== item.themeName) throw new Error('Timeline theme names must agree');
      const unscheduled = item.windowType === 'unscheduled';
      if (unscheduled && (item.start != null || item.duration != null)) throw new Error('Unscheduled work cannot carry a dated window');
      if (!unscheduled && (!Number.isFinite(item.start) || !Number.isFinite(item.duration) || item.start < 0 || item.duration <= 0 || item.start + item.duration > model.months.length)) throw new Error('Timeline window is outside its calendar');
      if (!['source-stated', 'scenario', 'unscheduled'].includes(item.windowType) || !item.windowLabel || !item.sourceNote) throw new Error('Timeline needs explicit schedule provenance');
      themes.get(item.themeId).items.push(item);
    }
  }
  const renderItem = item => {
      const completion = completionPresentation(item.completion);
      const throughlines = item.throughlineIds || [item.themeId];
      if (!throughlines.includes(item.themeId) || throughlines.some(id => !themes.has(id))) throw new Error('Timeline memberships need known themes including the primary theme');
      const description = [item.title, completion.statusText || item.statusLabel, item.windowLabel, item.windowType, item.sourceNote].filter(Boolean).join('. ');
      const secondary = throughlines.filter(id => id !== item.themeId).map(id => themes.get(id).name);
      const content = `<strong class="rm-gantt-title">${escapeHtml(item.title)}</strong><span class="rm-gantt-status">${completion.statusHtml || escapeHtml(item.statusLabel || 'Progress not verified')}</span>${secondary.length ? `<span class="rm-gantt-secondary">Also: ${escapeHtml(secondary.join(', '))}</span>` : ''}`;
      const window = item.windowType === 'unscheduled'
        ? `<a href="#${item.id}" class="rm-gantt-unscheduled" aria-label="${escapeHtml(description)}" title="${escapeHtml(description)}">${content}<span class="rm-gantt-window-note">${escapeHtml(item.windowLabel)}</span></a>`
        : `<a href="#${item.id}" class="rm-gantt-bar${item.windowType === 'scenario' ? ' is-scenario' : ''}" style="--start:${item.start / model.months.length * 100}%;--duration:${item.duration / model.months.length * 100}%" aria-label="${escapeHtml(description)}" title="${escapeHtml(description)}">${content}</a>`;
      return `<div class="rm-gantt-row rm-theme-${item.themeId}" data-roadmap-item="${item.id}"${completion.attributes} data-throughlines="${escapeHtml(throughlines.join(' '))}" data-search-text="${escapeHtml([description, item.searchText].filter(Boolean).join(' '))}">${window}</div>`;
  };
  const lanes = [...themes.values()].filter(theme => theme.items.length).map(theme => {
    const tracks = packTimelineTracks(theme.items).map(track => `<div class="rm-gantt-track" data-roadmap-track>${track.map(renderItem).join('')}</div>`).join('');
    const undated = theme.items.filter(item => item.windowType === 'unscheduled');
    const shelf = undated.length ? `<section class="rm-gantt-undated" data-roadmap-track aria-label="${escapeHtml(theme.name)}: dates not set"><p>Dates not set</p><div class="rm-gantt-undated-items">${undated.map(renderItem).join('')}</div></section>` : '';
    return `<section class="rm-gantt-lane rm-theme-${theme.id}" data-roadmap-lane="${theme.id}" aria-labelledby="gantt-lane-${theme.id}"><header class="rm-gantt-lane-label"><div><h3 id="gantt-lane-${theme.id}"><button type="button" data-roadmap-theme-choice="${theme.id}" data-theme-label="${escapeHtml(theme.name)}" aria-pressed="false" data-enhance-control hidden>${escapeHtml(theme.name)}</button><span data-theme-filter-fallback>${escapeHtml(theme.name)}</span></h3><p data-roadmap-lane-count>${theme.items.length} initiatives</p></div></header><div class="rm-gantt-lane-body">${tracks}${shelf}</div></section>`;
  }).join('');
  const coverageLine = `<p class="rm-gantt-coverage" data-schedule-coverage="committed:${coverage.committed} proposed:${coverage.proposed} unscheduled:${coverage.unscheduled}">${coverage.drawn ? escapeHtml(coverage.text) : `Gantt not drawn: no source-stated or approved dates yet. ${coverage.unscheduled} ${coverage.unscheduled === 1 ? 'initiative needs' : 'initiatives need'} a date window before it can be placed.`}</p>`;
  return `${coverageLine}<div class="rm-gantt-region${coverage.drawn ? '' : ' is-unscheduled-only'}" role="region" aria-label="${escapeHtml(model.label || 'Roadmap timeline by theme; scroll to explore')}" tabindex="0" data-roadmap-list><div class="rm-gantt rm-gantt-theme-lanes" style="--month-count:${model.months.length}"><div class="rm-gantt-axis"><strong>Theme</strong><div class="rm-gantt-calendar">${model.quarters.map(quarter => `<span class="rm-quarter" style="grid-column:span ${quarter.months}">${escapeHtml(quarter.label)}</span>`).join('')}${model.months.map(month => `<span>${escapeHtml(month)}</span>`).join('')}</div></div>${lanes}</div><p data-filter-empty hidden>No matching roadmap items. Clear the filters to show the timeline.</p></div>`;
}
