// Leadership overview of learning loops: which loops exist, what each learns from and improves, whether it is on,
// why not, and where its cycle is broken. Draws each loop as a cycle (signal, transform, changed artifact, later use,
// and back), never a straight line. Static HTML + inline SVG; works without JavaScript; prints.
import { LEARNING_STAGES } from './render-learning-system.mjs';

export const LOOP_STATUSES = ['on', 'older', 'idle', 'off'];
const STATUS_LABEL = { on: 'On', older: 'On (older path)', idle: 'On, no input yet', off: 'Off' };
const STAGE_LABEL = { signal: 'Signal', transform: 'Transform', artifact: 'Changed', consumption: 'Used later' };
const STATE_WORD = { observed: 'seen working', carried: 'seen earlier', unknown: 'not seen yet', attention: 'needs attention' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeHref = href => (typeof href === 'string' && /^(https:\/\/|#|[a-z0-9._/-]+$)/i.test(href) && !/^javascript:/i.test(href)) ? href : null;

export function validateLearningWheel(model) {
  const problems = [];
  if (!Array.isArray(model?.targets) || !model.targets.length) problems.push('targets[] is required: what the loops improve');
  const targets = new Set((model?.targets ?? []).map(t => t.id));
  if (targets.size !== (model?.targets ?? []).length) problems.push('target ids must be unique');
  for (const l of model?.loops ?? []) {
    if (!LOOP_STATUSES.includes(l.status)) problems.push(`${l.id}: status must be one of ${LOOP_STATUSES.join(', ')}`);
    if (!l.learnsFrom) problems.push(`${l.id}: learnsFrom is required`);
    if (!targets.has(l.improves)) problems.push(`${l.id}: improves must name a target id`);
    if (l.status !== 'on' && !l.whyStatus) problems.push(`${l.id}: a loop that is not plainly on needs whyStatus`);
    if (!Array.isArray(l.stages) || l.stages.map(s => s.id).join() !== LEARNING_STAGES.join()) problems.push(`${l.id}: stages must be ${LEARNING_STAGES.join(', ')} in order`);
  }
  if (problems.length) throw new Error('Invalid learning wheel model:\n- ' + problems.join('\n- '));
  return true;
}

/** A loop counts as seen working only when every stage is observed in this observation. */
export const loopWitnessed = loop => loop.stages.every(s => s.state === 'observed');

export function wheelSummary(model) {
  const by = s => model.loops.filter(l => l.status === s).length;
  return { on: by('on'), older: by('older') + by('idle'), off: by('off'), total: model.loops.length, witnessed: model.loops.filter(loopWitnessed).length };
}

// One loop as a cycle: four stages around a circle, arrows clockwise, the last arrow returning to the first.
export function renderLoopCycle(loop, { size = 360 } = {}) {
  const c = size / 2, r = size * 0.33, pos = [[c, c - r], [c + r, c], [c, c + r], [c - r, c]];
  const witnessed = loopWitnessed(loop);
  const arc = i => {
    const [x1, y1] = pos[i], [x2, y2] = pos[(i + 1) % 4];
    const a1 = Math.atan2(y1 - c, x1 - c) + 0.42, a2 = Math.atan2(y2 - c, x2 - c) - 0.42;
    const p = a => [c + r * Math.cos(a), c + r * Math.sin(a)];
    const [sx, sy] = p(a1), [ex, ey] = p(a2);
    const state = loop.stages[(i + 1) % 4].state;
    const cls = `lw-arc lw-${state}${i === 3 ? ' lw-return' : ''}`;
    const d = `M${sx.toFixed(1)} ${sy.toFixed(1)} A${r} ${r} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
    return `<path class="${cls}" d="${d}" marker-end="url(#lw-head-${esc(loop.id)})"/>` + (witnessed ? `<path class="lw-current" d="${d}" style="animation-delay:${i * 0.6}s"/>` : '');
  };
  const node = (s, i) => {
    const [x, y] = pos[i];
    return `<g class="lw-stage lw-${s.state}"><circle cx="${x}" cy="${y}" r="${size * 0.12}"/>`
      + `<text x="${x}" y="${y - 2}" text-anchor="middle" class="lw-stage-name">${esc(STAGE_LABEL[s.id])}</text>`
      + `<text x="${x}" y="${y + 12}" text-anchor="middle" class="lw-stage-state">${esc(STATE_WORD[s.state] ?? s.state)}</text></g>`;
  };
  const label = `${loop.name}: ${loop.stages.map(s => `${STAGE_LABEL[s.id]} ${STATE_WORD[s.state] ?? s.state}`).join(', ')}.`
    + (witnessed ? ' Seen working all the way round.' : '');
  return `<svg class="lw-cycle" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(label)}">`
    + `<defs><marker id="lw-head-${esc(loop.id)}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="1.6"/></marker></defs>`
    + [0, 1, 2, 3].map(arc).join('') + loop.stages.map(node).join('')
    + `<text x="${c}" y="${c + 4}" text-anchor="middle" class="lw-cycle-center">${witnessed ? 'closes' : 'open'}</text></svg>`;
}

// The overview: loops grouped by status on the left, each with a small cycle glyph; what they improve on the right.
export function renderWheelOverview(model) {
  const rowH = 44, top = 40, order = ['on', 'older', 'idle', 'off'];
  const tIdx = id => model.targets.findIndex(t => t.id === id);
  const loops = [...model.loops].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || tIdx(a.improves) - tIdx(b.improves));
  const tH = Math.max(1, model.targets.length), H = Math.max(top + loops.length * rowH + 20, top + tH * 80 + 20);
  const tGap = (H - top - 20) / tH, ty = i => top + i * tGap + tGap / 2;
  const tIndex = Object.fromEntries(model.targets.map((t, i) => [t.id, i]));
  const rows = loops.map((l, i) => {
    const y = top + i * rowH + rowH / 2, w = loopWitnessed(l), t = ty(tIndex[l.improves]);
    const glyph = `<g class="lw-glyph lw-s-${l.status}" transform="translate(30 ${y})"><circle r="11"/><path d="M8 -8 l3 -1 l-1 3"/></g>`;
    const edge = `<path class="lw-edge lw-s-${l.status}" d="M500 ${y} C 560 ${y}, 560 ${t}, 620 ${t}"/>` + (w ? `<path class="lw-current" d="M500 ${y} C 560 ${y}, 560 ${t}, 620 ${t}"/>` : '');
    return glyph + `<a href="#lw-loop-${esc(l.id)}"><text class="lw-row-name" x="52" y="${y - 3}">${esc(l.name)}</text>`
      + `<text class="lw-row-sub" x="52" y="${y + 12}">from ${esc(l.learnsFrom)}</text></a>`
      + `<text class="lw-row-status lw-s-${l.status}" x="492" y="${y + 4}" text-anchor="end">${esc(STATUS_LABEL[l.status])}${w ? ' · seen working' : ''}</text>` + edge;
  }).join('');
  const targets = model.targets.map((t, i) => `<g class="lw-target"><rect x="620" y="${ty(i) - 26}" width="240" height="52" rx="8"/>`
    + `<text class="lw-target-name" x="636" y="${ty(i) - 4}">${esc(t.label)}</text><text class="lw-row-sub" x="636" y="${ty(i) + 13}">${esc(t.detail ?? '')}</text></g>`).join('');
  const s = wheelSummary(model);
  return `<svg class="lw-overview" viewBox="0 0 880 ${H}" role="img" aria-label="${esc(`${s.total} learning loops: ${s.on} on, ${s.older} on an older path or waiting for input, ${s.off} off. ${s.witnessed} seen working all the way round. Each loop is linked to what it improves.`)}">`
    + `<text class="lw-col" x="20" y="22">LOOP · LEARNS FROM</text><text class="lw-col" x="492" y="22" text-anchor="end">STATUS</text><text class="lw-col" x="620" y="22">IMPROVES</text>`
    + rows + targets + '</svg>';
}

// The flywheel: the whole learning cycle on one ring. Agents produce outputs, people respond, loops learn, what
// changed feeds the next outputs. Optional `model.flywheel` = { products[], responses[], guards[] }; loops add
// `responses` (response ids) and `guard: true` for checks that watch the cycle; targets add `feeds` (product ids).
const RANK = { observed: 3, carried: 2, attention: 1, unknown: 0 };
const STATUS_RANK = { on: 3, older: 2, idle: 1, off: 0 };
export function validateFlywheel(model) {
  const f = model.flywheel, problems = [];
  if (!f) return true;
  for (const k of ['products', 'responses']) if (!Array.isArray(f[k]) || !f[k].length) problems.push(`flywheel.${k}[] is required`);
  const prods = new Set((f.products ?? []).map(x => x.id)), resp = new Set((f.responses ?? []).map(x => x.id));
  for (const t of model.targets ?? []) for (const id of t.feeds ?? []) if (!prods.has(id)) problems.push(`${t.id}: feeds names unknown product ${id}`);
  for (const l of model.loops ?? []) for (const id of l.responses ?? []) if (!resp.has(id)) problems.push(`${l.id}: responses names unknown response ${id}`);
  for (const g of f.guards ?? []) if (!LOOP_STATUSES.includes(g.status)) problems.push(`guard ${g.id}: status must be one of ${LOOP_STATUSES.join(', ')}`);
  if (problems.length) throw new Error('Invalid flywheel:\n- ' + problems.join('\n- '));
  return true;
}
export function renderFlywheel(model) {
  validateFlywheel(model);
  const f = model.flywheel, ring = model.loops.filter(l => !l.guard);
  const live = ring.filter(l => l.status !== 'off'), witnessed = ring.some(loopWitnessed);
  const bestStatus = ls => ls.reduce((b, l) => STATUS_RANK[l.status] > STATUS_RANK[b] ? l.status : b, 'off');
  const lh = 20, W = 960, cx = 480, r = 150, nr = 52;
  const top = 44 + f.products.length * lh + 18, cy = top + nr + r;
  const P = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]];
  const NODES = ['Agents produce', 'People respond', 'Loops learn', 'Knowledge changes'];
  const STAGE_INTO = ['signal', 'transform', 'artifact', 'consumption']; // arc i runs from node i to node i+1
  const arcState = i => live.reduce((b, l) => { const s = l.stages.find(x => x.id === STAGE_INTO[i])?.state ?? 'unknown'; return RANK[s] > RANK[b] ? s : b; }, 'unknown');
  const arcs = [0, 1, 2, 3].map(i => {
    const a1 = (i - 1) * Math.PI / 2 + 0.42, a2 = i * Math.PI / 2 - 0.42;
    const pt = a => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
    const d = `M${pt(a1)} A${r} ${r} 0 0 1 ${pt(a2)}`;
    return `<path class="lw-arc lw-${arcState(i)}${i === 3 ? ' lw-return' : ''}" d="${d}" marker-end="url(#lw-fw-head)"/>` + (witnessed ? `<path class="lw-current" d="${d}" style="animation-delay:${i * 0.6}s"/>` : '');
  }).join('');
  const nodes = NODES.map((n, i) => { const [x, y] = P[i], [a, b] = n.split(' ');
    return `<g class="lw-stage lw-fw-node"><circle cx="${x}" cy="${y}" r="${nr}"/><text x="${x}" y="${y - 3}" text-anchor="middle" class="lw-stage-name">${esc(a)}</text><text x="${x}" y="${y + 14}" text-anchor="middle" class="lw-stage-name">${esc(b)}</text></g>`; }).join('');
  const dot = (x, y, status) => `<circle class="lw-fw-dot lw-s-${status}" cx="${x}" cy="${y}" r="4.5"/>`;
  const feeding = p => model.targets.filter(t => (t.feeds ?? []).includes(p.id) && ring.some(l => l.improves === t.id && l.status !== 'off'));
  const prodRows = f.products.map((p, i) => { const y = 44 + i * lh, fd = feeding(p);
    return dot(cx - 150, y - 4, fd.length ? 'on' : 'off') + `<text class="lw-row-name lw-fw-item" x="${cx - 140}" y="${y}">${esc(p.label)}<tspan class="lw-row-sub">${fd.length ? ` · uses ${esc(fd.map(t => t.label.toLowerCase()).join(', '))}` : ' · nothing learned feeds it yet'}</tspan></text>`; }).join('');
  const respRows = f.responses.map((x, i) => { const y = cy - (f.responses.length - 1) * lh / 2 + i * lh, ls = ring.filter(l => (l.responses ?? []).includes(x.id));
    return dot(cx + r + nr + 24, y - 4, bestStatus(ls)) + `<text class="lw-row-name lw-fw-item" x="${cx + r + nr + 34}" y="${y}">${esc(x.label)}</text>`; }).join('');
  const tH = 38, tgt = model.targets.filter(t => ring.some(l => l.improves === t.id));
  const tgtRows = tgt.map((t, i) => { const y = cy - (tgt.length - 1) * tH / 2 + i * tH - 4, ls = ring.filter(l => l.improves === t.id);
    const fd = (t.feeds ?? []).map(id => f.products.find(p => p.id === id).label.toLowerCase());
    return dot(cx - r - nr - 24, y - 4, bestStatus(ls)) + `<text class="lw-row-name lw-fw-item" x="${cx - r - nr - 34}" y="${y}" text-anchor="end">${esc(t.label)}</text>`
      + `<text class="lw-row-sub" x="${cx - r - nr - 34}" y="${y + 15}" text-anchor="end">${fd.length ? 'feeds ' + esc(fd.join(', ')) : 'feeds nothing yet'}</text>`; }).join('');
  const order = ['on', 'older', 'idle', 'off'], sorted = [...ring].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  const half = Math.ceil(sorted.length / 2), lt = cy + r + nr + 28;
  const loopRows = sorted.map((l, i) => { const col = i < half ? 0 : 1, y = lt + (i % half) * lh, x = col ? cx + 30 : cx - 330;
    return dot(x, y - 4, l.status) + `<a href="#lw-loop-${esc(l.id)}"><text class="lw-row-name lw-fw-item" x="${x + 10}" y="${y}">${esc(l.name)}<tspan class="lw-row-sub"> · ${esc(STATUS_LABEL[l.status])}${loopWitnessed(l) ? ', seen working' : ''}</tspan></text></a>`; }).join('');
  let H = lt + half * lh + 8;
  const guards = (f.guards ?? []).map((g, i) => { const y = H + 50 + i * lh;
    return dot(cx - 330, y - 4, g.status) + `<text class="lw-row-name lw-fw-item" x="${cx - 320}" y="${y}">${esc(g.label)}<tspan class="lw-row-sub"> · ${esc(STATUS_LABEL[g.status])}${g.detail ? ' · ' + esc(g.detail) : ''}</tspan></text>`; }).join('');
  const guardBand = guards ? `<line class="lw-fw-guard" x1="40" x2="${W - 40}" y1="${H}" y2="${H}"/><text class="lw-col" x="40" y="${H + 26}">WATCHING THE CYCLE</text>` + guards : '';
  if (guards) H += 50 + f.guards.length * lh + 8;
  const s = wheelSummary({ ...model, loops: ring });
  const label = `Learning flywheel: agents produce outputs, people respond, loops learn, and what changes feeds the next outputs. ${live.length} of ${ring.length} loops are on; ${s.witnessed} seen working all the way round.`;
  return `<svg class="lw-flywheel" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">`
    + `<defs><marker id="lw-fw-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="1.6"/></marker></defs>`
    + `<text class="lw-col" x="${cx}" y="20" text-anchor="middle">WHAT THE AGENTS PRODUCE</text>`
    + arcs + nodes + prodRows + respRows + tgtRows + loopRows + guardBand + '</svg>';
}

