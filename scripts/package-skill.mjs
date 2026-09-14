import { realpathSync } from 'node:fs';
import { mkdtemp, mkdir, readdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function packageSkill(destination, format='portable') {
 if(!['portable','claude-code'].includes(format)) throw new Error('Format must be portable or claude-code');
 const scratch=await mkdtemp(join(tmpdir(),'horizons-package-'));
 try {
  const skill=join(scratch,'horizons');await mkdir(skill);
  let entry=await readFile(join(root,'SKILL.md'),'utf8');if(format==='portable')entry=entry.replace(/^argument-hint:.*\n/m,'');
  await writeFile(join(skill,'SKILL.md'),entry);
  for(const folder of ['references','assets','scripts']){
   await mkdir(join(skill,folder));for(const name of await readdir(join(root,folder))){
    if(name.endsWith('.test.mjs') || ['build-demo.mjs','package-skill.mjs','build-reference-contents.mjs','summarize-evals.mjs'].includes(name))continue;
    await copyFile(join(root,folder,name),join(skill,folder,name));
   }
  }
  await mkdir(join(skill,'demo'));await copyFile(join(root,'demo','roadmap.json'),join(skill,'demo','roadmap.json'));
  const output=resolve(destination);await mkdir(output,{recursive:true});const archive=join(output,`horizons-${format}.tar.gz`);
  execFileSync('tar',['-czf',archive,'-C',scratch,'horizons']);
  const sha256=createHash('sha256').update(await readFile(archive)).digest('hex');await writeFile(`${archive}.sha256`,`${sha256}  horizons-${format}.tar.gz\n`);
  return {archive,sha256,format};
 }finally{await rm(scratch,{recursive:true,force:true});}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(realpathSync(process.argv[1])).href) packageSkill(process.argv[2]||'/tmp/horizons-packages',process.argv[3]||'portable').then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1;});
