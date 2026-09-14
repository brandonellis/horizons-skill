import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateModel, refreshModel, applyMoves, digest, readEmbeddedModel } from './roadmap-model.mjs';
import { stageRoadmap, commitRoadmap, run, verifyStarter } from './roadmap-pipeline.mjs';
import { renderStarter } from './render-starter.mjs';
const fixture = JSON.parse(await readFile(new URL('../demo/roadmap.json', import.meta.url), 'utf8'));
const model = () => structuredClone(fixture);
const proposal = (m, moves = [{itemId:m.items[0].id,from:'now',to:'next',reason:'Access review is a prerequisite'}]) => ({schemaVersion:1,projectId:m.project.id,baseRevision:m.revision,baseDigest:digest(m),moves});
async function workspace(fn) { const dir=await mkdtemp(join(tmpdir(),'horizons-test-')); try {await fn(join(dir,'index.html'),dir);} finally {await rm(dir,{recursive:true,force:true});} }

test('reviewed movement preserves all evidence, current grades and prior history', () => {
  const before=model(), original=structuredClone(before), moved=applyMoves(before,proposal(before),{approval:'User selected the move',at:'2026-09-14T16:00:00Z'});
  assert.deepEqual(before,original); assert.equal(moved.items[0].horizon,'next'); assert.equal(moved.revision,2);
  assert.equal(moved.observedAt,before.observedAt); assert.deepEqual(moved.gradePlanning,before.gradePlanning);
  const expected=structuredClone(before.items); expected[0].horizon='next'; assert.deepEqual(moved.items,expected);
  assert.equal(moved.history[0].reason,'Access review is a prerequisite');
});
test('movement rejects stale revision/content, empty reason, duplicate and unknown items, and missing approval',()=>{
  const m=model(), p=proposal(m);
  for(const bad of [{...p,baseRevision:0},{...p,baseDigest:'bad'},{...p,moves:[{...p.moves[0],reason:' '}]},{...p,moves:[...p.moves,...p.moves]},{...p,moves:[{...p.moves[0],itemId:'unknown'}]}]) assert.throws(()=>applyMoves(m,bad,{approval:'reviewed'}));
  assert.throws(()=>applyMoves(m,p));
});
test('refresh refuses moved/deleted commitments and rewritten history or grades',()=>{
  const m=model();
  for(const edit of [s=>s.items[0].horizon='later',s=>s.items.pop(),s=>s.history.push({type:'refresh',at:m.observedAt,revision:1,changes:[]}),s=>s.gradePlanning.assessment.id='replacement']){
    const snapshot=model(); edit(snapshot); assert.throws(()=>refreshModel(m,snapshot));
  }
  const snapshot=model(); snapshot.items[1].delivery={status:'verified',evidenceRefs:['runtime']};
  const next=refreshModel(m,snapshot); assert.equal(next.history[0].changes[0].kind,'delivery'); assert.equal(next.items[1].horizon,m.items[1].horizon);
});
test('measured impact and verified delivery require evidence, unsafe URLs and IDs refuse',()=>{
  for(const edit of [m=>m.items[0].impact.status='measured',m=>m.items[0].delivery={status:'verified',evidenceRefs:[]},m=>m.sources[0].href='javascript:alert(1)',m=>m.items[0].id='x" onmouseover="bad',m=>m.items[0].refs=['missing']]){const m=model();edit(m);assert.throws(()=>validateModel(m));}
});
test('HTML escapes untrusted evidence and keeps its exact embedded model',()=>{
  const m=model();m.items[0].title='<script>alert("bad")</script>';m.sources[0].summary='</script><img src=x onerror=alert(1)>';
  const html=renderStarter(m); assert.deepEqual(readEmbeddedModel(html),m); assert.ok(!html.includes('<img src=x')); assert.equal(verifyStarter(html).items,m.items.length);
});
test('staging and resume save one canonical file; interrupted stage leaves original bytes intact',async()=>workspace(async path=>{
  await stageRoadmap(path,{snapshot:model()}); const initial=await commitRoadmap(path); assert.equal(initial.revision,1);
  const original=await readFile(path,'utf8'), m=readEmbeddedModel(original);
  await stageRoadmap(path,{proposal:proposal(m),approval:'User request'}); assert.equal(await readFile(path,'utf8'),original);
  await commitRoadmap(path); assert.equal(readEmbeddedModel(await readFile(path,'utf8')).items[0].horizon,'next');
}));
test('concurrent edits preserve the changed canonical artifact and retain the checkpoint',async()=>workspace(async path=>{
  await stageRoadmap(path,{snapshot:model()}); await commitRoadmap(path);
  const m=readEmbeddedModel(await readFile(path,'utf8')); await stageRoadmap(path,{proposal:proposal(m),approval:'user'});
  await writeFile(path,'concurrent user edit'); await assert.rejects(()=>commitRoadmap(path),/changed after staging/);
  assert.equal(await readFile(path,'utf8'),'concurrent user edit'); assert.ok(await readFile(`${path}.pending.json`,'utf8'));
}));
test('legacy and assessed artifacts are never replaced by the starter',async()=>workspace(async path=>{
  for(const html of ['<html>Legacy</html>',renderStarter(model()).replace('</body>','<script id="roadmap-history" type="application/json">{}</script></body>')]){
    await writeFile(path,html); await assert.rejects(()=>stageRoadmap(path,{snapshot:model()})); assert.equal(await readFile(path,'utf8'),html);
  }
}));
test('CLI refuses accidental build overwrite and missing refresh target',async()=>workspace(async(path,dir)=>{
  const input=join(dir,'input.json');await writeFile(input,JSON.stringify(model()));
  await assert.rejects(()=>run(['refresh',path,input]));await run(['build',path,input]);await assert.rejects(()=>run(['build',path,input]));
  await assert.rejects(()=>run(['move',path,input,'--mystery']));
}));
test('symlink entries refuse instead of replacing another file',async()=>workspace(async(path,dir)=>{
  const target=join(dir,'target.html');await writeFile(target,'preserve');await symlink(target,path);
  await assert.rejects(()=>stageRoadmap(path,{snapshot:model()}));assert.equal(await readFile(target,'utf8'),'preserve');
}));
test('source recheck timestamps do not masquerade as changed claims',()=>{
 const m=model(), snapshot=model(); snapshot.observedAt='2026-09-14T12:00:00Z';snapshot.sources.forEach(s=>s.observedAt=snapshot.observedAt);
 const next=refreshModel(m,snapshot);assert.deepEqual(next.history[0].changes,[]);
 snapshot.sources[0].summary='Changed acceptance';assert.ok(refreshModel(m,snapshot).history[0].changes.some(c=>c.kind==='evidence'));
});
test('adding grade opportunities is a presentation event; identical input is idempotent',async()=>workspace(async(path,dir)=>{
 const m=model(), planning=m.gradePlanning;delete m.gradePlanning;
 await stageRoadmap(path,{snapshot:m});await commitRoadmap(path);const input=join(dir,'planning.json');await writeFile(input,JSON.stringify(planning));
 const result=await run(['priorities',path,input]);assert.equal(result.revision,2);
 const updated=readEmbeddedModel(await readFile(path,'utf8'));assert.equal(updated.history[0].type,'grade-plan');assert.equal(updated.observedAt,m.observedAt);assert.deepEqual(updated.gradePlanning,planning);
 const bytes=await readFile(path,'utf8');assert.equal((await run(['priorities',path,input])).status,'unchanged');assert.equal(await readFile(path,'utf8'),bytes);
}));
test('priority refresh cannot rewrite an existing observation or rubric',async()=>workspace(async path=>{
 const m=model();await stageRoadmap(path,{snapshot:m});await commitRoadmap(path);const before=await readFile(path,'utf8');
 const changed=structuredClone(m.gradePlanning);changed.assessment.observations[0].evidenceRefs=['different proof'];
 await assert.rejects(()=>stageRoadmap(path,{gradePlanning:changed}),/cannot replace recorded assessments/);assert.equal(await readFile(path,'utf8'),before);
}));
test('resume recognizes a crash after replacement and finishes without rewriting saved bytes',async()=>workspace(async path=>{
 await stageRoadmap(path,{snapshot:model()});const checkpoint=JSON.parse(await readFile(`${path}.pending.json`,'utf8'));
 const saved=renderStarter(checkpoint.model);await writeFile(path,saved);
 const result=await commitRoadmap(path);assert.equal(result.recoveredAfterReplacement,true);assert.equal(await readFile(path,'utf8'),saved);
 await assert.rejects(()=>readFile(`${path}.pending.json`),{code:'ENOENT'});
}));
test('update retains the canonical file access mode',async()=>workspace(async path=>{
 const {chmod,stat}=await import('node:fs/promises');await stageRoadmap(path,{snapshot:model()});await commitRoadmap(path);await chmod(path,0o640);
 const m=readEmbeddedModel(await readFile(path,'utf8'));await stageRoadmap(path,{proposal:proposal(m),approval:'user request'});await commitRoadmap(path);
 assert.equal((await stat(path)).mode&0o777,0o640);
}));
