(() => {
  "use strict";
  function openGradeHash() {
    const row = document.getElementById(location.hash.slice(1));
    if (row?.matches("details.fg-row")) row.open = true;
  }
  window.addEventListener("hashchange", openGradeHash);
  openGradeHash();
  const root = document.querySelector("[data-learning-connections]");
  if (!root) return;
  const model = JSON.parse(
      root.querySelector("[data-learning-model]").textContent,
    ),
    topology = JSON.parse(
      root.querySelector("[data-learning-topology]").textContent,
    );
  const q = (s) => root.querySelector(s),
    all = (s) => [...root.querySelectorAll(s)],
    make = (tag, text, attrs = {}) => {
      const e = document.createElement(tag);
      if (text !== null) e.textContent = text;
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      return e;
    };
  const stateLabels = {
      observed: "Evidence witnessed",
      carried: "Earlier evidence",
      unknown: "Proof missing",
      attention: "Needs interpretation",
    },
    stages = ["Signal", "Transform", "Changed artifact", "Later use"];
  let view = "inside",
    dimension = "2d",
    selected =
      model.loops.find((l) => l.proof === "observed")?.id || model.loops[0]?.id,
    edge = topology.edges[0]?.id,
    activeStage = 0,
    angle = -0.18,
    tilt = 0.1,
    zoom = 1,
    frame = 0,
    playing = false,
    step = -1,
    progress = 0,
    gl = null,
    program = null,
    buffer = null,
    lost = false;
  const canvas = q("canvas"),
    stage = q(".fl-stage"),
    svg = q(".fl-lines"),
    labels = q(".fl-node-labels"),
    edgeLabels = q(".fl-edge-labels"),
    inspector = q("[data-flow-inspector]");
  if (!model.loops.length) {
    q(".fl-enhanced").hidden = true;
    return;
  }
  const loop = (id) => model.loops.find((l) => l.id === id),
    label = (id) => loop(id)?.name || id;
  function paragraph(parent, title, text) {
    parent.append(make("h4", title), make("p", text));
  }
  function source(parent, text, url) {
    parent.append(make("a", text, { href: url, class: "fl-source" }));
  }
  function stop() {
    cancelAnimationFrame(frame);
    playing = false;
    q("[data-flow-play]").textContent = "Play signal path";
    q("[data-flow-play]").setAttribute("aria-pressed", "false");
  }
  function announce(text) {
    q("[data-flow-caption]").textContent = text;
  }
  function currentLoop() {
    return loop(selected);
  }
  function workFor(kind, id) {
    const target = q("[data-flow-work]");
    if (!target) return;
    target.replaceChildren();
    const template = all("[data-work-template]").find(
      (t) => t.dataset.workTemplate === kind + ":" + id,
    );
    if (template) target.append(template.content.cloneNode(true));
  }
  function decision(title, gap, next, kind, id) {
    const d = q("[data-flow-decision]");
    if (!d) return;
    d.replaceChildren(make("div", null), make("div", null));
    d.children[0].append(make("strong", title), make("p", gap));
    d.children[1].append(make("span", "Next action"), make("p", next));
    workFor(kind, id);
    const first = q(
      "[data-flow-work] .hw-tickets li:not([data-work-status=completed]):not([data-work-status=canceled]) a",
    );
    if (first) {
      const a = first.cloneNode(true);
      a.className = "fl-primary-work";
      d.children[1].append(a);
    } else
      d.children[1].append(
        make("a", "See required work", { href: "#" + root.id + "-work" }),
      );
  }
  function showEdge(id) {
    edge = id;
    const e = topology.edges.find((x) => x.id === id);
    if (!e) {
      decision(
        "No recorded handoffs",
        "No cross-loop relationship is established by this snapshot.",
        "Choose a named loop to inspect its evidence and required work.",
        "edge",
        "",
      );
      inspector.replaceChildren(
        make("h3", "No recorded handoffs"),
        make(
          "p",
          "Choose a named loop to inspect its own stages. No cross-loop relationship is inferred from shared artifacts.",
        ),
      );
      return;
    }
    inspector.replaceChildren(
      make(
        "span",
        e.state === "observed"
          ? "Handoff witnessed"
          : "Declared handoff · execution unproved",
        { class: "fl-state" },
      ),
      make("h3", label(e.from) + " to " + label(e.to)),
      make("p", e.description),
    );
    paragraph(
      inspector,
      "What crosses this connection",
      e.label + " · channel " + e.channel,
    );
    paragraph(inspector, "Where proof stops", e.missing);
    paragraph(inspector, "Next proof", e.nextProof);
    decision(
      e.state === "observed"
        ? "Transfer witnessed"
        : "Transfer not yet witnessed",
      e.missing,
      e.nextProof,
      "edge",
      id,
    );
    paragraph(inspector, "Recorded sources", e.evidence.join("; "));
    if (e.witness)
      paragraph(
        inspector,
        "Transfer witness",
        e.witness.producer +
          " → " +
          e.witness.payload +
          " → " +
          e.witness.consumer +
          " · " +
          e.witness.observedOn +
          " · " +
          e.witness.scope,
      );
    const actions = make("div", null, { class: "fl-inspector-actions" });
    for (const id of [e.from, e.to])
      actions.append(
        make("button", "Open " + label(id), {
          type: "button",
          "data-flow-loop-open": id,
        }),
      );
    inspector.append(actions);
    source(inspector, "View the declared wiring", topology.sourceHref);
    inspector.prepend(inspector.querySelector("h3"));
    all("[data-flow-edge]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.flowEdge === edge)),
    );
  }
  function showStage(index) {
    activeStage = index;
    const l = currentLoop(),
      s = l.stages[index];
    inspector.replaceChildren(
      make("span", stateLabels[s.state], { class: "fl-state" }),
      make("h3", index + 1 + ". " + stages[index]),
      make("p", s.label),
    );
    decision(
      l.proof === "observed"
        ? "Evidence chain recorded"
        : l.proof === "carried"
          ? "Earlier closure evidence"
          : "Chain not yet proved",
      l.missing,
      l.action,
      "loop",
      l.id,
    );
    paragraph(inspector, "Recorded evidence", s.note);
    paragraph(inspector, "Loop context", l.summary);

    if (l.improvement) {
      const d = make("details"),
        o = make("ol");
      d.append(make("summary", "Acceptance from the earlier improvement plan"));
      l.improvement.acceptance.forEach((x) => o.append(make("li", x)));
      d.append(o);
      source(d, "Open the recorded plan", l.improvement.sourceHref);
      inspector.append(d);
    }
    source(inspector, "Open this loop’s evidence", l.sourceHref);
    inspector.prepend(inspector.querySelector("h3"));
    if (l.planTask && document.getElementById("learning-plan-" + l.planTask))
      source(
        inspector,
        "Earlier improvement plan · " + l.planTask,
        "#learning-plan-" + l.planTask,
      );
  }
  function showLoopInfo(id) {
    selected = id;
    const l = currentLoop();
    decision(
      l.proof === "observed"
        ? "Evidence chain recorded"
        : "Chain not yet proved",
      l.missing,
      l.action,
      "loop",
      l.id,
    );
    inspector.replaceChildren(
      make(
        "span",
        l.proof === "observed"
          ? "Closure witnessed"
          : l.proof === "carried"
            ? "Closure from earlier evidence"
            : "Closure not proved",
        { class: "fl-state" },
      ),
      make("h3", l.name),
      make("p", l.summary),
    );
    paragraph(inspector, "What is missing", l.missing);
    paragraph(inspector, "Next improvement", l.action);
    inspector.append(
      make("button", "Look inside this loop", {
        type: "button",
        "data-flow-loop-open": id,
      }),
    );
    source(inspector, "Recorded loop evidence", l.sourceHref);
    inspector.prepend(inspector.querySelector("h3"));
  }
  function sync() {
    all("[data-flow-view]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.flowView === view)),
    );
    all("[data-flow-dimension]").forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.flowDimension === dimension),
      ),
    );
    q("[data-flow-diagrams]").hidden = view === "eval";
    q("[data-flow-evaluations]").hidden = view !== "eval";
    q(".fl-display").hidden = view === "eval";
    q(".fl-loop-picker").hidden = view !== "inside";
    q(".fl-handoffs").hidden = view !== "system";
    q(".fl-return").hidden = view !== "inside";
    q(".fl-camera").hidden = dimension !== "3d";
    canvas.hidden = dimension !== "3d";
    stage.dataset.dimension = dimension;
    stage.dataset.flow = view;
    const workPanel = q(".fl-worklist");
    if (workPanel) workPanel.id = root.id + "-work";
    const l = currentLoop(),
      i = model.loops.findIndex((l) => l.id === selected);
    q("[data-flow-loop]").value = selected;
    q("[data-flow-position]").textContent =
      "Loop " + (i + 1) + " of " + model.loops.length;
    q("[data-flow-previous]").disabled = i === 0;
    q("[data-flow-next]").disabled = i === model.loops.length - 1;
    q("[data-flow-heading]").textContent =
      view === "inside" ? l.name : "How loops feed one another";
    q("[data-flow-subtitle]").textContent =
      view === "inside"
        ? l.proof !== "unproved"
          ? "Four-link closure recorded" +
            (l.proof === "carried" ? " from earlier evidence" : "") +
            ". Repeated benefit requires its own evidence."
          : "Select a stage to inspect the exact missing witness."
        : topology.edges.length +
          " recorded handoffs. Declared and witnessed transfers remain distinct.";
    q(".fl-return").replaceChildren(
      make(
        "strong",
        (topology.returns || []).find((r) => r.loopId === selected)?.state ===
          "not-applicable"
          ? "A control path, not a feedback cycle"
          : (topology.returns || []).find((r) => r.loopId === selected)
                ?.state === "observed"
            ? "Feedback return: witnessed"
            : "Feedback return: not established",
      ),
      make(
        "p",
        (topology.returns || []).find((r) => r.loopId === selected)?.state ===
          "not-applicable"
          ? (topology.returns || []).find((r) => r.loopId === selected)?.note ||
              "No feedback return is recorded."
          : (topology.returns || []).find((r) => r.loopId === selected)?.note ||
              "No repeated return is established by this four-stage record. A proposed check is to link the later outcome to the next input and compare the result.",
      ),
    );
    const feedback = (topology.returns || []).find(
      (r) => r.loopId === selected,
    );
    if (feedback) {
      source(q(".fl-return"), "Return evidence", feedback.sourceHref);
      if (feedback.witness)
        q(".fl-return").append(
          make(
            "p",
            feedback.witness.laterOutcome +
              " → " +
              feedback.witness.nextSignal +
              " · " +
              feedback.witness.observedOn +
              " · " +
              feedback.witness.scope,
          ),
        );
    }
    all("[data-flow-loop-open]").forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(view === "inside" && b.dataset.flowLoopOpen === selected),
      ),
    );
  }
  function switchView(next) {
    stop();
    view = next;
    sync();
    if (view === "system") showEdge(edge);
    if (view === "inside") showStage(0);
    announce("Illustrative path, not live activity.");
    draw();
  }
  function openLoop(id) {
    stop();
    selected = id;
    view = "inside";
    activeStage = 0;
    sync();
    showStage(0);
    draw();
    announce(label(id) + ". Select a stage for evidence.");
  }
  function color(name) {
    const p = make("i", null, { style: "color:var(" + name + ")" });
    root.append(p);
    const a = getComputedStyle(p)
      .color.match(/[\d.]+/g)
      .map(Number);
    p.remove();
    return [a[0] / 255, a[1] / 255, a[2] / 255, 1];
  }
  function initGL() {
    gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    if (!gl) throw Error("Unavailable");
    const shader = (type, source) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error("Shader");
      return s;
    };
    const v = shader(
        gl.VERTEX_SHADER,
        "attribute vec3 p;attribute vec4 c;attribute float size;varying vec4 col;void main(){gl_Position=vec4(p,1.0);gl_PointSize=size;col=c;}",
      ),
      f = shader(
        gl.FRAGMENT_SHADER,
        "precision mediump float;varying vec4 col;uniform float point;void main(){if(point>0.5){vec2 uv=(gl_PointCoord-vec2(0.5))*2.0;float d=dot(uv,uv);if(d>1.0)discard;vec3 normal=vec3(uv,sqrt(1.0-d));float light=.5+.5*max(0.0,dot(normal,normalize(vec3(-.4,-.5,1.0))));gl_FragColor=vec4(col.rgb*light,col.a);}else{gl_FragColor=col;}}",
      );
    program = gl.createProgram();
    gl.attachShader(program, v);
    gl.attachShader(program, f);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw Error("Program");
    buffer = gl.createBuffer();
    gl.deleteShader(v);
    gl.deleteShader(f);
  }
  function setDimension(next) {
    stop();
    dimension = next;
    if (next === "3d") {
      try {
        if (!gl) initGL();
        q("[data-flow-gl-status]").textContent =
          "Drag the space or use the camera controls. Depth helps exploration; distance is not a score.";
      } catch {
        dimension = "2d";
        q("[data-flow-gl-status]").textContent =
          "3D is unavailable here. The 2D map shows the same connections and evidence.";
      }
    } else q("[data-flow-gl-status]").textContent = "";
    sync();
    draw();
  }
  function graphData() {
    const w = stage.clientWidth,
      narrow = w < 420,
      l = currentLoop();
    let nodes, connections;
    if (view === "system") {
      const ids = [
        ...new Set(topology.edges.flatMap((e) => [e.from, e.to])),
      ].sort();
      nodes = ids.map((id, i) => {
        const a = (i / Math.max(ids.length, 1)) * Math.PI * 2 - Math.PI / 2,
          p = topology.layout?.[id] || {
            x: ids.length === 1 ? 0.5 : 0.23 + (i % 2) * 0.54,
            y:
              ids.length <= 2
                ? 0.45
                : 0.18 +
                  (Math.floor(i / 2) /
                    Math.max(1, Math.ceil(ids.length / 2) - 1)) *
                    0.6,
            z: (i % 2 ? 1 : -1) * 0.6,
          };
        return {
          id,
          ...p,
          ...(narrow
            ? ids.length === 2
              ? { x: 0.5, y: i === 0 ? 0.18 : 0.78 }
              : { x: p.x < 0.5 ? 0.23 : 0.77 }
            : {}),
          name: label(id),
          note: topology.nodeNotes?.[id] || "Select for evidence",
          proof: "unknown",
        };
      });
      connections = topology.edges.map((e) => ({
        ...e,
        proof: e.state === "observed" ? "observed" : "unknown",
      }));
    } else {
      nodes = l.stages.map((s, i) => ({
        id: s.id,
        name: i + 1 + ". " + stages[i],
        note: s.label.replace(/\//g, " / ").replace(/([a-z])([A-Z])/g, "$1 $2"),
        proof: s.state,
        x:
          dimension === "3d"
            ? [0.2, 0.8, 0.8, 0.2][i]
            : narrow
              ? 0.5
              : [0.105, 0.368, 0.632, 0.895][i],
        y:
          dimension === "3d"
            ? [0.19, 0.19, 0.78, 0.78][i]
            : narrow
              ? [0.12, 0.36, 0.6, 0.84][i]
              : 0.45,
        z: [-0.7, 0.7, -0.5, 0.5][i],
        stage: i,
      }));
      connections = l.stages.slice(0, 3).map((s, i) => ({
        id: "stage-" + i,
        from: s.id,
        to: l.stages[i + 1].id,
        label: ["Transform", "Save change", "Reuse"][i],
        proof:
          s.state === "observed" && l.stages[i + 1].state === "observed"
            ? "observed"
            : "unknown",
      }));
    }
    if (
      view === "system" &&
      dimension === "2d" &&
      narrow &&
      connections.length
    ) {
      const focused = connections.find((e) => e.id === edge) || connections[0];
      nodes = [focused.from, focused.to].map((id, i) => ({
        ...nodes.find((n) => n.id === id),
        x: 0.5,
        y: i ? 0.8 : 0.18,
      }));
      connections = [focused];
    }
    return { nodes, connections, narrow };
  }
  function project(n, w, h) {
    if (dimension === "2d") return { ...n, px: n.x * w, py: n.y * h, depth: 0 };
    const x = (n.x - 0.5) * 3,
      y = (0.5 - n.y) * 2.7,
      z = n.z,
      rx = x * Math.cos(angle) + z * Math.sin(angle),
      rz = -x * Math.sin(angle) + z * Math.cos(angle),
      ry = y * Math.cos(tilt) - rz * Math.sin(tilt),
      depth = y * Math.sin(tilt) + rz * Math.cos(tilt),
      p = 5 / (5 - depth);
    return {
      ...n,
      px: w / 2 + rx * w * 0.225 * p * zoom,
      py: h * 0.44 - ry * h * 0.22 * p * zoom,
      depth: depth / 10,
    };
  }
  function route(e, nodes, w, h) {
    const a = nodes.find((n) => n.id === e.from),
      b = nodes.find((n) => n.id === e.to);
    let sx = a.px,
      sy = a.py,
      ex = b.px,
      ey = b.py;
    const dx = ex - sx,
      dy = ey - sy;
    if (Math.abs(dx) > Math.abs(dy)) {
      const g =
        dimension === "3d"
          ? 20
          : view === "inside"
            ? w * 0.102
            : w < 420
              ? 51
              : 70;
      sx += Math.sign(dx) * g;
      ex -= Math.sign(dx) * g;
    } else {
      const g = dimension === "3d" ? 20 : view === "inside" ? 61 : 49;
      sy += Math.sign(dy) * g;
      ey -= Math.sign(dy) * g;
    }
    let cx = (sx + ex) / 2,
      cy = (sy + ey) / 2;
    if (
      view === "system" &&
      topology.edges.some((other) => other.from === e.to && other.to === e.from)
    ) {
      cx -= dy * 0.32;
      cy += dx * 0.32;
    } else if (view === "system" && Math.abs(dy) < 30) {
      cy += (sy > h * 0.5 ? 1 : -1) * h * 0.13;
    }
    if (view === "inside" && dimension === "3d" && e.id === "stage-0")
      cy -= h * 0.13;
    if (view === "inside" && dimension === "3d" && e.id === "stage-2")
      cy += h * 0.12;
    return {
      a,
      b,
      sx,
      sy,
      ex,
      ey,
      cx,
      cy,
      at: (t) => ({
        px: (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * ex,
        py: (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ey,
        depth: a.depth + (b.depth - a.depth) * t,
      }),
    };
  }
  const NS = "http://www.w3.org/2000/svg";
  function sv(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  }
  function draw() {
    if (view === "eval" || root.closest("[data-view]")?.hidden) return;
    stage.dataset.narrow = String(stage.clientWidth < 420);
    const w = stage.clientWidth,
      h = dimension === "3d" ? 320 : stage.clientHeight;
    if (!w || !h) return;
    if (view === "system")
      q("[data-flow-subtitle]").textContent =
        dimension === "2d" && w < 420 && topology.edges.length
          ? "Selected handoff · choose another connection from the list below."
          : topology.edges.length +
            " recorded handoffs. Declared and witnessed transfers remain distinct.";
    const data = graphData(),
      nodes = data.nodes.map((n) => project(n, w, h));
    const focus = document.activeElement,
      focusKey = labels.contains(focus)
        ? focus.dataset.flowNode
        : edgeLabels.contains(focus)
          ? focus.dataset.flowEdge
          : null;
    svg.replaceChildren();
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    const defs = sv("defs", {}),
      marker = sv("marker", {
        id: "flow-arrow",
        viewBox: "0 0 10 10",
        refX: 8,
        refY: 5,
        markerWidth: 7,
        markerHeight: 7,
        orient: "auto-start-reverse",
      });
    marker.append(
      sv("path", {
        d: "M1 1 L9 5 L1 9",
        fill: "none",
        stroke: "var(--rm-muted)",
        "stroke-width": 1.5,
      }),
    );
    defs.append(marker);
    svg.append(defs);
    labels.replaceChildren();
    edgeLabels.replaceChildren();
    const routes = [];
    for (const e of data.connections) {
      const r = route(e, nodes, w, h);
      routes.push({ ...r, e });
      const active =
        view === "system"
          ? edge === e.id
          : activeStage === Number(e.id.slice(-1));
      svg.append(
        sv("path", {
          d: `M${r.sx} ${r.sy} Q${r.cx} ${r.cy} ${r.ex} ${r.ey}`,
          fill: "none",
          stroke: active ? "var(--rm-link)" : "var(--rm-muted)",
          "stroke-width": active ? 2.2 : 1.5,
          "stroke-dasharray": e.proof === "observed" ? "none" : "5 5",
          "marker-end": "url(#flow-arrow)",
          opacity: dimension === "3d" ? 0.45 : 1,
        }),
      );
      if (view === "system") {
        const p = r.at(0.5),
          b = make(
            "button",
            e.label + (e.state === "observed" ? " · witnessed" : " · unproved"),
            {
              type: "button",
              "data-flow-edge": e.id,
              "aria-pressed": String(edge === e.id),
            },
          );
        b.style.left = p.px + "px";
        if (
          data.narrow &&
          dimension === "2d" &&
          topology.edges.some(
            (other) => other.from === e.to && other.to === e.from,
          )
        ) {
          const offset = data.connections.indexOf(e) % 2 ? -0.13 : 0.13;
          p.py += h * offset;
        }
        b.style.left = p.px + "px";
        b.style.top = p.py - 8 + "px";
        edgeLabels.append(b);
      }
    }
    for (const n of nodes) {
      const b = make("button", null, {
        type: "button",
        "data-flow-node": n.id,
        "data-proof": n.proof,
        "aria-pressed": String(
          view === "inside" ? n.stage === activeStage : n.id === selected,
        ),
        "aria-label": n.name + ". " + n.note,
      });
      b.append(
        make(
          "span",
          (dimension === "3d" && view === "system"
            ? nodes.indexOf(n) + 1 + ". "
            : "") + n.name,
        ),
        make("small", n.note),
      );
      b.style.left = n.px + "px";
      b.style.top = n.py + "px";
      if (view === "inside")
        b.append(
          make("strong", stateLabels[n.proof], { class: "fl-node-proof" }),
        );
      labels.append(b);
      if (dimension === "3d") {
        const ntext = sv("text", {
          x: n.px,
          y: n.py + 5,
          "text-anchor": "middle",
          fill: "var(--rm-panel)",
          "font-size": 14,
          "font-weight": 600,
        });
        ntext.textContent = String(nodes.indexOf(n) + 1);
        svg.append(ntext);
        if (view === "inside") {
          const title = sv("text", {
            x: n.px,
            y: n.py - 28,
            "text-anchor": "middle",
            fill: "var(--rm-ink)",
            "font-size": 13,
            "font-weight": 600,
          });
          title.textContent = stages[n.stage];
          svg.append(title);
        }
      }
    }
    if (dimension === "3d" && gl && !lost) {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(...color("--rm-panel"));
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      const c = color("--rm-link"),
        base = color("--rm-muted"),
        proof = color("--rm-success"),
        vertex = (p, col, size = 1) => [
          (p.px / w) * 2 - 1,
          1 - (p.py / h) * 2,
          p.depth,
          ...col,
          size * dpr,
        ];
      const render = (array, kind, points) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(array),
          gl.DYNAMIC_DRAW,
        );
        for (const [name, count, offset] of [
          ["p", 3, 0],
          ["c", 4, 3],
          ["size", 1, 7],
        ]) {
          const loc = gl.getAttribLocation(program, name);
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, count, gl.FLOAT, false, 32, offset * 4);
        }
        gl.uniform1f(gl.getUniformLocation(program, "point"), points ? 1 : 0);
        gl.drawArrays(kind, 0, array.length / 8);
      };
      const lines = [];
      for (const r of routes)
        for (let i = 0; i < 24; i++) {
          if (r.e.proof !== "observed" && i % 3 === 2) continue;
          lines.push(
            ...vertex(r.at(i / 24), base),
            ...vertex(r.at((i + 1) / 24), base),
          );
        }
      render(lines, gl.LINES, false);
      render(
        [...nodes]
          .sort((a, b) => b.depth - a.depth)
          .flatMap((n) => vertex(n, n.proof === "observed" ? proof : c, 38)),
        gl.POINTS,
        true,
      );
      if (playing && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const r = routes.find(
          (r) =>
            r.e.id ===
            (view === "system"
              ? topology.edges.map((e) => e.id)[step]
              : ["stage-0", "stage-1", "stage-2"][step]),
        );
        if (r) render(vertex(r.at(progress), c, 12), gl.POINTS, true);
      }
    } else if (
      playing &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const r = routes.find(
        (r) =>
          r.e.id ===
          (view === "system"
            ? topology.edges.map((e) => e.id)[step]
            : ["stage-0", "stage-1", "stage-2"][step]),
      );
      if (r) {
        const p = r.at(progress);
        svg.append(
          sv("circle", { cx: p.px, cy: p.py, r: 5, fill: "var(--rm-link)" }),
        );
      }
    }
    if (focusKey && (!playing || document.activeElement !== document.body)) {
      const target = [...labels.children, ...edgeLabels.children].find(
        (b) => (b.dataset.flowNode || b.dataset.flowEdge) === focusKey,
      );
      target?.focus({ preventScroll: true });
    }
  }
  function play() {
    if (view === "system" && !topology.edges.length) {
      announce("No handoffs recorded. Choose a loop to inspect its stages.");
      return;
    }
    if (playing) {
      stop();
      draw();
      return;
    }
    playing = true;
    step = -1;
    q("[data-flow-play]").textContent = "Pause signal path";
    q("[data-flow-play]").setAttribute("aria-pressed", "true");
    const start = performance.now(),
      order =
        view === "system"
          ? topology.edges.map((e) => e.id)
          : ["stage-0", "stage-1", "stage-2"];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = (now) => {
      if (!playing) return;
      const t = (now - start) / 2400,
        index = Math.min(order.length - 1, Math.floor(t));
      progress = Math.min(1, t - index);
      if (index !== step) {
        step = index;
        if (view === "system") {
          showEdge(order[index]);
          announce(
            "Illustration: " +
              topology.edges.find((e) => e.id === order[index]).description +
              " " +
              (topology.edges.find((e) => e.id === order[index]).state ===
              "observed"
                ? "Witnessed in the recorded scope."
                : "Transfer remains unproved."),
          );
        } else {
          showStage(Math.min(3, index + 1));
          announce(
            "Illustration: " +
              stages[index] +
              " to " +
              stages[index + 1] +
              ". " +
              stateLabels[currentLoop().stages[index + 1].state] +
              ".",
          );
        }
      }
      if (!reduced && dimension === "3d")
        angle = -0.18 + Math.sin(t * 0.65) * 0.16;
      draw();
      if (t < order.length) frame = requestAnimationFrame(tick);
      else {
        stop();
        announce(
          "Walkthrough complete. Motion illustrates declared paths, not live activity.",
        );
        draw();
      }
    };
    frame = requestAnimationFrame(tick);
  }
  function camera(action) {
    stop();
    if (action === "left") angle -= 0.12;
    if (action === "right") angle += 0.12;
    if (action === "up") tilt -= 0.08;
    if (action === "down") tilt += 0.08;
    if (action === "in") zoom = Math.min(1.25, zoom + 0.08);
    if (action === "out") zoom = Math.max(0.7, zoom - 0.08);
    if (action === "reset") {
      angle = -0.18;
      tilt = 0.1;
      zoom = 1;
    }
    angle = Math.max(-0.7, Math.min(0.7, angle));
    tilt = Math.max(-0.4, Math.min(0.4, tilt));
    draw();
  }
  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.hasAttribute("data-flow-read-evidence")) {
      stop();
      q(".fl-inspector").focus();
      q(".fl-inspector").scrollIntoView({ block: "start" });
    } else if (b.hasAttribute("data-flow-return")) {
      const target = q("[data-flow-read-evidence]");
      target.focus();
      stage.scrollIntoView({ block: "center" });
    } else if (b.dataset.flowView) switchView(b.dataset.flowView);
    else if (b.dataset.flowDimension) setDimension(b.dataset.flowDimension);
    else if (b.dataset.flowLoopOpen) {
      openLoop(b.dataset.flowLoopOpen);
      q(".fl-loop-picker").scrollIntoView({ block: "nearest" });
    } else if (b.dataset.flowEdge) {
      stop();
      showEdge(b.dataset.flowEdge);
      draw();
    } else if (b.dataset.flowNode) {
      stop();
      if (view === "inside")
        showStage(
          currentLoop().stages.findIndex((s) => s.id === b.dataset.flowNode),
        );
      else showLoopInfo(b.dataset.flowNode);
      draw();
    } else if (b.hasAttribute("data-flow-play")) play();
    else if (b.dataset.flowCamera) camera(b.dataset.flowCamera);
    else if (
      b.hasAttribute("data-flow-previous") ||
      b.hasAttribute("data-flow-next")
    ) {
      const i = model.loops.findIndex((l) => l.id === selected),
        next = i + (b.hasAttribute("data-flow-next") ? 1 : -1);
      if (model.loops[next]) openLoop(model.loops[next].id);
    }
  });
  q("[data-flow-loop]").addEventListener("change", (e) =>
    openLoop(e.target.value),
  );
  canvas.addEventListener("keydown", (e) => {
    const keys = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
      "+": "in",
      "=": "in",
      "-": "out",
      Home: "reset",
    };
    if (keys[e.key]) {
      e.preventDefault();
      camera(keys[e.key]);
    }
  });
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    stop();
    drag = [e.clientX, e.clientY];
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    angle = Math.max(
      -0.7,
      Math.min(0.7, angle + (e.clientX - drag[0]) * 0.003),
    );
    tilt = Math.max(-0.4, Math.min(0.4, tilt + (e.clientY - drag[1]) * 0.002));
    drag = [e.clientX, e.clientY];
    draw();
  });
  for (const name of ["pointerup", "pointercancel"])
    canvas.addEventListener(name, () => (drag = null));
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
    stop();
    setDimension("2d");
    q("[data-flow-gl-status]").textContent =
      "3D graphics were interrupted. The same map and evidence remain available in 2D.";
  });
  canvas.addEventListener("webglcontextrestored", () => {
    lost = false;
    gl = null;
  });
  new ResizeObserver(() => draw()).observe(stage);
  new MutationObserver(() => draw()).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) stop();
  }).observe(stage);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  document.addEventListener("roadmap:viewchange", () => {
    stop();
    requestAnimationFrame(draw);
  });
  function deepLink() {
    const prefix = "#" + root.id + "-record-";
    if (location.hash.startsWith(prefix)) {
      const id = location.hash.slice(prefix.length);
      if (loop(id)) {
        openLoop(id);
        q(".fl-loop-picker").scrollIntoView({ block: "start" });
      }
    }
  }
  window.addEventListener("hashchange", deepLink);
  if (!model.loops.length) {
    q(".fl-enhanced").hidden = true;
    return;
  }
  q(".fl-enhanced").hidden = false;
  sync();
  if (view === "system") showEdge(edge);
  else showStage(0);
  draw();
  deepLink();
})();
