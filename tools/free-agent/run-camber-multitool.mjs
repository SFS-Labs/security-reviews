/**
 * Three genuine, distinct, allowlisted REA MCP tool calls from Camber's reviewed plan.
 * No targets, arbitrary tool arguments, paid models or external scanning.
 */
import {spawn} from "node:child_process";
import {createInterface} from "node:readline";
import {readFile,appendFile} from "node:fs/promises";
import {pathToFileURL} from "node:url";
import {loadCamberPlan} from "./validate-camber-multitool.mjs";
import {readAndVerifyProviderGate} from "./provider-gate.mjs";
if(process.env.GITHUB_ACTIONS!=="true")throw Error("Approved GitHub Actions execution only");
await readAndVerifyProviderGate();
const steps=await loadCamberPlan(new URL("../../docs/free-agent/camber-android-readiness.json",import.meta.url));
const configUrl=process.env.SFS_REA_MCP_CONFIG_PATH
 ? pathToFileURL(process.env.SFS_REA_MCP_CONFIG_PATH)
 : new URL("../../docs/rea-copilot-mcp.json",import.meta.url);
const cfg=JSON.parse(await readFile(configUrl,"utf8"));
const c=cfg.mcpServers?.rea;
const isApprovedDefaultMcpCommand=c?.command==="npx"&&JSON.stringify(c.args)===JSON.stringify(["-y","rea-agents@6.8.0","mcp"]);
if(!isApprovedDefaultMcpCommand&&process.env.SFS_ALLOW_TEST_MCP_SERVER!=="true")
 throw Error("REA version or command drift");
const toolCallTimeoutMs=Number.isInteger(Number(process.env.SFS_MCP_TOOL_CALL_TIMEOUT_MS))
 ? Number(process.env.SFS_MCP_TOOL_CALL_TIMEOUT_MS)
 : 60000;
const child=spawn(c.command,c.args,{stdio:["pipe","pipe","pipe"],env:{...process.env,
 npm_config_audit:"false",npm_config_fund:"false"},detached:true});
