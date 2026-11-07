import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,copyFile,chmod,readFile,rm} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const runner=fileURLToPath(new URL('./run-camber-multitool.mjs',import.meta.url));
const fake=fileURLToPath(new URL('./fixtures/fake-npx.mjs',import.meta.url));
async function run(scenario){
 const dir=await mkdtemp(join(tmpdir(),'rea-fake-'));const pidfile=join(dir,'pid');
 await copyFile(fake,join(dir,'npx'));await chmod(join(dir,'npx'),0o755);
 try{
  const child=spawn(process.execPath,[runner],{env:{...process.env,GITHUB_ACTIONS:'true',PATH:dir+':'+process.env.PATH,FAKE_SCENARIO:scenario,FAKE_PID_FILE:pidfile}});
  let out='',err='';const watchdog=setTimeout(()=>{child.kill('SIGKILL');try{process.kill(Number(readFileSync(pidfile,'utf8')),'SIGKILL');}catch{}},48000);child.stdout.on('data',x=>out+=x);child.stderr.on('data',x=>err+=x);
  const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});
  clearTimeout(watchdog);const pid=Number(await readFile(pidfile,'utf8'));
  let alive=true;try{process.kill(pid,0);}catch(e){if(e.code==='ESRCH')alive=false;else throw e;}
  if(alive)try{process.kill(pid,'SIGKILL');}catch{}
  return {code,out,err,alive};
 }finally{await rm(dir,{recursive:true,force:true});}
}
test('runner accepts complete fake MCP session and cleans up server',async()=>{
 const r=await run('ok');assert.equal(r.code,0,r.err);assert.match(r.out,/PASS_MCP_TOOLS/);assert.equal(r.alive,false);
});
for(const scenario of ['tool-error','malformed','missing','duplicate','identity','exit','incomplete'])
 test('runner fails closed and cleans up: '+scenario,async()=>{const r=await run(scenario);assert.notEqual(r.code,0);assert.doesNotMatch(r.out,/PASS_MCP_TOOLS/);assert.equal(r.alive,false);});

test('runner times out and terminates a server that ignores SIGTERM', {timeout:50000}, async()=>{ const r=await run('stubborn'); assert.equal(r.code,1,'runner must exit itself without watchdog'); assert.match(r.err,/timeout/); assert.equal(r.alive,false); });
