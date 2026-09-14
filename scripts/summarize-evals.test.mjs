import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeRuns} from './summarize-evals.mjs';
test('unknown measures and blocked tasks never count as verified success',()=>{
 const row={scenario:'create',model:'reported-model',status:'blocked',elapsedSeconds:30,firstUsefulArtifactSeconds:null,clarificationRounds:1,unsupportedClaims:null,scopeRegressions:null,historyPreserved:null};
 const result=summarizeRuns([row]);assert.equal(result.completionRate,0);assert.equal(result.firstUsefulArtifact.medianSeconds,null);assert.equal(result.historyPreservation.verified,0);assert.equal(result.unsupportedClaims.measured,0);
 assert.throws(()=>summarizeRuns([{...row,status:'unknown'}]));
});
