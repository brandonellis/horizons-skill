# The interaction layer — filter · collapse · derived tooltips

Proven on shipped roadmap pages; adapt class names/tokens to the page's own
design system. Load the view shell from `artifact-views.md` first. Its panel
navigation is shared by all modes; this layer owns filter, collapse and previews.

1. **Theme filter** — the color-key strip IS the control. Clicking a theme hides
   non-matching item representations, including board pills, table rows and
   detail cards, injects a "nothing on this line in this horizon" placeholder into
   emptied sections, and shows a fixed clear-chip bottom-right (the filter must be
   clearable from anywhere on a long page). Shared `data-roadmap-item` hooks make
   the same selection apply to timeline rows and other item representations.
   History and overall grades stay unfiltered. Click the active key again, or the
   chip, to clear. Filter state is NOT persisted — a returning viewer gets the
   whole page.
2. **Collapsible sections** — every section header gets a chevron + count badge
   button ("8 cards", "23 pills"); clicking the header toggles. Collapsed state
   persists per-viewer in localStorage (try/catch both directions — storage can
   throw). Any in-page anchor navigation auto-expands the target's section and
   clears a filter that would hide the target (a jump must always land somewhere
   visible). Dense pages ship detail sections collapsed by default: put
   `hz-collapsed` on the section in markup. The loader respects both stored `1`
   and explicit `0`; no-JS and print always expose the full content.
3. **Derived tooltips** — hovering/focusing a pill previews its detail card:
   theme code, audience chip, title, first sentence of the "why". Content is read
   off the card DOM at first hover and cached, so the tooltip can never drift from
   the card. One fixed-position tip element appended to body (a tip inside an
   `overflow-x:auto` wrapper gets clipped); clamp to the viewport; flip below the
   pill when there is no room above; only when `(hover: hover)` matches — touch
   users tap through to the card; hide on any scroll (capture phase).

## Contents

