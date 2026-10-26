// Skill flow: how a project's skills, agents or pipeline steps chain, who decides at each gate, which tools and
// stores each step uses, and every avenue (scenario) through it. Swimlane SVG laid out from lane and column indexes,
// then a numbered run order and a live / being-built status panel. Static HTML + inline SVG; the avenue chips need
// `skillFlowScript`, and without JavaScript every avenue is listed as text instead.

export const NODE_KINDS = ['run', 'person', 'tool', 'store'];
export const NODE_STATUSES = ['live', 'building'];
export const EDGE_KINDS = ['handoff', 'gate', 'uses'];
// sized to read at 100%: the svg never scales below MIN_SCALE (it scrolls instead), so these are on-screen pixels
const COL_W = 244, NODE_W = 172, ROW_H = 132, LANE_HEAD = 40, PAD = 28, LINE = 18, MIN_SCALE = 0.86;
const NODE_H = { run: 82, person: 66, tool: 66, store: 62 };
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const int = v => Number.isInteger(v) && v >= 0;
const half = v => Number.isInteger(v * 2) && v >= 0; // a half column lets a tool sit between two steps, off a store's edge

export function validateSkillFlow(model) {
  const problems = [], lanes = model?.lanes ?? [], nodes = model?.nodes ?? [], edges = model?.edges ?? [];
  if (!lanes.length) problems.push('lanes[] is required');
  const laneIds = new Set(lanes.map(l => l.id));
  if (laneIds.size !== lanes.length) problems.push('lane ids must be unique');
  const ids = new Map();
  const claim = (id, what) => { if (!id) problems.push(`${what} needs an id`); else if (ids.has(id)) problems.push(`duplicate id ${id}`); else ids.set(id, what); };
  const byId = {}, slots = {};
  for (const n of nodes) {
    claim(n.id, 'node'); byId[n.id] = n;
    if (!NODE_KINDS.includes(n.kind)) problems.push(`${n.id}: kind must be one of ${NODE_KINDS.join(', ')}`);
    if (n.status !== undefined && !NODE_STATUSES.includes(n.status)) problems.push(`${n.id}: status must be one of ${NODE_STATUSES.join(', ')}`);
    if (!laneIds.has(n.lane)) problems.push(`${n.id}: lane must name a lane id`);
    if (!half(n.col) || !int(n.row ?? 0)) problems.push(`${n.id}: col must be a whole or half number from 0, row a whole number from 0`);
    if (!n.label) problems.push(`${n.id}: label is required`);
    const slot = `${n.lane}/${n.row ?? 0}`, clash = (slots[slot] ??= []).find(m => Math.abs(m.col - n.col) < 1);
    if (clash) problems.push(`${n.id}: overlaps ${clash.id} in lane ${n.lane}, row ${n.row ?? 0}; columns in one row must be at least 1 apart`);
    slots[slot].push(n);
  }
  for (const e of edges) {
    const name = e.id ?? `${e.from}->${e.to}`;
    if (e.id !== undefined) claim(e.id, 'edge');
    if (!EDGE_KINDS.includes(e.kind)) problems.push(`${name}: kind must be one of ${EDGE_KINDS.join(', ')}`);
    if (!byId[e.from] || !byId[e.to]) { problems.push(`${name}: edge names a missing node`); continue; }
    const kinds = [byId[e.from].kind, byId[e.to].kind];
    if (e.kind === 'gate' && !kinds.includes('person')) problems.push(`${name}: a gate edge must touch a person`);
    if (e.kind === 'uses' && !kinds.some(k => k === 'tool' || k === 'store')) problems.push(`${name}: a uses edge must touch a tool or store`);
  }
  const chained = edges.some(e => e.kind === 'handoff' && byId[e.from]?.kind === 'run' && byId[e.to]?.kind === 'run');
  if (!chained) problems.push('a skill flow needs at least two run steps joined by a handoff; one step is not a flow');
  const scenarioIds = new Set();
  for (const s of model?.scenarios ?? []) {
    if (!s.id || scenarioIds.has(s.id)) problems.push(`scenario ids must be present and unique (${s.id})`);
    scenarioIds.add(s.id);
    if (!s.label || !s.note) problems.push(`scenario ${s.id}: label and note are required`);
    for (const m of s.members ?? []) if (!ids.has(m)) problems.push(`scenario ${s.id}: member ${m} is not a node or edge id`);
  }
  for (const step of model?.order ?? []) {
    if (!byId[step.node]) problems.push(`order step "${step.title}": node ${step.node} does not exist`);
    if (!step.title) problems.push('every order step needs a title');
  }
  if (problems.length) throw new Error('Invalid skill flow model:\n- ' + problems.join('\n- '));
  return true;
}