const reader=createInterface({input:child.stdout,crlfDelay:Infinity});
let seq=0,closed=false,stderrTail="",shutdownRequested=false,lastExit={code:null,signal:null};
const waiting=new Map();
child.stderr.on("data",chunk=>{stderrTail=(stderrTail+chunk.toString()).slice(-500);});
function rejectAll(err) {
 closed=true;
 for(const [id,w] of waiting){clearTimeout(w.timer);w.reject(err);waiting.delete(id);}
}
child.on("error",rejectAll);
child.on("close",(code,signal)=>{
 lastExit={code,signal};
 if(!shutdownRequested||code!==0)rejectAll(Error("REA MCP exited: "+code+"/"+signal+" "+stderrTail));
});
reader.on("line",line=>{
 if(line.length>16*1024*1024){rejectAll(Error("MCP reply exceeds 16 MB"));child.kill();return;}
 let msg;
 try{msg=JSON.parse(line);}catch{rejectAll(Error("Non-JSON MCP response"));child.kill();return;}
 const w=waiting.get(msg.id);
 if(!w)return;
 waiting.delete(msg.id);clearTimeout(w.timer);
 if(msg.error)w.reject(Error("JSON-RPC failure: "+JSON.stringify(msg.error).slice(0,250)));
 else w.resolve(msg.result);
});
function send(payload){if(closed)throw Error("MCP closed");child.stdin.write(JSON.stringify({jsonrpc:"2.0",...payload})+"\n");}
function req(method,params,timeout=45000){
 return new Promise((resolve,reject)=>{
  const id=++seq;
  const timer=setTimeout(()=>{waiting.delete(id);reject(Error("MCP "+method+" timeout"));},timeout);
  waiting.set(id,{resolve,reject,timer});
  try{send({id,method,params});}catch(e){clearTimeout(timer);waiting.delete(id);reject(e);}
 });
}
function dataObjects(res){
 const values=[res?.structuredContent,res?.structuredContent?.result,res?.structuredContent?.normalized_result];
 for(const part of res?.content||[]){
  if(part.type==="text"&&part.text){
   try{const parsed=JSON.parse(part.text);values.push(parsed,parsed.result,parsed.normalized_result);}catch{}
  }
 }
 return values.filter(x=>x&&typeof x==="object");
}
function assertNormalizedResult(stepName,objects){
 const normalized=objects.find(o=>o.normalized_result&&typeof o.normalized_result==="object")?.normalized_result;
 if(!normalized)throw Error("Missing normalized_result for "+stepName);
 const result=normalized.result;
 if(!result||typeof result!=="object")throw Error("Missing normalized_result.result for "+stepName);
 if(stepName==="inspect_apktool_client"||stepName==="inspect_adb_client"){
  const version=result.client?.version;
  if(typeof version!=="string"||version.trim()==="")throw Error("Missing non-empty client.version for "+stepName);
 }
 return normalized;
}
async function shutdownChildProcess() {
 if(shutdownRequested)return;
 shutdownRequested=true;
 child.stdin.end();
 if(child.killed)return;
 const signalGroup=(signal)=>{
  try {
   process.kill(-child.pid,signal);
   return true;
  } catch {
   return false;
  }
 };
 if(!signalGroup("SIGTERM"))child.kill("SIGTERM");
 await new Promise((resolve)=>setTimeout(resolve,1200));
 if(!signalGroup("SIGKILL"))child.kill("SIGKILL");
}
const results=[];
try{
 const init=await req("initialize",{
  protocolVersion:"2025-06-18",capabilities:{},
  clientInfo:{name:"sfs-camber-multitool",version:"1.0.0"}
 },120000);
 if(!init?.serverInfo?.name)throw Error("MCP initialize lacked identity");
 send({method:"notifications/initialized"});
 const tools=new Map();let cursor;
 for(let page=0;page<20;page++){
  const l=await req("tools/list",cursor?{cursor}:{});
  for(const tool of l.tools||[]){
   if(tools.has(tool.name))throw Error("Duplicate tool name in MCP tools/list: "+tool.name);
   tools.set(tool.name,tool);
  }
  cursor=l.nextCursor;if(!cursor)break;
  if(page===19)throw Error("Tool inventory pagination exceeded");
 }
 for(const step of steps){
  const definition=tools.get(step.name);
  if(!definition)throw Error("Approved tool absent from active MCP: "+step.name);
  if((definition.inputSchema?.required||[]).length)throw Error("Unsafe required args for "+step.name);
 }
 for(const step of steps){
  const started=Date.now();
  const res=await req("tools/call",{name:step.name,arguments:{}},toolCallTimeoutMs);
  if(res?.isError===true)throw Error(step.name+" returned isError=true");
  const objects=dataObjects(res);
  const normalized=assertNormalizedResult(step.name,objects);
  const conclusion="REPLIED";
  let identity=null;
  if(step.name==="binary_session"){
   const body=objects.find(z=>z.server_identity);
   const pkg=body?.server_identity?.package;
   if(pkg?.name!=="rea-agents"||pkg?.version!=="6.8.0")
    throw Error("Identity mismatch in binary_session result");
   const count=body?.server_identity?.catalog?.counts?.mcp_tools;
   if(count!==229)throw Error("REA catalog count not pinned to verified v6.8.0");
   identity=pkg.name+"@"+pkg.version;
  }
  if(step.name!=="binary_session"){
   identity=normalized.result.client.version;
  }
  results.push({tool:step.name,args:{},mcp_response_received:true,
   outcome:conclusion,duration_ms:Date.now()-started,identity});
 }
 const evidence={verdict:"PASS_MCP_TRANSPORT",source:"Camber model-selected reviewed plan",
  planned_tools:steps.map(x=>x.name), actual_tools:results,
  actual_distinct_tool_calls:results.length,
  all_tools_returned_without_tool_error:results.every(x=>x.outcome==="REPLIED"),
  target_files_used:false,external_targets:false,
  model_call_on_runner:false,camber_chat_start_automated:false,
  utc:new Date().toISOString()};
 console.log("CAMBER_MULTITOOL_EVIDENCE="+JSON.stringify(evidence));
 if(process.env.GITHUB_STEP_SUMMARY){
  await appendFile(process.env.GITHUB_STEP_SUMMARY,
   "### Camber-selected REA MCP workflow (verified tool transport)\n\n"+
   "Source: Camber agent selection; three distinct real MCP tools/call operations in one session.\n\n"+
   results.map(x=>"- "+x.tool+": "+x.outcome+"\n").join("")+
   "\nDo not infer adb/apktool is installed from a successful diagnostic response. "+
   "This does not prove unattended invocation of the Camber agent.\n");
 }
} catch(err) {
 console.error("CAMBER_MULTITOOL_FAILED="+String(err.message).slice(0,700));
 process.exitCode=1;
}finally{
 await shutdownChildProcess();
 reader.close();
}
