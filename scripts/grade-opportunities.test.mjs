import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contractFingerprint } from './assessment-engine.mjs';
import { gradeOpportunities, renderGradeOpportunities } from './grade-opportunities.mjs';
const seed=JSON.parse(readFileSync(new URL('../demo/roadmap.json',import.meta.url),'utf8')).gradePlanning;
const input=()=>structuredClone(seed);
test('grade planning names exact code gate and leaves incomplete production unpredicted',()=>{
 const data=input(),before=structuredClone(data),plan=gradeOpportunities(data);
 const code=plan.groups.find(g=>g.scope==='code'),prod=plan.groups.find(g=>g.scope==='production');
 assert.equal(code.currentGrade,'C');assert.equal(code.target,'B');assert.deepEqual(code.ticketIds,['DEMO-101']);
 assert.equal(prod.currentGrade,null);assert.equal(prod.target,null);assert.equal(prod.required.length,2);
 assert.deepEqual(data,before);assert.equal(plan.tickets.at(-1).category,'Mapping needed');
 assert.match(renderGradeOpportunities(data),/Conditional opportunities, not new grades/);
});
test('two mandatory cells at the same grade reveal the shared gate and other required tickets',()=>{
 const data=input(),{contract,assessment,tickets}=data;
 contract.cells.push({...contract.cells[0],id:'code-security',dimension:'security'});
 for(const c of contract.criteria.filter(c=>c.cellId==='code-testing')){const id=c.id.replace('testing','security');contract.criteria.push({...c,id,cellId:'code-security'});assessment.observations.push({...assessment.observations.find(o=>o.criterionId===c.id),criterionId:id});}
 contract.approval.contractHash=contractFingerprint(contract);assessment.contractHash=contractFingerprint(contract);
 tickets.push({id:'DEMO-105',title:'Fix security gate',criterionIds:['code-security-B'],mappingEvidenceRefs:['synthetic acceptance'],dependsOn:[]});
 const plan=gradeOpportunities(data),code=plan.groups.find(g=>g.scope==='code');
 assert.deepEqual(new Set(code.ticketIds),new Set(['DEMO-101','DEMO-105']));
 assert.ok(plan.tickets.find(t=>t.id==='DEMO-101').remainingTicketIds.includes('DEMO-105'));
});
test('Done ticket cannot change observations or manufacture uplift',()=>{
 const data=input(),before=gradeOpportunities(data);data.tickets[0].status='Done';
 const after=gradeOpportunities(data);assert.deepEqual(after.groups,before.groups);assert.equal(after.groups[0].currentGrade,'C');
});
test('mapping evidence, known criteria, noncyclic dependencies and approved rubric are required',()=>{
 for(const edit of [d=>d.tickets[0].mappingEvidenceRefs=[],d=>d.tickets[0].criterionIds=['invented'],d=>d.tickets[0].dependsOn=['DEMO-102'],d=>d.contract.status='draft']){const data=input();edit(data);assert.throws(()=>gradeOpportunities(data));}
});
test('unmapped grade criteria stay visible instead of promising a ticket-only path',()=>{
 const data=input();data.tickets=data.tickets.filter(t=>t.id!=='DEMO-103');
 const plan=gradeOpportunities(data);assert.ok(plan.groups.find(g=>g.scope==='production').unmappedChecks.some(c=>c.id==='production-testing-A'));
});
test('a rubric without A+ gates cannot advertise an A+ projection',()=>{
 const data=input();data.assessment.observations.forEach(o=>o.result='pass');
 const plan=gradeOpportunities(data);assert.equal(plan.groups[0].currentGrade,'A');assert.equal(plan.groups[0].target,null);
 assert.match(plan.groups[0].explanation,/No higher grade gate/);
});