- Adaptation contract
- CSS (as shipped — swap the custom properties for the page's own)
- JS (modern browsers, no dependencies)

## Adaptation contract

The code below assumes these hooks — rename to taste, keep the roles:
- theme classes `t1…tN` on pills, table rows, cards, and key links; multi-theme
  items carry `data-tl="t1 t3"` as well.
- the three horizon card sections carry `data-hz`.
- every item representation carries its stable `data-roadmap-item` ID; the
  Where we stand and History panels are never item-filtered. For a combined hub use
  `assets/progress-shell.js`, which scopes filtering to `data-view="roadmap"`.
  The legacy recipe below is for standalone roadmap pages, not combined hubs.
- a root element carries `data-roadmap-id="<project-and-scope-id>"` to namespace
  collapse preferences; `#roadmap-filter-status` lives with the key immediately
  above the chart, inside Roadmap, as a `role="status"` live region for counts.
- key links are `<a class="key-link tN" href="#...">` inside a `.key` strip
  (kept as anchors for no-JS fallback; JS adds role=button + aria-pressed).
- detail cards expose `.why`, `.chip`, `.tcode`; headings carry the ids that
  pills link to.
- a `<button class="filterchip" id="tlChip">` with `.fc-code/.fc-label/.fc-x`
  spans stays inside the roadmap surface, never on Progress or Evidence.
- collapse hides `section.hz-collapsed > *:not(.hz-head)` under `@media screen`
  only, so print always shows everything; the chevron transition sits behind
  `prefers-reduced-motion: no-preference`.

When a browser is already available, optionally smoke-test before publishing:
`chrome --headless=new --virtual-time-budget=4000 --dump-dom file://... | grep hz-toggle`
(the toggles + count badges are the last thing init renders, so their presence
means the script ran without throwing).

Do not require a browser install to run the skill. Record any check not performed.

## CSS (as shipped — swap the custom properties for the page's own)

```css

/* ============================================================
   INTERACTION LAYER: a filter that isolates one line,
   collapsible sections, and tooltips derived from the detail
   cards. Horizon labels are not schedule commitments.
   ============================================================ */

/* -- the throughline key doubles as the filter -- */
body.tl-filtered .key a:not(.f-on) { text-decoration: underline; }
.key a.f-on { outline: 2px solid var(--tc); outline-offset: -2px; opacity: 1; }

@media screen {
body.tl-filtered .board a.pill:not(.f-hit) { display: none; }
body.tl-filtered .thread:not(.f-hit) { display: none; }
body.tl-filtered section[data-hz] .grid > .card:not(.f-hit) { display: none; }
body.tl-filtered .roadmap-filtered-out { display: none !important; }
}
.f-empty {
  grid-column: 1 / -1; margin: 0;
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px; letter-spacing: .04em; color: var(--ink-3);
  border: 1px dashed var(--rule); padding: 14px 16px; background: var(--panel);
}

/* the standing filter chip: visible wherever you scroll, one click clears */
.filterchip {
  position: fixed; right: 20px; bottom: 68px; z-index: 40;
  display: none; align-items: center; gap: 10px;
  padding: 10px 14px; cursor: pointer;
  background: var(--console); color: #E4E9ED;
  border: 1px solid var(--console-edge); box-shadow: 0 6px 18px -10px rgba(0,0,0,.6);
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; line-height: 1;
}
body.tl-filtered .filterchip { display: flex; }
.filterchip .fc-label { color: #97A3AE; }
.filterchip .fc-x { font-size: 13px; }
.filterchip:hover { background: var(--console-2); border-color: var(--go); }
.filterchip:focus-visible { outline: 2px solid var(--go); outline-offset: 2px; }
@media print { .filterchip { display: none !important; } }

/* -- collapsible sections -- */
.hz-head { cursor: pointer; user-select: none; }
.hz-toggle {
  flex: none; margin-left: auto; align-self: center;
  display: inline-flex; align-items: center; gap: 7px;
  background: none; border: 1px solid var(--rule); color: var(--ink-3);
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
  padding: 4px 9px; cursor: pointer;
}
.hz-toggle:hover { color: var(--ink); border-color: var(--ink-2); }
.hz-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.hz-toggle .chev { display: inline-block; font-size: 9px; }
@media (prefers-reduced-motion: no-preference) { .hz-toggle .chev { transition: transform .18s ease; } }
section.hz-collapsed .hz-toggle .chev { transform: rotate(-90deg); }
@media screen { body.roadmap-interactive section.hz-collapsed > *:not(.hz-head) { display: none !important; } }
section.hz-collapsed { margin-bottom: 36px; }
@media print {
  .hz-toggle, .f-empty, #tlTip, #roadmap-filter-status { display: none !important; }
}

/* -- tooltips: content is read off the detail card at load, so it cannot drift -- */
#tlTip {
  position: fixed; z-index: 70; display: none; pointer-events: none;
  box-sizing: border-box; width: max-content; max-width: min(360px, calc(100vw - 16px));
  max-height: calc(100vh - 16px); overflow: auto; padding: 11px 13px 12px;
  background: var(--console); color: #E4E9ED;
  border: 1px solid var(--console-edge); box-shadow: 0 8px 22px -10px rgba(0,0,0,.7);
}
#tlTip .tt-kicker {
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9.5px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase;
  color: #97A3AE; display: block; margin-bottom: 5px;
}
#tlTip .tt-title {
  font-family: "Barlow Condensed", Barlow, sans-serif; font-weight: 700; font-size: 16px;
  line-height: 1.1; letter-spacing: .01em; text-transform: uppercase;
  display: block; margin-bottom: 5px;
}
#tlTip .tt-why { font-size: 13px; line-height: 1.45; color: #C7CFD6; display: block; }
```

## JS (modern browsers, no dependencies)

```js
(function () {
  "use strict";
  var d = document;
  var TLS = Array.from(new Set(Array.from(d.querySelectorAll(".key a")).flatMap(function (link) {
    return Array.from(link.classList).concat((link.getAttribute("data-tl") || "").split(/\s+/));
  }).filter(function (token) { return /^t\d+$/.test(token); })));

  function tlOf(el) {
    var hits = [];
    var extra = el.getAttribute ? el.getAttribute("data-tl") : null;
    for (var i = 0; i < TLS.length; i++) {
      var t = TLS[i];
      if (el.classList.contains(t) || (extra && extra.split(/\s+/).indexOf(t) >= 0)) hits.push(t);
    }
    return hits;
  }

  /* ---------------- filter: the key is the control ---------------- */
  var keyLinks = Array.prototype.slice.call(d.querySelectorAll(".key a"));
  var chip = d.getElementById("tlChip");
  var chipCode = chip ? chip.querySelector(".fc-code") : null;
  var active = null;
  var itemElements = Array.from(d.querySelectorAll("[data-roadmap-item]")).filter(function (element) {
    return !element.closest('[data-view="history"]');
  });
  function inHistory(element) { return !!element.closest('[data-view="history"]'); }

  function tlName(t) {
    for (var i = 0; i < keyLinks.length; i++) {
      if (keyLinks[i].classList.contains(t)) {
        var kn = keyLinks[i].querySelector(".kn");
        if (kn) return kn.textContent;
      }
    }
    return t.toUpperCase();
  }

  function applyFilter(t) {
    active = t;
    d.body.classList.toggle("tl-filtered", !!t);
    keyLinks.forEach(function (k) {
      var on = !!t && k.classList.contains(t);
      k.classList.toggle("f-on", on);
      k.setAttribute("aria-pressed", on ? "true" : "false");
    });
    d.querySelectorAll("a.pill").forEach(function (p) {
      p.classList.toggle("f-hit", inHistory(p) || !t || tlOf(p).indexOf(t) >= 0);
    });
    d.querySelectorAll(".thread").forEach(function (row) {
      row.classList.toggle("f-hit", inHistory(row) || !t || tlOf(row).indexOf(t) >= 0);
    });
    d.querySelectorAll("section[data-hz] .grid > .card").forEach(function (c) {
      c.classList.toggle("f-hit", inHistory(c) || !t || tlOf(c).indexOf(t) >= 0);
    });
    d.querySelectorAll("section[data-hz]").forEach(function (sec) {
      if (inHistory(sec)) return;
      var old = sec.querySelector(".f-empty");
      if (old) old.parentNode.removeChild(old);
      if (!t) return;
      if (sec.querySelectorAll(".grid > .card.f-hit").length === 0) {
        var grid = sec.querySelector(".grid");
        if (grid) {
          var n = d.createElement("p");
          n.className = "f-empty";
          n.textContent = "nothing on this line in this horizon";
          grid.appendChild(n);
        }
      }
    });
    var allItemIds = new Set();
    var matchingItemIds = new Set();
    itemElements.forEach(function (element) {
      var itemId = element.getAttribute("data-roadmap-item");
      var matches = !t || tlOf(element).indexOf(t) >= 0;
      allItemIds.add(itemId);
      if (matches) matchingItemIds.add(itemId);
      element.classList.toggle("roadmap-filtered-out", !matches);
    });
    var filterStatus = d.getElementById("roadmap-filter-status");
    if (filterStatus) filterStatus.textContent = "Showing " + matchingItemIds.size + " of " + allItemIds.size + " items";
    if (t && chip && chipCode) {
      chipCode.textContent = t.toUpperCase() + " · " + tlName(t);
      var ref = null;
      for (var j = 0; j < keyLinks.length; j++) if (keyLinks[j].classList.contains(t)) ref = keyLinks[j];
      if (ref) {
        var c = getComputedStyle(ref).getPropertyValue("--tc");
        if (c) chipCode.style.color = c.trim();
      }
    }
  }

  keyLinks.forEach(function (k) {
    k.setAttribute("role", "button");
    k.setAttribute("aria-pressed", "false");
    k.addEventListener("click", function (ev) {
      ev.preventDefault();
      var mine = tlOf(k)[0];
      if (mine) applyFilter(active === mine ? null : mine);
    });
    k.addEventListener("keydown", function (event) {
      if (event.key === " ") { event.preventDefault(); k.click(); }
    });
  });
  if (chip) chip.addEventListener("click", function () { applyFilter(null); });
  applyFilter(null);

  /* ---------------- collapsible sections ---------------- */
  var artifactRoot = d.querySelector("[data-roadmap-id]");
  var LS_KEY = (artifactRoot ? artifactRoot.getAttribute("data-roadmap-id") : location.pathname) + ":roadmap-collapsed-v2";
  function lsGet() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; } }
  function lsSet(v) { try { localStorage.setItem(LS_KEY, JSON.stringify(v)); } catch (e) {} }
  var collapsedState = lsGet();
  if (typeof collapsedState !== "object" || Array.isArray(collapsedState)) collapsedState = {};
  var COUNTS = [
    [".grid > .card", "card", "cards"],
    [".risk", "risk", "risks"],
    [".thread", "line", "lines"],
    [".oos-row", "row", "rows"],
    [".b-cell a.pill", "pill", "pills"]
  ];

  Array.prototype.slice.call(d.querySelectorAll("section.horizon, section.risks")).forEach(function (sec, i) {
    var head = sec.querySelector(".hz-head");
    if (!head) return;
    var h2 = head.querySelector("h2");
    var key = h2 ? (h2.id || h2.textContent.replace(/\s+/g, "-").toLowerCase()) : "sec" + i;
    var count = 0, word = "";
    for (var ci = 0; ci < COUNTS.length; ci++) {
      var n = sec.querySelectorAll(COUNTS[ci][0]).length;
      if (n > 0) { count = n; word = n === 1 ? COUNTS[ci][1] : COUNTS[ci][2]; break; }
    }
    var btn = d.createElement("button");
    btn.className = "hz-toggle";
    btn.type = "button";
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "Collapse or expand this section");
    btn.innerHTML = '<span class="chev" aria-hidden="true">▾</span>';
    if (count > 0) btn.appendChild(d.createTextNode(count + " " + word));
    head.appendChild(btn);

    function setCollapsed(on, skipSave) {
      sec.classList.toggle("hz-collapsed", on);
      btn.setAttribute("aria-expanded", on ? "false" : "true");
      if (!skipSave) { collapsedState[key] = on ? 1 : 0; lsSet(collapsedState); }
    }
    sec._setCollapsed = setCollapsed;
    if (collapsedState[key] === 1) setCollapsed(true, true);
    else if (collapsedState[key] === 0) setCollapsed(false, true);
    else setCollapsed(sec.classList.contains("hz-collapsed"), true);

    head.addEventListener("click", function (ev) {
      if (ev.target.closest && ev.target.closest("a")) return;
      setCollapsed(!sec.classList.contains("hz-collapsed"));
    });
  });

  /* an anchor jump must always land somewhere visible */
  function ensureVisible(id) {
    if (!id) return;
    var el = null;
    try { el = d.getElementById(id); } catch (e) {}
    if (!el) return;
    if (window.roadmapViews) window.roadmapViews.reveal(el);
    var section = el.closest ? el.closest("section") : null;
    while (section) {
      if (section.classList.contains("hz-collapsed") && section._setCollapsed) section._setCollapsed(false);
      section = section.parentElement ? section.parentElement.closest("section") : null;
    }
    if (active) {
      var card = el.closest ? el.closest(".card") : null;
      if (card && !card.classList.contains("f-hit")) applyFilter(null);
      var item = el.closest ? el.closest("[data-roadmap-item]") : null;
      if (item && item.classList.contains("roadmap-filtered-out")) applyFilter(null);
    }
  }
  d.addEventListener("click", function (ev) {
    if (ev.defaultPrevented) return;
    var a = ev.target.closest ? ev.target.closest('a[href^="#"]') : null;
    if (a) {
      try { ensureVisible(decodeURIComponent(a.getAttribute("href").slice(1))); }
      catch (error) {}
    }
  });
  function revealHash() {
    try { ensureVisible(decodeURIComponent(location.hash.slice(1))); }
    catch (error) {}
  }
  revealHash();
  addEventListener("hashchange", revealHash);
  d.body.classList.add("roadmap-interactive");

  /* ---------------- tooltips, derived from the detail cards ---------------- */
  if (window.matchMedia && matchMedia("(hover: hover)").matches) {
    var tip = d.createElement("div");
    tip.id = "tlTip";
    tip.setAttribute("role", "tooltip");
    d.body.appendChild(tip);
    var cache = {};

    var tipData = function (pill) {
      var href = pill.getAttribute("href") || "";
      if (href.charAt(0) !== "#") return null;
      var id = href.slice(1);
      if (Object.prototype.hasOwnProperty.call(cache, id)) return cache[id];
      var h = d.getElementById(id);
      var card = h && h.closest ? h.closest(".card") : null;
      var data = null;
      if (card) {
        var whyEl = card.querySelector(".why");
        var why = whyEl ? whyEl.textContent.replace(/\s+/g, " ").trim() : "";
        var m = why.match(/^.*?[.!?](?=\s|$)/);
        var first = m ? m[0] : why;
        if (first.length > 230) first = first.slice(0, 227).replace(/\s+\S*$/, "") + "…";
        var chipEl = card.querySelector(".chip");
        var tcodeEl = card.querySelector(".tcode");
        data = {
          title: (h.textContent || "").trim(),
          why: first,
          chip: chipEl ? chipEl.textContent.trim() : "",
          tcode: tcodeEl ? tcodeEl.textContent.trim() : ""
        };
      }
      cache[id] = data;
      return data;
    };

    var hideTip = function () { tip.style.display = "none"; };

    var showTip = function (pill) {
      var data = tipData(pill);
      if (!data) return;
      tip.innerHTML = "";
      var k = d.createElement("span"); k.className = "tt-kicker";
      if (data.tcode) {
        var b = d.createElement("b"); b.textContent = data.tcode;
        var c = getComputedStyle(pill).getPropertyValue("--tc");
        if (c) b.style.color = c.trim();
        k.appendChild(b);
        k.appendChild(d.createTextNode(" · "));
      }
      k.appendChild(d.createTextNode(data.chip || "detail card"));
      var t = d.createElement("span"); t.className = "tt-title"; t.textContent = data.title;
      var w = d.createElement("span"); w.className = "tt-why"; w.textContent = data.why;
      tip.appendChild(k); tip.appendChild(t); tip.appendChild(w);
      tip.style.left = "0px"; tip.style.top = "0px";
      tip.style.display = "block";
      var pr = pill.getBoundingClientRect();
      var tr = tip.getBoundingClientRect();
      var x = Math.min(Math.max(8, pr.left + pr.width / 2 - tr.width / 2), innerWidth - tr.width - 8);
      var y = pr.top - tr.height - 8;
      if (y < 8) y = pr.bottom + 8;
      tip.style.left = x + "px";
      tip.style.top = y + "px";
    };

    d.querySelectorAll("a.pill").forEach(function (p) {
      p.addEventListener("mouseenter", function () { showTip(p); });
      p.addEventListener("mouseleave", hideTip);
      p.addEventListener("focus", function () { showTip(p); });
      p.addEventListener("blur", hideTip);
    });
    addEventListener("scroll", hideTip, true);
    d.addEventListener("roadmap:viewchange", hideTip);
    d.addEventListener("keydown", function (event) { if (event.key === "Escape") hideTip(); });
  }
})();
```
