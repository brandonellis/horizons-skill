(function () {
  "use strict";
  function selectRoadmapItems(records, query, throughline) {
    var itemsById = new Map();
    records.forEach(function (record) {
      var item = itemsById.get(record.id) || { text: [], throughlines: new Set() };
      item.text.push(record.text || "");
      (record.throughlines || []).filter(Boolean).forEach(function (value) { item.throughlines.add(value); });
      itemsById.set(record.id, item);
    });
    var normalized = query.trim().toLocaleLowerCase();
    var matches = [];
    var counts = Object.create(null);
    counts[""] = 0;
    itemsById.forEach(function (item, id) {
      item.throughlines.forEach(function (value) { if (!(value in counts)) counts[value] = 0; });
      if (normalized && !item.text.join(" ").toLocaleLowerCase().includes(normalized)) return;
      counts[""] += 1;
      item.throughlines.forEach(function (value) { counts[value] += 1; });
      if (!throughline || item.throughlines.has(throughline)) matches.push(id);
    });
    return { total: itemsById.size, matchingIds: matches, counts: counts };
  }
  if (typeof module === "object" && module.exports) {
    module.exports = { selectRoadmapItems: selectRoadmapItems };
    return;
  }
  var shell = document.querySelector(".roadmap-shell");
  if (!shell) return;
  var choices = [];

  function choose(controlSelector, panelSelector, attribute) {
    var control = shell.querySelector(controlSelector);
    var panels = Array.from(shell.querySelectorAll(panelSelector));
    if (!control || !panels.length) return;
    function select(value) {
      var selected = panels.find(function (panel) { return panel.getAttribute(attribute) === value; });
      if (!selected) return;
      control.value = value;
      panels.forEach(function (panel) { panel.hidden = panel !== selected; });
      return selected;
    }
    select(control.value);
    control.addEventListener("change", function () {
      var panel = select(control.value);
      if (!panel) return;
      try { history.pushState(null, "", "#" + panel.id); }
      catch (error) { location.hash = panel.id; }
    });
    choices.push({ panels: panels, attribute: attribute, select: select });
  }

  choose("[data-scope-select]", "[data-assessment-scope]", "data-assessment-scope");
  choose("[data-roadmap-format-select]", "[data-roadmap-format]", "data-roadmap-format");

  var roadmap = shell.querySelector('[data-view="roadmap"]') || shell;
  var search = roadmap.querySelector("[data-roadmap-search]");
  var themes = Array.from(roadmap.querySelectorAll("[data-roadmap-theme]"));
  var throughline = themes.length ? themes[0].value : "";
  var clear = Array.from(roadmap.querySelectorAll("[data-roadmap-clear]"));
  var items = Array.from(roadmap.querySelectorAll("[data-roadmap-item]")).filter(function (item) {
    var view = item.closest('[data-view]');
    return !view || view.getAttribute('data-view') === 'roadmap';
  });
  var records = items.map(function (item) {
    return { id: item.getAttribute("data-roadmap-item"), text: item.getAttribute("data-search-text"), throughlines: (item.getAttribute("data-throughlines") || "").split(/\s+/) };
  });

  function applyFilter() {
    var query = search ? search.value : "";
    var selection = selectRoadmapItems(records, query, throughline);
    var matches = new Set(selection.matchingIds);
    items.forEach(function (item) {
      item.hidden = !matches.has(item.getAttribute("data-roadmap-item"));
    });
    roadmap.querySelectorAll('[data-roadmap-track], [data-roadmap-lane], [data-roadmap-mobile-group]').forEach(function (group) {
      var members = Array.from(group.querySelectorAll('[data-roadmap-item]'));
      var visible = members.filter(function (item) { return !item.hidden; });
      group.hidden = visible.length === 0;
      var count = group.querySelector('[data-roadmap-lane-count]');
      if (count) count.textContent = (visible.length === members.length ? visible.length : visible.length + ' of ' + members.length) + ' initiatives';
    });
    shell.setAttribute("data-active-throughline", throughline);
    themes.forEach(function (control) { control.value = throughline; });
    roadmap.querySelectorAll("[data-roadmap-theme-choice]").forEach(function (control) {
      var value = control.getAttribute("data-roadmap-theme-choice");
      var count = selection.counts[value] || 0;
      control.setAttribute("aria-pressed", String(value === throughline));
      control.setAttribute("aria-label", control.getAttribute("data-theme-label") + ": " + count + " matching roadmap items");
      var badge = control.querySelector("[data-theme-choice-count]");
      if (badge) badge.textContent = count;
    });
    roadmap.querySelectorAll("[data-roadmap-count]").forEach(function (element) {
      element.textContent = "Showing " + matches.size + " of " + selection.total + " roadmap items";
    });
    roadmap.querySelectorAll("[data-roadmap-list]").forEach(function (list) {
      var empty = list.querySelector("[data-filter-empty]");
      if (empty) empty.hidden = !!list.querySelector("[data-roadmap-item]:not([hidden])");
    });
    clear.forEach(function (control) { control.disabled = !query.trim() && !throughline; });
  }

  function clearFilter() {
    if (search) search.value = "";
    throughline = "";
    applyFilter();
  }
  if (search) search.addEventListener("input", applyFilter);
  themes.forEach(function (control) {
    control.addEventListener("change", function () { throughline = control.value; applyFilter(); });
  });
  clear.forEach(function (control) { control.addEventListener("click", clearFilter); });
  shell.addEventListener("click", function (event) {
    var control = event.target.closest("[data-roadmap-theme-choice]");
    if (!control || !roadmap.contains(control)) return;
    var value = control.getAttribute("data-roadmap-theme-choice");
    throughline = throughline === value ? "" : value;
    applyFilter();
  });
  applyFilter();

  var findingRegisters = Array.from(shell.querySelectorAll("[data-finding-register]"));
  function selectFindingFilter(register, value) {
    if (!["all", "remaining", "fixed", "partial", "open", "unknown", "retracted"].includes(value)) return;
    var findingRows = Array.from(register.querySelectorAll("[data-finding-id]"));
    var shown = 0;
    findingRows.forEach(function (row) {
      var status = row.getAttribute("data-finding-status");
      // "Remaining" is work still owed. A retracted finding was never true, so it
      // is neither remaining nor fixed; it appears under its own filter and "all".
      var matches = value === "all" || (value === "remaining" ? status !== "fixed" && status !== "retracted" : status === value);
      row.hidden = !matches;
      if (matches) shown += 1;
    });
    register.setAttribute("data-active-finding-filter", value);
    register.querySelectorAll("[data-finding-filter]").forEach(function (control) {
      control.setAttribute("aria-pressed", String(control.getAttribute("data-finding-filter") === value));
    });
    register.querySelectorAll("[data-finding-count]").forEach(function (count) {
      count.textContent = "Showing " + shown + " of " + findingRows.length + " original findings";
    });
  }
  findingRegisters.forEach(function (register) { selectFindingFilter(register, register.getAttribute("data-finding-default-filter") || "all"); });
  shell.addEventListener("click", function (event) {
    var control = event.target.closest("[data-finding-filter]");
    if (control) selectFindingFilter(control.closest("[data-finding-register]"), control.getAttribute("data-finding-filter"));
    var shortcut = event.target.closest("[data-finding-filter-target]");
    if (!shortcut || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var register = document.getElementById(shortcut.getAttribute("href").slice(1));
    if (register && register.hasAttribute("data-finding-register")) selectFindingFilter(register, shortcut.getAttribute("data-finding-filter-target"));
  });

  function reveal(target) {
    if (!target) return;
    if (window.roadmapViews) window.roadmapViews.reveal(target);
    choices.forEach(function (choice) {
      var panel = choice.panels.find(function (candidate) { return candidate === target || candidate.contains(target); });
      if (panel) choice.select(panel.getAttribute(choice.attribute));
    });
    var item = target.closest("[data-roadmap-item]");
    if (item && item.hidden) clearFilter();
    var finding = target.closest("[data-finding-id]");
    if (finding && finding.hidden) selectFindingFilter(finding.closest("[data-finding-register]"), "all");
    var detail = target.closest("details");
    while (detail) {
      detail.open = true;
      detail = detail.parentElement ? detail.parentElement.closest("details") : null;
    }
  }

  function hashTarget() {
    try { return document.getElementById(decodeURIComponent(location.hash.slice(1))); }
    catch (error) { return null; }
  }
  var origins = new Map();
  var originSequence = 0;
  var navigationSequence = 0;
  function navigationState() {
    return history.state && history.state.roadmapNavigation;
  }
  function updateReturnLinks(state) {
    var origin = state && origins.get(state.key);
    roadmap.querySelectorAll('[data-roadmap-return]').forEach(function (anchor) {
      anchor.textContent = origin ? origin.label : 'Back to roadmap';
      anchor.setAttribute('href', origin ? origin.fallbackHref : '#roadmap-nnl');
    });
  }
  function focusTarget(target) {
    var focus = target.matches('details') ? target.querySelector('summary') : target;
    if (!focus.hasAttribute('tabindex') && !focus.matches('a, button, input, select, summary')) focus.tabIndex = -1;
    focus.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start' });
  }
  function captureOrigin(anchor, target) {
    var view = anchor.closest('[data-view]');
    var labelled = anchor.closest('[data-roadmap-origin-label]');
    var format = anchor.closest('[data-roadmap-format]');
    var label = labelled ? labelled.getAttribute('data-roadmap-origin-label') : format ? format.getAttribute('data-roadmap-format') === 'timeline' ? 'Gantt' : 'Now / Next / Later' : '';
    var tab = view && document.getElementById(view.getAttribute('aria-labelledby'));
    var ancestors = [];
    var detail = target.closest('details');
    while (detail) {
      ancestors.push({ element: detail, open: detail.open });
      detail = detail.parentElement && detail.parentElement.closest('details');
    }
    return {
      url: location.href, anchor: anchor, view: view || roadmap,
      fallbackHref: '#' + (format ? format.id : (view || roadmap).id),
      label: 'Back to ' + (label || (tab && tab.textContent.trim()) || 'roadmap'),
      query: search ? search.value : '', throughline: throughline,
      left: window.scrollX, top: window.scrollY, details: ancestors,
      choices: choices.map(function (choice) {
        var selected = choice.panels.find(function (panel) { return !panel.hidden; });
        return { choice: choice, value: selected && selected.getAttribute(choice.attribute) };
      }),
      scrolls: Array.from(roadmap.querySelectorAll('[data-roadmap-scroll], .rm-gantt-region, .rm-matrix-scroll, .fig-scroll')).map(function (region) {
        return { element: region, left: region.scrollLeft, top: region.scrollTop };
      })
    };
  }
  function restoreOrigin(origin) {
    if (window.roadmapViews) window.roadmapViews.reveal(origin.view);
    origin.choices.forEach(function (entry) { entry.choice.select(entry.value); });
    if (search) search.value = origin.query;
    throughline = origin.throughline;
    applyFilter();
    origin.details.forEach(function (entry) { entry.element.open = entry.open; });
    origin.anchor.focus({ preventScroll: true });
    origin.scrolls.forEach(function (entry) { entry.element.scrollTo(entry.left, entry.top); });
    window.scrollTo(origin.left, origin.top);
  }
  function followLocation() {
    var sequence = ++navigationSequence;
    var requestedUrl = location.href;
    var state = navigationState();
    var origin = state && state.kind === 'origin' && origins.get(state.key);
    if (origin && origin.url !== location.href) origin = null;
    var target = hashTarget();
    updateReturnLinks(state && state.kind === 'detail' ? state : null);
    if (origin) restoreOrigin(origin);
    else reveal(target);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (sequence !== navigationSequence || requestedUrl !== location.href) return;
        if (origin) restoreOrigin(origin);
        else if (target) focusTarget(target);
      });
    });
  }
  if (hashTarget()) followLocation();
  shell.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var returnLink = event.target.closest('[data-roadmap-return]');
    var state = navigationState();
    if (returnLink && state && state.kind === 'detail' && origins.has(state.key)) {
      event.preventDefault();
      history.go(-state.depth);
      return;
    }
    var anchor = event.target.closest('a[href^="#"]');
    if (!anchor || anchor.hasAttribute('download') || (anchor.getAttribute('target') && anchor.getAttribute('target') !== '_self')) return;
    var target;
    try { target = document.getElementById(decodeURIComponent(anchor.getAttribute('href').slice(1))); }
    catch (error) { return; }
    if (!target) return;
    if (target.hasAttribute('data-roadmap-detail')) {
      var continued = state && state.kind === 'detail' && origins.has(state.key) && anchor.closest('[data-roadmap-detail]');
      var key = continued ? state.key : ++originSequence;
      if (!continued) origins.set(key, captureOrigin(anchor, target));
      try {
        if (!continued) history.replaceState(Object.assign({}, history.state, { roadmapNavigation: { kind: 'origin', key: key } }), '', location.href);
        history.pushState({ roadmapNavigation: { kind: 'detail', key: key, depth: continued ? state.depth + 1 : 1 } }, '', anchor.getAttribute('href'));
        event.preventDefault();
        followLocation();
      } catch (error) { reveal(target); }
    } else {
      reveal(target);
      if (returnLink || location.hash === anchor.getAttribute('href')) requestAnimationFrame(function () { focusTarget(target); });
    }
  });
  window.addEventListener('popstate', followLocation);
  window.addEventListener('hashchange', followLocation);

  var themeButton = shell.querySelector("[data-theme-toggle]");
  function setTheme(dark) {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    if (themeButton) {
      themeButton.textContent = dark ? "Light theme" : "Dark theme";
      themeButton.setAttribute("aria-pressed", String(dark));
    }
    shell.querySelectorAll(".rm-archive-frame").forEach(function (frame) {
      try { if (frame.contentDocument) frame.contentDocument.documentElement.dataset.theme = dark ? "dark" : "light"; }
      catch (error) {}
    });
  }
  if (themeButton) themeButton.addEventListener("click", function () { setTheme(document.documentElement.dataset.theme !== "dark"); });
  setTheme(document.documentElement.dataset.theme === "dark");

  function resizeFrame(frame) {
    try {
      var record = frame.closest("details");
      if (!record || !record.open || !frame.contentDocument || !frame.contentDocument.body) return;
      frame.style.height = "1px";
      frame.style.height = Math.max(600, frame.contentDocument.documentElement.scrollHeight, frame.contentDocument.body.scrollHeight) + 24 + "px";
    } catch (error) {}
  }
  shell.querySelectorAll(".rm-archive-frame").forEach(function (frame) {
    frame.addEventListener("load", function () {
      setTheme(document.documentElement.dataset.theme === "dark");
      try { if (frame.contentDocument) frame.contentDocument.fonts.ready.then(function () { resizeFrame(frame); }); }
      catch (error) {}
      resizeFrame(frame);
    });
    var record = frame.closest("details");
    if (record) record.addEventListener("toggle", function () { resizeFrame(frame); });
  });
  window.addEventListener("resize", function () { shell.querySelectorAll(".rm-archive-frame").forEach(resizeFrame); });

  var openBeforePrint = null;
  window.addEventListener("beforeprint", function () {
    if (openBeforePrint !== null) return;
    openBeforePrint = Array.from(shell.querySelectorAll("details[open]"));
    shell.querySelectorAll("details").forEach(function (detail) { detail.open = true; });
    shell.querySelectorAll(".rm-archive-frame").forEach(function (frame) {
      var record = frame.closest("details");
      if (!record || record.querySelector(".rm-print-archive")) return;
      try {
        if (!frame.contentDocument || !frame.contentDocument.body) return;
        var printable = document.createElement("div");
        printable.className = "rm-print-archive";
        printable.setAttribute("data-generated-print", "");
        printable.textContent = frame.contentDocument.body.innerText;
        record.appendChild(printable);
      } catch (error) {}
    });
  });
  window.addEventListener("afterprint", function () {
    if (openBeforePrint === null) return;
    shell.querySelectorAll("[data-generated-print]").forEach(function (element) { element.remove(); });
    shell.querySelectorAll("details").forEach(function (detail) { detail.open = openBeforePrint.includes(detail); });
    openBeforePrint = null;
  });
  shell.querySelectorAll("[data-enhance-control]").forEach(function (control) { control.hidden = false; });
  shell.querySelectorAll("[data-theme-filter-fallback]").forEach(function (fallback) { fallback.hidden = true; });
  shell.querySelectorAll(".rm-plain-navigation").forEach(function (navigation) { navigation.hidden = true; });
})();
