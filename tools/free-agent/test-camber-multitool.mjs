import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,readFile,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {dirname,join} from "node:path";
import {spawn} from "node:child_process";
import {fileURLToPath} from "node:url";
import {validateCamberPlan} from "./validate-camber-multitool.mjs";

const originalPlan=JSON.parse(await readFile(new URL("../../docs/free-agent/camber-android-readiness.json",import.meta.url),"utf8"));

function runRunnerWithScenario(scenario,{timeoutMs=15000,pidFile,extraEnv={}}={}) {
 return new Promise(async (resolve,reject)=>{
  const dir=await mkdtemp(join(tmpdir(),"camber-mcp-test-"));
  const configPath=join(dir,"rea-mcp-config.json");
  const config={mcpServers:{rea:{
   command:process.execPath,
   args:[fileURLToPath(new URL("./test-fixtures/fake-rea-mcp-server.mjs",import.meta.url))],
  }}};
  await writeFile(configPath,JSON.stringify(config),"utf8");
  const child=spawn(process.execPath,[fileURLToPath(new URL("./run-camber-multitool.mjs",import.meta.url))],{
   cwd:fileURLToPath(new URL("../../",import.meta.url)),
   env:{...process.env,GITHUB_ACTIONS:"true",SFS_ALLOW_TEST_MCP_SERVER:"true",SFS_REA_MCP_CONFIG_PATH:configPath,FAKE_MCP_SCENARIO:scenario,FAKE_MCP_PID_FILE:pidFile||"",...extraEnv},
   stdio:["ignore","pipe","pipe"],
  });
  let stdout="",stderr="",timedOut=false;
  const timer=setTimeout(()=>{
   timedOut=true;
   child.kill("SIGKILL");
  },timeoutMs);
  child.stdout.on("data",(chunk)=>{stdout+=chunk.toString("utf8");});
  child.stderr.on("data",(chunk)=>{stderr+=chunk.toString("utf8");});
  child.on("error",async (err)=>{
   clearTimeout(timer);
   await rm(dir,{recursive:true,force:true});
   reject(err);
  });
  child.on("close",async (code)=>{
   clearTimeout(timer);
   await rm(dir,{recursive:true,force:true});
   resolve({code,stdout,stderr,timedOut});
  });
 });
}

test("accept exact Camber three-tool intent and all empty arguments",()=>{
 const selected=validateCamberPlan(originalPlan);
 assert.deepEqual(selected.map((x)=>x.name),["binary_session","inspect_apktool_client","inspect_adb_client"]);
});

test("runner passes with deterministic fake MCP happy path",async ()=>{
 const run=await runRunnerWithScenario("success");
 assert.equal(run.code,0,run.stderr);
 assert.match(run.stdout,/CAMBER_MULTITOOL_EVIDENCE=/);
});

for(const scenario of ["tool_error","malformed_reply","missing_tool","duplicate_tool","invalid_identity","timeout","premature_exit","failure_exit_status","incomplete_evidence"]){
 test("runner fails for scenario: "+scenario,async ()=>{
  const run=await runRunnerWithScenario(scenario,{
   timeoutMs:scenario==="timeout"?10000:15000,
   extraEnv:scenario==="timeout"?{SFS_MCP_TOOL_CALL_TIMEOUT_MS:"200"}:{},
  });
  assert.notEqual(run.code,0,"expected non-zero exit for "+scenario);
  assert.equal(run.timedOut,false,"unexpected harness timeout for "+scenario);
  assert.match(run.stderr,/CAMBER_MULTITOOL_FAILED=/);
 });
}

test("runner process-group cleanup terminates fake MCP child tree",async ()=>{
 const pidFile=join(await mkdtemp(join(tmpdir(),"camber-cleanup-")),"pids.txt");
 const run=await runRunnerWithScenario("cleanup_tree",{pidFile,timeoutMs:20000});
 assert.equal(run.code,0,run.stderr);
 const pidText=await readFile(pidFile,"utf8");
 const pids=pidText.split("\n").filter(Boolean).map((line)=>Number(line.split(":")[1])).filter(Number.isInteger);
 assert.ok(pids.length>=3,"expected server/helper/grandchild pids");
 await new Promise((resolve)=>setTimeout(resolve,300));
 for(const pid of pids){
  assert.throws(()=>process.kill(pid,0),{code:"ESRCH"});
 }
 await rm(dirname(pidFile),{recursive:true,force:true});
});