/** The same flywheel as four stacked stages, for narrow screens (the ring needs about 760px). */
export function renderFlywheelList(model) {
  const f = model.flywheel, ring = model.loops.filter(l => !l.guard);
  const li = (status, text, sub) => `<li><span class="lw-dot lw-s-${status}" aria-hidden="true"></span><span>${esc(text)}${sub ? ` <span class="lw-row-sub">${esc(sub)}</span>` : ''}</span></li>`;
  const best = ls => ls.reduce((b, l) => STATUS_RANK[l.status] > STATUS_RANK[b] ? l.status : b, 'off');
  const used = p => model.targets.filter(t => (t.feeds ?? []).includes(p.id) && ring.some(l => l.improves === t.id && l.status !== 'off'));
  const stage = (title, items) => `<li><strong>${esc(title)}</strong><ul>${items.join('')}</ul></li>`;
  return `<ol class="lw-fw-list">`
    + stage('Agents produce', f.products.map(p => { const u = used(p); return li(u.length ? 'on' : 'off', p.label, u.length ? 'uses ' + u.map(t => t.label.toLowerCase()).join(', ') : 'nothing learned feeds it yet'); }))
    + stage('People respond', f.responses.map(x => li(best(ring.filter(l => (l.responses ?? []).includes(x.id))), x.label)))
    + stage('Loops learn', [...ring].sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status]).map(l => li(l.status, l.name, STATUS_LABEL[l.status])))
    + stage('Knowledge changes, then feeds the next outputs', model.targets.filter(t => ring.some(l => l.improves === t.id)).map(t => li(best(ring.filter(l => l.improves === t.id)), t.label, (t.feeds ?? []).length ? 'feeds ' + t.feeds.map(id => f.products.find(p => p.id === id).label.toLowerCase()).join(', ') : 'feeds nothing yet')))
    + ((f.guards ?? []).length ? stage('Watching the cycle', f.guards.map(g => li(g.status, g.label, STATUS_LABEL[g.status] + (g.detail ? ' · ' + g.detail : '')))) : '')
    + '</ol>';
}

