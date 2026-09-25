/** Presentation only. Recorded closure, grades and source observations are never inferred here. */
export const LEARNING_STAGES = ['signal', 'transform', 'artifact', 'consumption'];
const STATES = ['observed', 'carried', 'unknown', 'attention'];
const safeId = /^[a-z][a-z0-9_-]*$/;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function href(value) {
 if (typeof value !== 'string' || !value || /[\s<>"'\\]/.test(value) || /^(?:\/\/|\/)|(?:^|\/)\.\.(?:\/|$)/.test(value) || (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^https:\/\//i.test(value))) throw new Error('Evidence links must be HTTPS, a fragment or a safe relative path');
 return value;
}
function text(value, name) { if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} must be recorded`); }
function array(value, name) { if (!Array.isArray(value)) throw new Error(`${name} must be an array`); }
export function validateLearningSystem(model) {
 if (model?.schemaVersion !== 1) throw new Error('Unsupported learning-system schema');
 for (const field of ['assessmentId','observedOn','scope','production']) text(model[field],field);
 if (!/^\d{4}-\d{2}-\d{2}$/.test(model.observedOn) || !Number.isFinite(Date.parse(model.observedOn)) || new Date(model.observedOn).toISOString().slice(0,10)!==model.observedOn) throw new Error('Observation date required');
 if(model.previousAssessment){text(model.previousAssessment.grade,'Previous grade');text(model.previousAssessment.observedOn,'Previous observation date');href(model.previousAssessment.sourceHref);}
 href(model.sourceHref); array(model.loops,'Loops'); array(model.metrics,'Metrics'); array(model.runs,'Runs');
 const ids = new Set();
 for (const loop of model.loops) {
  if (!safeId.test(loop.id) || ids.has(loop.id)) throw new Error('Loop identities must be unique'); ids.add(loop.id);
  for (const field of ['name','summary','action','decision','missing','sourceLocator']) text(loop[field],field);
  if(loop.improvement){href(loop.improvement.sourceHref);array(loop.improvement.acceptance,'Improvement acceptance');loop.improvement.acceptance.forEach(x=>text(x,'Acceptance requirement'));}
  href(loop.sourceHref); array(loop.evidence,'Loop evidence'); if (!loop.evidence.length || loop.evidence.some(x=>typeof x!=='string'||!x.trim())) throw new Error('Loop evidence is required');
  if (!['closed','not proved'].includes(loop.recordedVerdict) || !['observed','carried','unproved'].includes(loop.proof)) throw new Error('Separate recorded verdict and evidence freshness');
  if (!Array.isArray(loop.stages) || loop.stages.length!==4 || loop.stages.some((s,i)=>s.id!==LEARNING_STAGES[i]||!STATES.includes(s.state))) throw new Error('Four ordered stages and explicit evidence states are required');
  loop.stages.forEach(s=>{text(s.label,'Stage label');text(s.note,'Stage evidence note');});
  if (loop.proof==='observed' && (loop.recordedVerdict!=='closed'||loop.stages.some(s=>s.state!=='observed'))) throw new Error('Re-witnessed closure requires recorded closure and four observed stages');
  if (loop.proof==='carried' && (loop.recordedVerdict!=='closed'||!loop.stages.some(s=>s.state==='carried'))) throw new Error('Carried closure requires an explicitly carried stage');
  if (loop.proof==='unproved' && loop.recordedVerdict==='closed') throw new Error('Closed records need observed or carried proof');
 }
 if (model.declaredCount!==model.loops.length || model.closedCount!==model.loops.filter(l=>l.recordedVerdict==='closed').length) throw new Error('Closure denominator must match the complete declared inventory');
 const metricIds = new Set();
 for (const metric of model.metrics) {
  if (!safeId.test(metric.id)||metricIds.has(metric.id)) throw new Error('Metric identities must be unique'); metricIds.add(metric.id);
  for (const field of ['name','value','status','detail','nextProof']) text(metric[field],field);
  array(metric.evidence,'Metric evidence'); if(!metric.evidence.length||metric.evidence.some(e=>typeof e!=='string'||!e.trim()))throw new Error('Metric evidence required');
 }
 for(const run of model.runs)for(const field of ['id','model','time','verdict','reason','detail','accounting'])text(run[field],field);
 if(model.agents){array(model.agents,'Agent inventory');const agentIds=new Set();for(const a of model.agents){for(const field of ['id','name','category','coverage','sourceHref'])text(a[field],field);if(agentIds.has(a.id))throw new Error('Agent identities must be unique');agentIds.add(a.id);href(a.sourceHref);if(!['covered','uncovered','unknown'].includes(a.coverage))throw new Error('Explicit agent coverage required');}}
 return model;
}
export function learningSummary(model) {
 validateLearningSystem(model);
 return {declared:model.declaredCount,closed:model.closedCount,rewitnessed:model.loops.filter(l=>l.proof==='observed').length,carried:model.loops.filter(l=>l.proof==='carried').length,unproved:model.loops.filter(l=>l.proof==='unproved').length};
}
export function learningGeometry(model) {
 validateLearningSystem(model);
 // Stable identity order, never a force simulation or an implied causal connection between loops.
 const order=[...model.loops].sort((a,b)=>a.id.localeCompare(b.id));
 return order.flatMap((loop,i)=>loop.stages.map((stage,j)=>({id:`${loop.id}:${stage.id}`,loopId:loop.id,stageId:stage.id,x:(j-1.5)*1.55,y:((order.length-1)/2-i)*.52,z:(loop.binding==='native'?-.55:.55)+[0,-1.2,1.2,0][j],state:stage.state})));
}
const labels={observed:'Observed',carried:'Earlier evidence',unknown:'Not demonstrated',attention:'Needs interpretation'};
const proofLabels={observed:'Closure re-witnessed',carried:'Closure uses earlier proof',unproved:'Closure not proved'};
const stageNames=['Signal','Transform','Changed artifact','Later use'];
export function learningIcon(state) {
 const common='viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"';
 if(state==='observed')return `<svg ${common}><circle cx="10" cy="10" r="8"/><path d="m6 10 2.5 2.5 5-5"/></svg>`;
 if(state==='carried')return `<svg ${common}><circle cx="10" cy="10" r="8"/><path d="M10 5v5l3 2"/></svg>`;
 if(state==='attention')return `<svg ${common}><path d="m10 2 8 15H2Z"/><path d="M10 7v4m0 2v1"/></svg>`;
 return `<svg ${common}><circle cx="10" cy="10" r="7" stroke-dasharray="3 3"/><path d="M7 10h6"/></svg>`;
}
export function renderLearningSystem(model,{id='learning-system',headingId='learning-system-heading',title='How the system learns'}={}) {
 const summary=learningSummary(model); if(!safeId.test(id)||!safeId.test(headingId))throw new Error('Safe presentation IDs required');
 const date=new Date(model.observedOn+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
 const focus=model.loops.find(l=>l.proof!=='observed')||model.loops[0];
 const state=s=>`<span class="ll-state" data-state="${s}">${learningIcon(s)}${labels[s]}</span>`;
 const rows=model.loops.map(loop=>`<tr data-loop-row="${esc(loop.id)}"><th scope="row" class="ll-loop-name"><button type="button" data-loop-select="${esc(loop.id)}" aria-controls="${id}-inspector">${esc(loop.name)}<small>${proofLabels[loop.proof]}</small></button></th>${loop.stages.map((s,i)=>`<td data-linked="${s.state==='observed'&&loop.stages[i+1]?.state==='observed'}"><button type="button" class="ll-node" data-loop-select="${esc(loop.id)}" data-stage="${i}" data-state="${s.state}" aria-label="${esc(loop.name)}: ${stageNames[i]} — ${labels[s.state]}" aria-controls="${id}-inspector">${learningIcon(s.state)}</button></td>`).join('')}</tr>`).join('');
 const qualityBar=`<details class="ll-quality-bar" id="${id}-quality-bar"><summary>What would make this a world-class learning loop?</summary><p>This is an improvement checklist, not an assessment or an automatic grade. A closed evidence chain is the beginning; dependable learning also needs:</p><ol><li><strong>Useful feedback.</strong> Representative signals with known origin, scope and coverage; human agreement checked where judgment is involved.</li><li><strong>A traceable change.</strong> A versioned change attributable to that feedback, with approval where required.</li><li><strong>Verified reuse.</strong> A later run or decision consumes that exact changed version, in the same scope.</li><li><strong>Measured benefit.</strong> A held-out or controlled comparison shows improvement without unacceptable regressions. Set the metric and acceptance threshold before measuring.</li><li><strong>Reliable operation.</strong> Repeated evidence on the intended tier, monitored failures, complete cost accounting, enforced quality gates and a working rollback.</li></ol><p>These claims need their own proof. Activity, a completed ticket and one successful historical example do not establish them.</p></details>`;
 const fallback=model.loops.map(loop=>`<article id="${id}-record-${loop.id}"><h3>${esc(loop.name)}</h3><p><strong>${proofLabels[loop.proof]}.</strong> ${esc(loop.summary)}</p><ol>${loop.stages.map((s,i)=>`<li><strong>${stageNames[i]} · ${labels[s.state]}:</strong> ${esc(s.label)}. ${esc(s.note)}</li>`).join('')}</ol><p><strong>Missing now:</strong> ${esc(loop.missing)}</p><p><strong>Next proof:</strong> ${esc(loop.action)}</p><p><a href="${esc(loop.sourceHref)}">Recorded assessment</a> · ${esc(loop.sourceLocator)}</p><details><summary>Supporting evidence</summary><ul>${loop.evidence.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details></article>`).join('');
 const metrics=model.metrics.map(m=>`<tr data-metric-row="${esc(m.id)}"><th scope="row"><button type="button" data-metric-select="${esc(m.id)}" aria-controls="${id}-inspector">${esc(m.name)}</button></th><td><strong>${esc(m.value)}</strong><span>${esc(m.status)}</span></td></tr>`).join('');
 const runs=model.runs.map(r=>`<article class="ll-run"><header><strong>${esc(r.model)}</strong><span>${esc(r.verdict)}</span></header><p>${esc(r.reason)}</p><small>${esc(r.time)} · Run <code>${esc(r.id)}</code></small><details><summary>Verdict context</summary><p>${esc(r.detail)}</p><p>Accounting: ${esc(r.accounting)}</p></details></article>`).join('');
 const agents=model.agents?.length?`<details class="ll-agent-inventory"><summary>Agent inventory · ${model.agents.length} discovered</summary><p>Declared suite coverage, not proof of model execution or a causal connection to a loop.</p><table class="ll-eval-table"><thead><tr><th scope="col">Agent</th><th scope="col">Role and coverage</th></tr></thead><tbody>${model.agents.map(a=>`<tr><th scope="row"><a href="${esc(a.sourceHref)}">${esc(a.name)}</a></th><td>${esc(a.category)} · ${esc(a.coverage)}</td></tr>`).join('')}</tbody></table></details>`:'';
 const modelJson=JSON.stringify({...model,geometry:learningGeometry(model)}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 return `<section class="ll-system" id="${id}" data-learning-system aria-labelledby="${headingId}">
 <header class="ll-heading"><div><h2 id="${headingId}">${esc(title)}</h2><p>Follow the evidence from a signal to a change the system actually uses.</p></div><div class="ll-assessment"><strong>${esc(model.grade??(model.previousAssessment?'Pending':'Unassessed'))}</strong><span>${model.grade?'Recorded assessment':model.previousAssessment?'Reassessment incomplete':'No grade recorded'}<br>${esc(date)}</span>${model.previousAssessment?`<small>Last grade: <a href="${esc(model.previousAssessment.sourceHref)}">${esc(model.previousAssessment.grade)} · ${esc(model.previousAssessment.observedOn)}</a></small>`:''}</div></header>
 <p class="ll-scope"><span>${esc(model.scope)}</span><span>Production: ${esc(model.production)}</span><a href="${esc(model.sourceHref)}">Assessment source</a></p>
 <div class="ll-reading"><div><h3>${summary.declared?`<span class="ll-close-count">${summary.closed} of ${summary.declared}</span> declared loops have closure evidence`:'No learning loops recorded'}</h3><p>${summary.rewitnessed} re-witnessed · ${summary.carried} using earlier proof · ${summary.unproved} not proved. These counts describe the full recorded inventory.</p></div><div><h3>${focus?esc(focus.decision):'Discovery is incomplete'}</h3><p>${focus?esc(focus.action):'Record source-backed loop identities and their evidence before drawing relationships.'}</p>${focus?`<a href="#${id}-record-${focus.id}" data-focus-loop="${esc(focus.id)}">Trace the missing proof</a>`:''}</div></div>
 <div class="ll-toolbar ll-enhanced" hidden><div class="ll-tabs" role="group" aria-label="Learning system view"><button type="button" data-ll-view="map" aria-pressed="true">Learning map</button><button type="button" data-ll-view="graph" aria-pressed="false">Explore in 3D</button><button type="button" data-ll-view="eval" aria-pressed="false">Evaluations</button></div><label class="ll-filter"><input type="checkbox" data-ll-gaps>Show missing or earlier proof</label></div>
 <div class="ll-workspace ll-enhanced" hidden><div class="ll-main"><div data-ll-panel="map"><table class="ll-map"><caption class="rm-visually-hidden">Four evidence stages for every declared loop. Select a loop or stage to inspect its proof.</caption><thead><tr><th scope="col">Declared loop</th>${stageNames.map(t=>`<th scope="col">${t}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>${!model.loops.length?'<p class="ll-caption">No declared loops in the selected snapshot.</p>':''}<div class="ll-legend" aria-label="Evidence states">${STATES.map(state).join('')}</div><p class="ll-caption" data-ll-count>All ${summary.declared} declared loops. A missing witness is not an observed failure.</p></div>
 <div data-ll-panel="graph" hidden>
 <div class="ll-graph-intro"><h3>Follow one learning loop</h3><p>Choose a loop and play its four-stage walkthrough. See the recorded evidence, what is missing and the next improvement below.</p></div>
 <div class="ll-graph-browser"><nav class="ll-loop-browser" aria-label="Choose a learning loop"><h4>Learning loops</h4><div class="ll-loop-options">${model.loops.map(l=>`<button type="button" data-graph-select="${esc(l.id)}" aria-pressed="false"><strong>${esc(l.name)}</strong><span>${proofLabels[l.proof]}</span></button>`).join('')}</div></nav>
 <div class="ll-graph-stage"><div class="ll-graph-selection"><div><p class="ll-small" data-ll-position></p><h4 data-ll-selected-name></h4></div><div class="ll-loop-step"><button type="button" data-loop-step="-1" aria-label="Previous learning loop">Previous</button><button type="button" data-loop-step="1" aria-label="Next learning loop">Next</button></div></div>
 <div class="ll-decision-brief" data-ll-decision-brief></div><div class="ll-graph-tools"><label class="ll-picker">Selected loop<select data-ll-loop aria-label="Choose a loop">${model.loops.map(l=>`<option value="${esc(l.id)}">${esc(l.name)}</option>`).join('')}</select></label><div class="ll-graph-scope" role="group" aria-label="Diagram scope"><button type="button" data-graph-scope="selected" aria-pressed="true">Selected loop</button><button type="button" data-graph-scope="all" aria-pressed="false">All loops</button></div><button type="button" data-ll-read-evidence>Read evidence</button></div>
 <div class="ll-walk-controls"><button type="button" data-ll-play aria-pressed="false">Play walkthrough</button><span>Illustration of recorded evidence · not live activity</span></div><div class="ll-walk-caption" data-ll-walk-caption aria-live="polite"></div><div class="ll-canvas-wrap"><canvas tabindex="0" aria-label="3D learning diagram. Use the named loop buttons or Previous and Next to select a loop. Arrow keys rotate; plus and minus zoom; Home resets the camera." aria-describedby="${id}-3d-help"></canvas><div class="ll-node-numbers" aria-hidden="true"></div><div class="ll-graph-labels"></div></div> <div class="ll-graph-controls" role="group" aria-label="Adjust diagram angle"><span>View angle</span><button type="button" data-camera="left" aria-label="Rotate diagram left">Rotate left</button><button type="button" data-camera="right" aria-label="Rotate diagram right">Rotate right</button><button type="button" data-camera="in" aria-label="Zoom in">Zoom in</button><button type="button" data-camera="out" aria-label="Zoom out">Zoom out</button><button type="button" data-camera="reset">Reset view</button></div><section class="ll-improve" data-ll-improve aria-label="Selected loop improvement"></section>

 <p class="ll-camera-note" id="${id}-3d-help">Each point is an evidence stage. A solid line joins observed stages; a dashed line marks a sequence needing proof. Dragging changes the viewing angle. Depth separates the stages for exploration; position is a layout choice, not a progress score. Only the declared four-stage sequence is drawn; a return into a new cycle is not assumed.</p><p class="ll-caption" data-ll-gl-status role="status"></p></div></div></div>
 <div data-ll-panel="eval" class="ll-evaluations" hidden><h3>Can we trust the evaluations?</h3><p>Coverage, verdicts and enforcement are separate questions. Select a measure for its evidence and next proof.</p><table class="ll-eval-table"><thead><tr><th scope="col">Question</th><th scope="col">Recorded observation</th></tr></thead><tbody>${metrics}</tbody></table>${!metrics?'<p>No evaluation measurements recorded.</p>':''}<div class="ll-runs"><h3>Recorded suite verdicts</h3>${runs||'<p>No retained suite runs in this snapshot.</p>'}</div>${agents}</div></div><aside class="ll-inspector" id="${id}-inspector" aria-label="Selected evidence"><div data-ll-detail></div></aside></div>
 <p class="rm-visually-hidden" role="status" aria-live="polite" data-ll-announcement></p>
 <div class="ll-noscript"><p>Complete text records. Interactive views appear when JavaScript is available.</p>${fallback}<h3>Evaluation records</h3>${model.metrics.map(m=>`<article><h4>${esc(m.name)} · ${esc(m.value)}</h4><p>${esc(m.status)}. ${esc(m.detail)}</p><p>Next proof: ${esc(m.nextProof)}</p></article>`).join('')}<h3>Recorded suite verdicts</h3>${runs||'<p>No retained suite runs in this snapshot.</p>'}${agents}</div>
 ${qualityBar}
 <p class="ll-footnote">Snapshot: ${esc(date)}. This view presents recorded evidence; it does not issue a new grade or check live systems. Filtered views keep the full inventory denominator.</p>
 <script type="application/json" id="${id}-data">${modelJson}</script></section>`;
}
