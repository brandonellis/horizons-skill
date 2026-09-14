(() => {
  const node = document.getElementById('horizons-model');
  if (!node) return;
  const model = JSON.parse(node.textContent), moves = new Map();
  const names = { now: 'Now', next: 'Next', later: 'Later', null: 'Unplaced' };
  const review = document.getElementById('movement-review'), rows = document.getElementById('movement-rows');
  const announce = document.getElementById('movement-status');
  document.querySelectorAll('[data-enhance]').forEach(element => { element.hidden = false; });
  document.querySelector('[data-theme-toggle]').addEventListener('click', event => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    event.currentTarget.textContent = dark ? 'Light theme' : 'Dark theme';
  });
  function filters() {
    const term = document.getElementById('roadmap-search').value.toLowerCase().trim();
    document.querySelectorAll('.hz-item').forEach(item => { item.hidden = !item.textContent.toLowerCase().includes(term); });
    document.querySelectorAll('.hz-lane').forEach(lane => {
      const visible = [...lane.querySelectorAll('.hz-item')].filter(item => !item.hidden).length;
      lane.querySelector('[data-lane-count]').textContent = visible;
      const empty = lane.querySelector('.hz-empty'); empty.hidden = visible > 0;
      empty.textContent = term ? 'No matching items. Clear search to see all work.' : 'Nothing committed in this horizon.';
    });
  }
  document.getElementById('roadmap-search').addEventListener('input', filters);
  document.querySelector('[data-clear-search]').addEventListener('click', () => { document.getElementById('roadmap-search').value = ''; filters(); });
  function renderReview() {
    rows.replaceChildren(); review.hidden = moves.size === 0;
    for (const [id, move] of moves) {
      const item = model.items.find(item => item.id === id);
      const row = document.createElement('div'); row.className = 'hz-review-row';
      const label = document.createElement('label'); label.textContent = `${item.title}: ${names[move.from]} → ${names[move.to]}. Reason for the move`;
      const input = document.createElement('textarea'); input.rows = 2; input.required = true; input.value = move.reason;
      input.addEventListener('input', () => { move.reason = input.value; }); label.append(input); row.append(label);
      rows.append(row);
    }
    document.querySelector('[data-download-moves]').disabled = !moves.size;
  }
  function moveItem(id, to) {
    const item = model.items.find(item => item.id === id);
    if (!item || !['now', 'next', 'later'].includes(to)) return;
    const card = document.querySelector(`[data-item-id="${id}"]`), select = card.querySelector('[data-move-item]');
    const previous = moves.get(id);
    if (item.horizon === to) moves.delete(id);
    else moves.set(id, { itemId: id, from: item.horizon, to, reason: previous?.reason || '' });
    card.dataset.draft = String(moves.has(id));
    card.querySelector('[data-state]').textContent = moves.has(id) ? `Proposed move to ${names[to]}` : card.dataset.stateLabel;
    document.querySelector(`[data-horizon="${to}"] [data-items]`).append(card);
    select.value = to; renderReview(); filters();
    announce.textContent = `${item.title}: ${names[to]}. ${moves.has(id) ? 'Draft move. Add a reason in Review moves; the canonical roadmap is unchanged.' : 'Original placement restored.'}`;
    select.focus();
  }
  document.querySelectorAll('[data-move-item]').forEach(select => select.addEventListener('change', () => moveItem(select.dataset.moveItem, select.value)));
  document.querySelectorAll('.hz-item').forEach(card => {
    card.draggable = true;
    card.addEventListener('dragstart', event => { event.dataTransfer.setData('text/plain', card.dataset.itemId); event.dataTransfer.effectAllowed = 'move'; });
  });
  document.querySelectorAll('[data-horizon]').forEach(lane => {
    lane.addEventListener('dragover', event => { if (lane.dataset.horizon !== 'unplaced') { event.preventDefault(); lane.dataset.dropActive = ''; } });
    lane.addEventListener('dragleave', () => delete lane.dataset.dropActive);
    lane.addEventListener('drop', event => { event.preventDefault(); delete lane.dataset.dropActive; moveItem(event.dataTransfer.getData('text/plain'), lane.dataset.horizon); });
  });
  document.querySelector('[data-discard-moves]').addEventListener('click', () => {
    for (const id of moves.keys()) {
      const item = model.items.find(item => item.id === id), card = document.querySelector(`[data-item-id="${id}"]`);
      document.querySelector(`[data-horizon="${item.horizon || 'unplaced'}"] [data-items]`).append(card);
      card.dataset.draft = 'false'; card.querySelector('[data-state]').textContent = card.dataset.stateLabel; card.querySelector('[data-move-item]').value = item.horizon || '';
    }
    moves.clear(); renderReview(); filters(); announce.textContent = 'Draft moves discarded. Original commitments restored.';
    document.getElementById('roadmap-search').focus();
  });
  document.querySelector('[data-download-moves]').addEventListener('click', () => {
    if ([...moves.values()].some(move => !move.reason.trim())) { announce.textContent = 'Add a reason for every proposed move before downloading.'; rows.querySelector('textarea:invalid')?.focus(); return; }
    const proposal = { schemaVersion: 1, projectId: model.project.id, baseRevision: model.revision, baseDigest: node.dataset.digest, moves: [...moves.values()] };
    const url = URL.createObjectURL(new Blob([JSON.stringify(proposal, null, 2) + '\n'], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `${model.project.id}-moves.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce.textContent = 'Move proposal downloaded. Ask Horizons to apply this proposal to the canonical roadmap. No changes are saved to the roadmap yet.';
  });
  window.addEventListener('beforeunload', event => { if (moves.size) { event.preventDefault(); event.returnValue = ''; } });
  function revealHash() { let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; } const target = document.getElementById(id); if (target?.tagName === 'DETAILS') target.open = true; }
  window.addEventListener('hashchange', revealHash); revealHash();
  let openBeforePrint = [];
  window.addEventListener('beforeprint', () => { openBeforePrint = [...document.querySelectorAll('details')].filter(detail => detail.open); document.querySelectorAll('details').forEach(detail => { detail.open = true; }); });
  window.addEventListener('afterprint', () => { document.querySelectorAll('details').forEach(detail => { detail.open = openBeforePrint.includes(detail); }); });
  filters();
})();
