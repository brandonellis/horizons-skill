import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { contractFingerprint } from './assessment-engine.mjs';
import { renderStarter } from './render-starter.mjs';
import { refreshModel } from './roadmap-model.mjs';
import { verifyStarter } from './roadmap-pipeline.mjs';

const root = new URL('../', import.meta.url);
const at = '2026-09-14T12:00:00Z';
const source = (id,label,summary) => ({ id,label,kind:'record',confirmed:true,observedAt:at,locator:`Synthetic source: ${id}`,summary });
const item = (id,title,horizon,stream,outcome,delivery,nextProof,decision) => ({ id,title,horizon,stream,owner:null,problem:'Small teams lose time coordinating access and recurring project updates.',outcome,successMeasure:'Compare time to the first successful team workflow; no measurement recorded yet.',nextProof,refs:['planning','tracker'],delivery:{status:delivery,evidenceRefs:delivery==='verified'?['runtime']:['tracker']},impact:{status:'unmeasured',summary:'No comparable customer measurement has been recorded.',evidenceRefs:[]},...(decision?{decision}:{}) });
const contract = JSON.parse(await readFile(new URL('evals/fixtures/complete-grade/contract.json',root),'utf8'));
contract.approval.approvedAt='2026-09-13T10:00:00Z'; contract.approval.reference='Synthetic demo rubric approval'; contract.approval.contractHash=contractFingerprint(contract);
const codeRef={scope:'code',repository:'synthetic/meridian',commit:'a'.repeat(40)};
const runtimeRef={scope:'production',service:'synthetic-meridian',revision:'demo-1',imageDigest:'sha256:'+'b'.repeat(64),commit:'a'.repeat(40)};
const gradeAt='2026-09-13T12:00:00Z';
const assessment={id:'demo-assessment',baselineId:contract.baselineId,contractId:contract.id,contractHash:contractFingerprint(contract),observedAt:gradeAt,sourceCodeRefs:[codeRef],runtimeRefs:[runtimeRef],coverageGaps:[],observations:contract.criteria.map(c=>({criterionId:c.id,result:c.tier==='D'||c.tier==='C'?'pass':c.cellId==='code-testing'?'fail':'unknown',observedAt:gradeAt,assessmentId:'demo-assessment',subject:c.cellId==='code-testing'?codeRef:runtimeRef,evidenceRefs:['Synthetic invitation acceptance evidence']})),findings:[{id:'expiry-gap',scope:'code',status:'open',blocking:true},{id:'expiry-gap',scope:'production',status:'unknown',blocking:true}]};
const tickets=[
{id:'DEMO-101',title:'Reject expired invitations',criterionIds:['code-testing-B'],mappingEvidenceRefs:['Synthetic acceptance: expired invitations must be rejected'],dependsOn:[],effort:2},
{id:'DEMO-102',title:'Verify expiry on the deployed revision',criterionIds:['production-testing-B'],mappingEvidenceRefs:['Synthetic runtime acceptance: past expiry rejected'],dependsOn:['DEMO-101'],effort:1},
{id:'DEMO-103',title:'Reject malformed expiration dates',criterionIds:['code-testing-A','production-testing-A'],mappingEvidenceRefs:['Synthetic acceptance: malformed expiration rejected in code and production'],dependsOn:[],effort:2},
{id:'DEMO-104',title:'Polish invitation confirmation copy',criterionIds:[],mappingEvidenceRefs:[],dependsOn:[],effort:1}];
const first={schemaVersion:1,revision:1,observedAt:'2026-09-13T12:00:00Z',project:{id:'meridian-demo',name:'Meridian',audience:'Product and engineering weekly review',synthetic:true,headline:'Less coordination. More work moving.',summary:'A small team is making account access and project updates easier. Follow the commitments, inspect the proof, and see which decisions unlock the next step.'},sources:[source('planning','Planning decisions','Self-service access is committed now. Reporting follows usable access controls. Portfolio views remain an option.'),source('tracker','Issue tracker snapshot','Account export is Done. Invitation work remains in progress. Reporting waits for a definition of useful adoption.'),source('runtime','Delivery verification','Synthetic production probe verified account export. No expiry probe or business-impact measurement is available.')],items:[item('team-invitations','Invite the whole team','now','Access','New colleagues can start without waiting for an administrator.','in-progress','Reject expired invitations, then verify the deployed path.'),item('account-export','Take your account data with you','now','Ownership','Teams can retrieve their account records for their own reporting.','marked-done','Verify the exported records in the deployed revision.'),item('weekly-digest','A useful weekly update','next','Visibility','Leads can review changes without chasing every team.','planned','Agree on which changes belong in the digest.','Choose the first audience and the decision this update should support.'),item('adoption-measure','Know whether onboarding improved','next','Learning','The team can tell whether self-service access reduces waiting.','planned','Record a baseline and a comparable observation period.'),item('portfolio-view','See work across teams','later','Visibility','Leads can spot shared blockers across several projects.','planned','Confirm demand from teams using the weekly digest.')],history:[],gradePlanning:{contract,assessment,tickets,effortUnit:'relative points (synthetic)'}};
// Observation times of sources must not exceed the snapshot stamp.
first.sources.forEach(s=>s.observedAt=first.observedAt);
const snapshot=structuredClone(first); snapshot.observedAt=at; snapshot.sources.forEach(s=>s.observedAt=at);
snapshot.items[1].delivery={status:'verified',evidenceRefs:['runtime']}; snapshot.items[1].nextProof='Measure whether teams use the export in their reporting workflow.';
const current=refreshModel(first,snapshot);
for(const [name,value] of [['roadmap.json',first],['refresh.json',snapshot],['current.json',current]]) await writeFile(new URL(`demo/${name}`,root),JSON.stringify(value,null,2)+'\n');
for(const [name,value] of [['index.html',current],['before.html',first]]) { const html=renderStarter(value); verifyStarter(html); await writeFile(new URL(`demo/${name}`,root),html); }
await writeFile(new URL('docs/index.html',root), renderStarter(current));
await writeFile(new URL('docs/before.html',root), renderStarter(first));
await writeFile(new URL('docs/.nojekyll',root), '');
console.log(JSON.stringify({demo:fileURLToPath(new URL('demo/index.html',root)),before:fileURLToPath(new URL('demo/before.html',root)),synthetic:true}));
