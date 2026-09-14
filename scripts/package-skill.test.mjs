import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {packageSkill} from './package-skill.mjs';
test('portable release removes host metadata and contains a working starter with no fixture/test dependency',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'horizons-dist-test-'));
 try{
  const {archive}=await packageSkill(dir);execFileSync('tar',['-xzf',archive,'-C',dir]);
  assert.doesNotMatch(await readFile(join(dir,'horizons','SKILL.md'),'utf8'),/^argument-hint:/m);
  const output=execFileSync(process.execPath,[join(dir,'horizons','scripts','roadmap-pipeline.mjs'),'build',join(dir,'index.html'),join(dir,'horizons','demo','roadmap.json')],{encoding:'utf8'});
  assert.equal(JSON.parse(output).status,'saved');
  const list=execFileSync('tar',['-tzf',archive],{encoding:'utf8'});assert.doesNotMatch(list,/\.git\/|evals\/|AGENTS.md|\.test.mjs/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
