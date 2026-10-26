// Freshness: every dated block on a page says what kind of observation it is and when it was observed, and the
// page shows its age. A block older than its kind allows reads Stale; a refresh may leave a block stale only by
// saying so ("not rechecked since <date>"). Section families keep one current copy; older copies are dated History.
// Static markup plus one small inline script; without JavaScript the printed dates remain.

/** Default maximum age in days per kind. A project may override any of these (manifest `freshness.maxAgeDays`). */
export const FRESHNESS_KINDS = Object.freeze({
  probe: 3,        // runtime and deploy probes
  delivery: 7,     // tracker and delivery counts
  grade: 30,       // grades, lenses, cohort and finding rechecks
  architecture: 30,
  learning: 30,    // learning-system and loop views
});

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[A-Za-z][\w:.-]*$/;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function dayNumber(date, what) {
  const ms = typeof date === 'string' && DATE.test(date) ? Date.parse(`${date}T00:00:00Z`) : NaN;
  if (Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== date) throw new Error(`${what} must be a real YYYY-MM-DD date, got ${JSON.stringify(date)}`);
  return ms / 864e5;
}

export const carriedPhrase = observedOn => `not rechecked since ${observedOn}`;

/** Defaults merged with project overrides. Unknown kinds and non-positive ages are refused. */
export function resolveMaxAges(overrides = {}) {
  if (overrides === null || typeof overrides !== 'object' || Array.isArray(overrides)) throw new Error('freshness.maxAgeDays must be an object of kind: days');
  for (const [kind, days] of Object.entries(overrides)) {
    if (!(kind in FRESHNESS_KINDS)) throw new Error(`Unknown freshness kind ${JSON.stringify(kind)}; kinds are ${Object.keys(FRESHNESS_KINDS).join(', ')}`);
    if (!Number.isInteger(days) || days < 1) throw new Error(`freshness.maxAgeDays.${kind} must be a positive whole number of days`);
  }
  return { ...FRESHNESS_KINDS, ...overrides };
}

/** Whole days from observedOn to asOf (both YYYY-MM-DD, UTC). */
export const ageInDays = (observedOn, asOf) => dayNumber(asOf, 'asOf') - dayNumber(observedOn, 'observedOn');

function validateBlock(block, maxAges) {
  if (!block || typeof block.id !== 'string' || !ID.test(block.id)) throw new Error('A dated block needs an element id the freshness strip can link to');
  if (!(block.kind in maxAges)) throw new Error(`${block.id}: kind must be one of ${Object.keys(maxAges).join(', ')}`);
  dayNumber(block.observedOn, `${block.id}: observedOn`);
  if (!String(block.label ?? '').trim()) throw new Error(`${block.id}: label is required (the strip names the block by it)`);
  if (block.supersededOn !== undefined && ageInDays(block.observedOn, block.supersededOn) < 0) throw new Error(`${block.id}: supersededOn is before observedOn`);
}

/**
 * Attributes for a dated block's own element. `carried: true` marks a block a refresh deliberately did not recheck;
 * `supersededOn` marks a History copy replaced by a newer one (`family` names the section family).
 */
export function freshnessAttributes(block, { maxAgeDays } = {}) {
  const maxAges = resolveMaxAges(maxAgeDays);
  validateBlock(block, maxAges);
  let out = ` id="${esc(block.id)}" data-kind="${esc(block.kind)}" data-observed-on="${esc(block.observedOn)}" data-max-age-days="${maxAges[block.kind]}" data-freshness-label="${esc(block.label)}"`;
  if (block.family) out += ` data-section-family="${esc(block.family)}"`;
  if (block.supersededOn) out += ` data-superseded-on="${esc(block.supersededOn)}"`;
  if (block.carried) out += ` data-carried="${esc(carriedPhrase(block.observedOn))}"`;
  return out;
}