/** Which scenarios each element is on in. An element no scenario names is on in all; an unnamed edge follows its ends. */
export function scenarioMembership(model) {
  const scenarios = model.scenarios ?? [], named = new Set(scenarios.flatMap(s => s.members ?? []));
  const nodeOn = (id, s) => !named.has(id) || s.members.includes(id);
  const on = {};
  for (const n of model.nodes) on[n.id] = scenarios.filter(s => nodeOn(n.id, s)).map(s => s.id);
  model.edges.forEach((e, i) => {
    on[e.id ?? `edge-${i}`] = scenarios.filter(s => (e.id && named.has(e.id)) ? s.members.includes(e.id) : nodeOn(e.from, s) && nodeOn(e.to, s)).map(s => s.id);
  });
  return on;
}

export function skillFlowLayout(model) {
  const rows = id => Math.max(1, ...model.nodes.filter(n => n.lane === id).map(n => (n.row ?? 0) + 1));
  const cols = Math.ceil(Math.max(...model.nodes.map(n => n.col)) + 1);
  let y = 0;
  const lanes = model.lanes.map(l => { const h = LANE_HEAD + rows(l.id) * ROW_H; const lane = { ...l, y, h }; y += h; return lane; });
  const laneOf = Object.fromEntries(lanes.map(l => [l.id, l]));
  const boxes = Object.fromEntries(model.nodes.map(n => {
    // shortcut: width from character count, not measured text; a label over ~28 characters still overflows
    const perChar = n.kind === 'tool' ? 7.9 : 7.6; // tool titles are monospace
    const w = Math.min(COL_W - 20, Math.max(NODE_W, ...[n.label, n.sub, n.tag].filter(Boolean).map(t => t.length * perChar + 24)));
    const h = NODE_H[n.kind], cx = PAD + n.col * COL_W + COL_W / 2, top = laneOf[n.lane].y + LANE_HEAD + (n.row ?? 0) * ROW_H;
    return [n.id, { x: cx - w / 2, y: top, w, h, cx, cy: top + h / 2 }];
  }));
  return { width: PAD * 2 + cols * COL_W, height: y, lanes, boxes };
}

function edgePath(a, b, sameRow) {
  if (sameRow && Math.abs(b.cx - a.cx) <= COL_W) {
    const [sx, ex] = b.cx > a.cx ? [a.x + a.w, b.x - 3] : [a.x, b.x + b.w + 3];
    return { d: `M${sx} ${a.cy} H${ex}`, lx: (sx + ex) / 2, ly: Math.min(a.y, b.y) - 10, anchor: 'middle' }; // above the boxes: the gap between them is narrower than a label
  }
  if (sameRow) { // skips a column: arc over the boxes between
    const top = a.y - 3, peak = a.y - 30;
    return { d: `M${a.cx} ${a.y} C${a.cx} ${peak}, ${b.cx} ${peak}, ${b.cx} ${top}`, lx: (a.cx + b.cx) / 2, ly: peak + 2, anchor: 'middle' };
  }
  // several edges into one box arrive spread across it, nearer the side they come from
  const up = b.y < a.y, ex = b.cx + Math.max(-b.w / 3, Math.min(b.w / 3, (a.cx - b.cx) / 4));
  const sx = a.cx, sy = up ? a.y : a.y + a.h, ey = up ? b.y + b.h + 3 : b.y - 3, my = (sy + ey) / 2;
  return { d: `M${sx} ${sy} C${sx} ${my}, ${ex} ${my}, ${ex} ${ey}`, lx: sx + 6, ly: up ? sy - 8 : sy + 17, anchor: 'start' }; // label at the source: one source rarely sends two
}

