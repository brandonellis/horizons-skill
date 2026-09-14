import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { realpathSync } from 'node:fs';
export function summarizeRuns(runs) {
 if(!Array.isArray(runs)||!runs.length) throw new Error('Need measured runs');
 for(const run of runs){
  if(!run.scenario||!run.model||!['completed','failed','blocked','timeout'].includes(run.status)||!Number.isFinite(run.elapsedSeconds)||run.elapsedSeconds<0)throw new Error('Invalid run identity, status or elapsed time');
  for(const key of ['firstUsefulArtifactSeconds','clarificationRounds','unsupportedClaims','scopeRegressions'])if(run[key]!==null&&(!Number.isFinite(run[key])||run[key]<0))throw new Error(`Record ${key} as a measurement or null`);
  if(![true,false,null].includes(run.historyPreserved))throw new Error('History preservation must be measured or null');
 }
 const values=key=>runs.map(r=>r[key]).filter(v=>v!==null).sort((a,b)=>a-b);
 const median=v=>!v.length?null:v.length%2?v[Math.floor(v.length/2)]:(v[v.length/2-1]+v[v.length/2])/2;
 return {runs:runs.length,completed:runs.filter(r=>r.status==='completed').length,completionRate:runs.filter(r=>r.status==='completed').length/runs.length,
 medianElapsedSeconds:median(values('elapsedSeconds')),firstUsefulArtifact:{measured:values('firstUsefulArtifactSeconds').length,medianSeconds:median(values('firstUsefulArtifactSeconds'))},
 clarificationRounds:{measured:values('clarificationRounds').length,total:values('clarificationRounds').reduce((a,b)=>a+b,0)},
 unsupportedClaims:{measured:values('unsupportedClaims').length,total:values('unsupportedClaims').reduce((a,b)=>a+b,0)},
 scopeRegressions:{measured:values('scopeRegressions').length,total:values('scopeRegressions').reduce((a,b)=>a+b,0)},
 historyPreservation:{verified:runs.filter(r=>r.historyPreserved===true).length,failed:runs.filter(r=>r.historyPreserved===false).length,unmeasured:runs.filter(r=>r.historyPreserved===null).length}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(realpathSync(process.argv[1])).href) readFile(resolve(process.argv[2]),'utf8').then(text=>console.log(JSON.stringify(summarizeRuns(JSON.parse(text)),null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});
