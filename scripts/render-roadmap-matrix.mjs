import { escapeHtml } from './render-progress.mjs';
import { completionPresentation } from './render-completion.mjs';

const safeId = value => typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value);

export function renderRoadmapMatrix(model, options = {}) {
  const items = new Map(model.items.map(item => [item.id, item]));
  if (items.size !== model.items.length || !model.items.length) throw new Error('Matrix needs unique roadmap items');
  for (const collection of [model.items, model.horizons, model.streams, model.themes]) {
    if (!collection.length || new Set(collection.map(item => item.id)).size !== collection.length || collection.some(item => !safeId(item.id))) throw new Error('Matrix IDs must be safe, unique and nonempty');
  }
  const placements = new Set();
  for (const placement of model.placements) {
    const key = [placement.itemId, placement.streamId, placement.horizonId, placement.themeId].join('|');
    if (placements.has(key)) throw new Error('Duplicate matrix placement');
    placements.add(key);
    if (!items.has(placement.itemId) || !model.streams.some(stream => stream.id === placement.streamId) || !model.horizons.some(horizon => horizon.id === placement.horizonId) || !model.themes.some(theme => theme.id === placement.themeId)) throw new Error('Matrix placement has an unknown reference');
  }
  if (new Set(model.placements.map(placement => placement.itemId)).size !== items.size) throw new Error('Every roadmap item needs a matrix placement');
  const key = model.themes.map(theme => `<button class="rm-matrix-theme rm-theme-${theme.id}" type="button" data-roadmap-theme-choice="${theme.id}" data-theme-label="${escapeHtml(theme.name)}" aria-pressed="false" data-enhance-control hidden><span>${escapeHtml(theme.id.toUpperCase())}</span> ${escapeHtml(theme.name)}</button><span class="rm-matrix-theme rm-theme-${theme.id}" data-theme-filter-fallback>${escapeHtml(theme.name)}</span>`).join('');
  const renderPill = (placement, className = 'rm-matrix-pill') => {
    const item = items.get(placement.itemId);
    const completion = completionPresentation(item.completion);
    const status = completion.statusHtml || escapeHtml(item.statusLabel || '');
    return `<a class="${className} rm-theme-${placement.themeId}" href="#${item.id}" data-roadmap-item="${item.id}"${completion.attributes} data-throughlines="${escapeHtml((item.throughlineIds || [placement.themeId]).join(' '))}" data-search-text="${escapeHtml([item.title, completion.statusText, item.statusLabel, item.preview].filter(Boolean).join(' '))}" title="${escapeHtml(item.preview || item.title)}"><span>${escapeHtml(placement.label || item.title)}</span>${status ? `<small>${status}</small>` : ''}</a>`;
  };
  const placementsFor = (stream, horizon) => model.placements.filter(placement => placement.streamId === stream.id && placement.horizonId === horizon.id);
  const rows = model.streams.map(stream => `<tr><th scope="row">${escapeHtml(stream.name)}</th>${model.horizons.map(horizon => `<td><div class="rm-matrix-cell">${placementsFor(stream, horizon).map(placement => renderPill(placement)).join('') || '<span class="rm-matrix-empty">No planned item</span>'}</div></td>`).join('')}</tr>`).join('');
  const mobile = `<div class="rm-mobile-board" data-roadmap-list aria-label="Roadmap by horizon">${model.horizons.map(horizon => `<section data-roadmap-mobile-group><h3>${escapeHtml(horizon.name)}</h3>${model.streams.map(stream => {
    const placements = placementsFor(stream, horizon);
    return placements.length ? `<div class="rm-mobile-stream" data-roadmap-mobile-group><h4>${escapeHtml(stream.name)}</h4><div class="rm-mobile-items">${placements.map(placement => renderPill(placement, 'rm-mobile-pill')).join('')}</div></div>` : '';
  }).join('')}</section>`).join('')}<p data-filter-empty hidden>No matching roadmap items. Clear the filters above.</p></div>`;
  const heading = options.showHeading === false ? '' : `<div class="rm-structure-heading"><h2 id="roadmap-board-heading">The board</h2><p>Streams × horizons. Select a pill for progress and evidence.</p><span>${items.size} ${items.size === 1 ? 'item' : 'items'} · ${model.placements.length} placements</span></div>`;
  const themeKey = options.showThemeKey === false ? '' : `<div class="rm-matrix-key" role="group" aria-label="Filter the board by theme"><strong>Throughlines · click filters</strong>${key}</div>`;
  const completionNote = model.items.some(item => item.completion) ? ' Checked, muted items identify completed work. A milestone label names the finished scope; open follow-ups remain separate. Select an item for evidence.' : '';
  return `<section class="rm-roadmap-matrix" ${heading ? 'aria-labelledby="roadmap-board-heading"' : 'aria-label="The board"'}>${heading}${themeKey}<div class="rm-matrix-scroll" role="region" aria-label="Roadmap by stream and horizon" tabindex="0"><table class="rm-matrix"><caption class="rm-visually-hidden">Roadmap by stream and horizon; completion does not move planning commitments.</caption><thead><tr><th scope="col">Stream</th>${model.horizons.map(horizon => `<th scope="col">${escapeHtml(horizon.name)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>${mobile}<p class="rm-chart-note">Colors identify themes. Select an initiative for its progress and proof.${completionNote}</p></section>`;
}