export function renderSkillFlowSvg(model, { id = 'skill-flow', label } = {}) {
  const L = skillFlowLayout(model), on = scenarioMembership(model), all = (model.scenarios ?? []).length;
  const byId = Object.fromEntries(model.nodes.map(n => [n.id, n]));
  const sf = key => on[key].length === all ? '' : ` data-sf="${esc(on[key].join(' '))}"`;
  const bands = L.lanes.map((l, i) => (i % 2 ? '' : `<rect class="sf-band" x="0" y="${l.y}" width="${L.width}" height="${l.h}"/>`)
    + `<text class="sf-lane" x="16" y="${l.y + 24}">${esc(l.label)}</text>`).join('');
  const paths = model.edges.map((e, i) => {
    const na = byId[e.from], nb = byId[e.to];
    return { e, key: e.id ?? `edge-${i}`, p: edgePath(L.boxes[e.from], L.boxes[e.to], na.lane === nb.lane && (na.row ?? 0) === (nb.row ?? 0)) };
  });
  const edges = paths.map(({ e, key, p }) => `<g class="sf-edge sf-${e.kind}"${sf(key)}><path d="${p.d}" marker-end="url(#${esc(id)}-ah-${e.kind})"/></g>`).join('');
  // labels go on top of the boxes, haloed, so a box never hides one
  const labels = paths.filter(({ e }) => e.label).map(({ e, key, p }) => `<text class="sf-elabel"${sf(key)} x="${p.lx}" y="${p.ly}" text-anchor="${p.anchor}">${esc(e.label)}</text>`).join('');
  const nodes = model.nodes.map(n => {
    const b = L.boxes[n.id], cls = ['sf-node', `sf-${n.kind}`, n.status === 'building' && 'sf-building', n.optional && 'sf-optional'].filter(Boolean).join(' ');
    const stack = n.multiple ? [10, 5].map(o => `<rect class="sf-stack" x="${b.x + o}" y="${b.y + o}" width="${b.w}" height="${b.h}" rx="8"/>`).join('') : '';
    const lines = [[n.label, 'sf-title'], [n.sub, 'sf-sub'], [n.tag, 'sf-tag']].filter(([t]) => t);
    const top = b.cy - (lines.length - 1) * LINE / 2 + 5;
    return `<g class="${cls}"${sf(n.id)}>${stack}<rect class="sf-box" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="8"/>`
      + lines.map(([t, c], i) => `<text class="${c}" x="${b.cx}" y="${top + i * LINE}" text-anchor="middle">${esc(t)}</text>`).join('') + '</g>';
  }).join('');
  const marker = k => `<marker id="${esc(id)}-ah-${k}" class="sf-ah-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>`;
  const runs = model.nodes.filter(n => n.kind === 'run').length, gates = model.edges.filter(e => e.kind === 'gate').length;
  const aria = label ?? `Skill flow: ${runs} steps across ${model.lanes.length} lanes, ${gates} person decisions. The run order below lists every step in text.`;
  return `<svg class="sf-flow" viewBox="0 0 ${L.width} ${L.height}" style="min-width:${Math.round(L.width * MIN_SCALE)}px" role="img" aria-label="${esc(aria)}"><defs>${EDGE_KINDS.map(marker).join('')}</defs>`
    + bands + edges + nodes + labels + '</svg>';
}