/** The visible age line. Prints the observed date; the script replaces it with the age and shows Stale. */
export function renderFreshnessBadge(block) {
  validateBlock(block, FRESHNESS_KINDS);
  const date = `<time datetime="${esc(block.observedOn)}">${esc(block.observedOn)}</time>`;
  if (block.supersededOn) return `<p class="fz-badge is-superseded" data-freshness-for="${esc(block.id)}">Observed ${date} · superseded ${esc(block.supersededOn)}</p>`;
  return `<p class="fz-badge" data-freshness-for="${esc(block.id)}"><span class="fz-age">Observed ${date}</span>`
    + `<strong class="fz-stale" hidden>Stale</strong>`
    + (block.carried ? `<span class="fz-carried">${esc(carriedPhrase(block.observedOn))}</span>` : '')
    + `</p>`;
}

/**
 * The strip at the top of the page listing every stale block with a link. Pass `blocks` and `asOf` to pre-render the
 * list for readers without JavaScript; the script recomputes it at view time either way.
 */
export function renderFreshnessStrip({ blocks = [], asOf, maxAgeDays } = {}) {
  const maxAges = resolveMaxAges(maxAgeDays);
  const stale = asOf ? blocks.filter(b => !b.supersededOn && ageInDays(b.observedOn, asOf) > maxAges[b.kind]) : [];
  const items = stale.map(b => `<li><a href="#${esc(b.id)}">${esc(b.label)}</a> <span>observed ${esc(b.observedOn)}${b.carried ? ` · ${esc(carriedPhrase(b.observedOn))}` : ''}</span></li>`).join('');
  return `<aside class="fz-strip" id="freshness-strip" aria-labelledby="freshness-strip-title"${stale.length ? '' : ' hidden'}>`
    + `<p id="freshness-strip-title"><strong>Stale</strong> <span class="fz-count">${stale.length} ${stale.length === 1 ? 'block is' : 'blocks are'} older than ${stale.length === 1 ? 'its' : 'their'} kind allows${asOf ? ` as of ${esc(asOf)}` : ''}</span></p>`
    + `<ul>${items}</ul></aside>`;
}

/** View-time age, Stale badges and the strip. Ages are whole UTC days. */
export const freshnessScript = '<script data-freshness-script>(()=>{const now=new Date(),today=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()),stale=[];document.querySelectorAll("[data-observed-on][data-kind][data-max-age-days]:not([data-superseded-on])").forEach(el=>{const t=Date.parse(el.dataset.observedOn+"T00:00:00Z");if(Number.isNaN(t))return;const age=Math.max(0,Math.round((today-t)/864e5)),old=age>Number(el.dataset.maxAgeDays);el.toggleAttribute("data-stale",old);const badge=el.id&&document.querySelector("[data-freshness-for=\\""+CSS.escape(el.id)+"\\"]");if(badge){const a=badge.querySelector(".fz-age");if(a){a.textContent=age===0?"Observed today":"Observed "+age+(age===1?" day":" days")+" ago";a.title=el.dataset.observedOn;}const s=badge.querySelector(".fz-stale");if(s)s.hidden=!old;}if(old)stale.push(el);});const strip=document.getElementById("freshness-strip");if(!strip)return;const list=strip.querySelector("ul"),count=strip.querySelector(".fz-count");list.replaceChildren(...stale.map(el=>{const li=document.createElement("li"),a=document.createElement("a"),s=document.createElement("span");a.href="#"+el.id;a.textContent=el.dataset.freshnessLabel||el.id;s.textContent=" observed "+el.dataset.observedOn+(el.dataset.carried?" · "+el.dataset.carried:"");li.append(a,s);return li;}));if(count)count.textContent=stale.length+(stale.length===1?" block is older than its kind allows":" blocks are older than their kind allows");strip.hidden=!stale.length;strip.addEventListener("click",e=>{const a=e.target.closest("a[href^=\\"#\\"]");if(!a)return;let n=document.getElementById(a.getAttribute("href").slice(1));for(;n;n=n.parentElement)if(n.tagName==="DETAILS")n.open=true;});})();</script>';

