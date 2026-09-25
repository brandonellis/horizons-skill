import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderLearningSystem,validateLearningSystem,learningSummary,learningGeometry} from './render-learning-system.mjs';
const fixture=JSON.parse(readFileSync(new URL('../evals/fixtures/learning-system/learning.json',import.meta.url),'utf8'));
test('one observation drives map, text, evaluation evidence and geometry without mutating the source',()=>{
 const model=structuredClone(fixture),before=JSON.stringify(model),html=renderLearningSystem(model);
 assert.equal(JSON.stringify(model),before);
 assert.deepEqual(learningSummary(model),{declared:3,closed:2,rewitnessed:1,carried:1,unproved:1});
 for(const loop of model.loops){assert.match(html,new RegExp('data-loop-row="'+loop.id+'"'));assert.match(html,new RegExp('learning-system-record-'+loop.id));}
 assert.equal(learningGeometry(model).length,12);assert.match(html,/3 \/ 5/);assert.match(html,/Advisory/);assert.match(html,/Snapshot: September 25, 2026/);
});
test('closure cannot be inferred from activity or silently lose a missing loop',()=>{
 for(const change of [m=>m.closedCount=3,m=>m.loops.pop(),m=>m.loops[0].proof='observed',m=>m.loops[1].stages[3].state='observed',m=>m.loops[2].stages[2].state='unknown']){
  const model=structuredClone(fixture);change(model);assert.throws(()=>validateLearningSystem(model));
 }
 const model=structuredClone(fixture);model.loops[0].stages.forEach(s=>s.state='observed');assert.equal(learningSummary(model).closed,2,'Observed parts alone do not certify a causal closure');
});
test('evidence states retain carried proof, unknown execution and interpretation warnings',()=>{
 const model=structuredClone(fixture);model.loops[0].stages[0].state='attention';const html=renderLearningSystem(model);
 assert.match(html,/Closure uses earlier proof/);assert.match(html,/Earlier evidence/);assert.match(html,/Not demonstrated/);assert.match(html,/Needs interpretation/);assert.match(html,/missing witness is not an observed failure/);
});
test('geometry remains stable when presentation ordering changes and has no invented cross-loop edges',()=>{
 const a=learningGeometry(fixture),model=structuredClone(fixture);model.loops.reverse();assert.deepEqual(learningGeometry(model),a);
 assert.equal(new Set(a.map(x=>x.id)).size,12);assert.ok(a.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)&&Number.isFinite(x.z)));
});
test('source text cannot execute from markup, embedded JSON or source links',()=>{
 const model=structuredClone(fixture);model.loops[0].name='</script><img src=x onerror=alert(1)>';model.loops[0].evidence=['<svg onload=alert(1)>'];
 const html=renderLearningSystem(model);assert.doesNotMatch(html,/<img|<svg onload/);assert.match(html,/\\u003c\/script>/);assert.match(html,/&lt;svg onload/);
 for(const link of ['javascript:alert(1)','data:text/html,x','//outside.example','../private','https://example.org/"']){const m=structuredClone(fixture);m.loops[0].sourceHref=link;assert.throws(()=>renderLearningSystem(m));}
});
test('unmeasured and empty inventories remain readable without invented results',()=>{
 const m={...structuredClone(fixture),loops:[],metrics:[],runs:[],closedCount:0,declaredCount:0};const html=renderLearningSystem(m);
 assert.match(html,/No learning loops recorded/);assert.match(html,/No evaluation measurements recorded/);assert.match(html,/No retained suite runs/);assert.match(html,/Unassessed/);
});
test('malformed and ambiguous stage identities refuse rendering',()=>{
 for(const change of [m=>m.loops[1].id=m.loops[0].id,m=>m.loops[0].stages.reverse(),m=>m.loops[0].stages[0].state='passed',m=>m.metrics[0].evidence=[],m=>m.loops[0].sourceLocator='',m=>m.observedOn='yesterday']){const m=structuredClone(fixture);change(m);assert.throws(()=>renderLearningSystem(m));}
});

// A current data snapshot cannot silently renew an older grade.
test('missing reassessment proof retains a dated last grade and an explicit incomplete state',()=>{
 const model=structuredClone(fixture); model.grade=null;model.previousAssessment={grade:'B',observedOn:'2026-09-20',sourceHref:'evidence/earlier.json'};
 const html=renderLearningSystem(model);assert.match(html,/Reassessment incomplete/);assert.match(html,/Last grade:/);assert.match(html,/2026-09-20/);
});

test('agent inventory distinguishes coverage from execution and rejects ambiguous identity',()=>{
 const model=structuredClone(fixture);model.agents=[{id:'fixture.agent',name:'Fixture agent',category:'review',coverage:'unknown',sourceHref:'evidence/learning-observation.json'}];
 assert.match(renderLearningSystem(model),/Agent inventory · 1 discovered/);
 model.agents.push({...model.agents[0]});assert.throws(()=>validateLearningSystem(model),/Agent identities/);
});