export function renderLearningWheel(model, { id = 'learning-loops', title = 'How Waatr learns' } = {}) {
  validateLearningWheel(model);
  const s = wheelSummary(model);
  const card = l => {
    const t = model.targets.find(x => x.id === l.improves);
    const tick = (l.tickets ?? []).map(k => { const h = safeHref(k.href); return h ? `<a href="${esc(h)}">${esc(k.id)}</a>` : esc(k.id); }).join(' ');
    return `<details class="lw-loop" id="lw-loop-${esc(l.id)}"><summary><span class="lw-dot lw-s-${l.status}${loopWitnessed(l) ? ' lw-seen' : ''}" aria-hidden="true"></span>`
      + `<strong>${esc(l.name)}</strong><span class="lw-chip lw-s-${l.status}">${esc(STATUS_LABEL[l.status])}</span></summary>`
      + `<div class="lw-loop-body">${renderLoopCycle(l)}<dl>`
      + `<dt>Learns from</dt><dd>${esc(l.learnsFrom)}</dd><dt>Improves</dt><dd>${esc(t.label)}</dd>`
      + (l.whyStatus ? `<dt>${l.status === 'on' ? 'Note' : 'Why'}</dt><dd>${esc(l.whyStatus)}</dd>` : '')
      + (l.missing ? `<dt>Next proof</dt><dd>${esc(l.missing)}</dd>` : '')
      + (tick ? `<dt>Ticket</dt><dd>${tick}</dd>` : '') + '</dl></div></details>';
  };
  const order = ['on', 'older', 'idle', 'off'];
  return `<section class="lw-section" id="${esc(id)}" aria-labelledby="${esc(id)}-heading">`
    + `<div class="rm-structure-heading"><h2 id="${esc(id)}-heading">${esc(title)}</h2><p>${esc(model.observedOn ? 'Checked ' + model.observedOn : '')}</p></div>`
    + `<p class="lw-lede"><strong>${s.on} on</strong> · <strong>${s.older} on an older path or waiting</strong> · <strong>${s.off} off</strong> · ${s.total} loops. `
    + `${s.witnessed ? `${s.witnessed} seen working all the way round.` : 'None seen working all the way round yet.'}</p>`
    + (model.flywheel
      ? `<figure class="lw-figure lw-fw-figure">${renderFlywheel(model)}${renderFlywheelList(model)}<figcaption>Agents produce work, people respond, loops learn from the responses, and what they change feeds the next piece of work. A moving dot means that part was seen working; dashed means not seen yet.</figcaption></figure>`
      : `<figure class="lw-figure">${renderWheelOverview(model)}<figcaption>Each loop listens for something, changes one thing, and that change is used next time. Open a loop to see where its circle is broken.</figcaption></figure>`)
    + `<div class="lw-loops">${[...model.loops].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || model.targets.findIndex(t => t.id === a.improves) - model.targets.findIndex(t => t.id === b.improves)).map(card).join('')}</div>`
    + `<p class="lw-key"><span class="lw-dot lw-s-on lw-seen"></span> moving: seen working · solid: built · dashed: not seen yet. "On" means switched on, not proven to help.</p>`
    + '</section>';
}

/** Optional: pause the current animation while the section is offscreen. */
export const learningWheelScript = '<script>(()=>{const io=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle("lw-offscreen",!e.isIntersecting)));document.querySelectorAll(".lw-section").forEach(s=>io.observe(s));})();</script>';