function attributes(tag) {
  const out = {};
  for (const [, name, , dq, sq, bare] of tag.matchAll(/\s([\w:-]+)(\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) out[name.toLowerCase()] = dq ?? sq ?? bare ?? '';
  return out;
}

/**
 * Read every dated block from page HTML and enforce the freshness contract. With `refreshedOn`, a current block older
 * than its kind allows fails unless it is marked carried. Returns the blocks; throws listing every problem.
 */
export function auditFreshness(html, { maxAgeDays, refreshedOn } = {}) {
  const maxAges = resolveMaxAges(maxAgeDays);
  if (refreshedOn !== undefined) dayNumber(refreshedOn, 'refreshedOn');
  const problems = [], blocks = [], families = new Map();
  // Script and style bodies are data, not markup: a JSON record mentioning an attribute is not a block.
  const markup = html.replace(/(<(script|style|template)\b[^>]*>)[\s\S]*?(<\/\2>)/gi, '$1$3');
  const tags = [...markup.matchAll(/<[a-z][\w-]*(?:\s+[^\s"'>=\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*\s*\/?>/gi)].map(m => m[0]);
  const ids = new Set(tags.flatMap(tag => attributes(tag).id ?? []));
  const badges = new Set(tags.flatMap(tag => attributes(tag)['data-freshness-for'] ?? []));
  for (const tag of tags) {
    if (!/\sdata-(observed-on|carried|superseded-on|max-age-days|kind|section-family)\b/.test(tag)) continue;
    const a = attributes(tag);
    const dated = 'data-observed-on' in a || 'data-carried' in a || 'data-superseded-on' in a || 'data-max-age-days' in a || ('data-kind' in a && a['data-kind'] in maxAges);
    if (!dated) { if ('data-section-family' in a) problems.push(`Section family ${a['data-section-family']} on an undated block: add data-kind and data-observed-on`); continue; }
    const name = a.id || tag.slice(0, 60);
    try {
      if (!(a['data-kind'] in maxAges)) throw new Error(`dated block ${name} needs data-kind, one of ${Object.keys(maxAges).join(', ')}`);
      if (!('data-observed-on' in a)) throw new Error(`dated block ${name} needs data-observed-on`);
      const block = { id: a.id, kind: a['data-kind'], observedOn: a['data-observed-on'], label: a['data-freshness-label'], family: a['data-section-family'], supersededOn: a['data-superseded-on'], carried: 'data-carried' in a };
      validateBlock(block, maxAges);
      if (Number(a['data-max-age-days']) !== maxAges[block.kind]) throw new Error(`${block.id}: data-max-age-days must be ${maxAges[block.kind]} for kind ${block.kind}`);
      if (block.carried && a['data-carried'] !== carriedPhrase(block.observedOn)) throw new Error(`${block.id}: data-carried must read "${carriedPhrase(block.observedOn)}"`);
      if (!block.supersededOn && !badges.has(block.id)) throw new Error(`${block.id}: no visible age (render a freshness badge with data-freshness-for="${block.id}")`);
      if (refreshedOn !== undefined && ageInDays(block.observedOn, refreshedOn) < 0) throw new Error(`${block.id}: observed ${block.observedOn}, after the refresh date ${refreshedOn}`);
      if (refreshedOn !== undefined && !block.supersededOn && !block.carried && ageInDays(block.observedOn, refreshedOn) > maxAges[block.kind]) throw new Error(`${block.id}: refreshed ${refreshedOn} but still observed ${block.observedOn}, older than ${maxAges[block.kind]} days for ${block.kind}; recheck it, or mark it data-carried="${carriedPhrase(block.observedOn)}"`);
      if (block.family && !block.supersededOn) families.set(block.family, [...(families.get(block.family) ?? []), block.id]);
      blocks.push(block);
    } catch (error) { problems.push(error.message); }
  }
  for (const [family, members] of families) if (members.length > 1) problems.push(`Section family ${family} has ${members.length} current copies (${members.join(', ')}); keep one and move the others to History with data-superseded-on`);
  for (const id of badges) if (!ids.has(id)) problems.push(`Freshness badge points at missing block ${id}`);
  if (blocks.some(b => !b.supersededOn)) {
    if (!/\bid=["']freshness-strip["']/.test(html)) problems.push('Page has dated blocks but no freshness strip (renderFreshnessStrip)');
    if (!/<script\b[^>]*\bdata-freshness-script\b/.test(html)) problems.push('Page has dated blocks but no freshness script (freshnessScript)');
  }
  if (problems.length) throw new Error('Freshness check failed:\n- ' + problems.join('\n- '));
  return blocks;
}