export function renderSkillFlow(model, { id = 'skill-flow', title = 'How the steps chain', lede = '', caption } = {}) {
  validateSkillFlow(model);
  const byId = Object.fromEntries(model.nodes.map(n => [n.id, n])), scenarios = model.scenarios ?? [];
  const chips = scenarios.length ? `<div class="sf-chips" role="group" aria-label="Choose an avenue" hidden>${scenarios.map((s, i) =>
    `<button type="button" class="sf-chip" data-sf-pick="${esc(s.id)}" data-sf-label="${esc(s.label)}" data-sf-note="${esc(s.note)}" aria-pressed="${i === 0}">${esc(s.label)}</button>`).join('')}</div>`
    + `<p class="sf-note" aria-live="polite" hidden></p>`
    + `<dl class="sf-avenues">${scenarios.map(s => `<dt>${esc(s.label)}</dt><dd>${esc(s.note)}</dd>`).join('')}</dl>` : '';
  const order = (model.order ?? []).length ? `<div class="sf-order"><h3>Run order</h3><ol class="sf-steps">${model.order.map(step =>
    `<li${byId[step.node].kind === 'person' ? ' class="sf-human"' : ''}><span class="sf-who">${esc(step.title)}</span>${step.detail ? `<span class="sf-what">${esc(step.detail)}</span>` : ''}</li>`).join('')}</ol></div>` : '';
  const group = (status, heading) => {
    const items = model.nodes.filter(n => n.status === status);
    return items.length ? `<div class="sf-status-group sf-${status}"><h3>${heading}</h3><ul>${items.map(n => `<li>${esc(n.label)}${n.tag ? ` <span class="sf-ticket">${esc(n.tag)}</span>` : ''}</li>`).join('')}</ul></div>` : '';
  };
  const status = group('live', 'Live') + group('building', 'Being built');
  return `<section class="sf-section" id="${esc(id)}" aria-labelledby="${esc(id)}-heading">`
    + `<div class="rm-structure-heading"><h2 id="${esc(id)}-heading">${esc(title)}</h2><p>${esc(model.observedOn ? 'Checked ' + model.observedOn : '')}</p></div>`
    + (lede ? `<p class="sf-lede">${esc(lede)}</p>` : '') + chips
    + `<figure class="sf-figure"><div class="sf-scroll">${renderSkillFlowSvg(model, { id })}</div>`
    + `<figcaption>${esc(caption ?? 'Solid arrows hand work from one step to the next; amber arrows are decisions only a person makes. Dashed lines are tools a step calls and stores it reads or updates; a dashed box is still being built.')}</figcaption>`
    + `<p class="sf-legend" aria-hidden="true"><span><i class="sf-sw sf-run"></i>Step</span><span><i class="sf-sw sf-person"></i>Person decides</span><span><i class="sf-sw sf-tool"></i>Tool or store</span><span><i class="sf-sw sf-building"></i>Being built</span></p></figure>`
    + ((order || status) ? `<div class="sf-cols">${order}${status ? `<aside class="sf-status" aria-label="Build status">${status}</aside>` : ''}</div>` : '')
    + '</section>';
}

/** A pipeline as its own view: one tab per pipeline, named after it. Declare `id` in the manifest's `pipelineViews`. */
export function renderSkillFlowView(model, { id, tabLabel, ...options }) {
  if (!/^[a-z][a-z0-9-]*$/.test(id ?? '')) throw new Error('A pipeline view needs a lowercase id');
  if (!tabLabel) throw new Error('A pipeline view needs tabLabel: the pipeline\'s name');
  return {
    tab: `<a id="tab-${id}" href="#view-${id}">${esc(tabLabel)}</a>`,
    view: `<section id="view-${id}" data-view="${id}" data-skill-pipeline="${id}" aria-labelledby="tab-${id}" tabindex="0">${renderSkillFlow(model, { id: `${id}-flow`, title: tabLabel, ...options })}${skillFlowScript}</section>`,
  };
}

/** Turns on the avenue chips: the picked avenue stays lit, everything off its path dims. */
export const skillFlowScript = '<script>(()=>{document.querySelectorAll(".sf-section:not([data-sf-ready])").forEach(sec=>{sec.dataset.sfReady="1";const chips=sec.querySelectorAll("[data-sf-pick]");if(!chips.length)return;const note=sec.querySelector(".sf-note");sec.querySelector(".sf-chips").hidden=false;note.hidden=false;sec.querySelector(".sf-avenues").hidden=true;const show=k=>{chips.forEach(c=>{const on=c.dataset.sfPick===k;c.setAttribute("aria-pressed",String(on));if(on){note.textContent="";const b=document.createElement("strong");b.textContent=c.dataset.sfLabel+". ";note.append(b,c.dataset.sfNote);}});sec.querySelectorAll("[data-sf]").forEach(el=>el.classList.toggle("sf-dim",!el.dataset.sf.split(" ").includes(k)));};chips.forEach(c=>c.addEventListener("click",()=>show(c.dataset.sfPick)));show(chips[0].dataset.sfPick);});})();</script>';
