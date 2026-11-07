import {spawn} from "node:child_process";
import {appendFile} from "node:fs/promises";
import {createInterface} from "node:readline";

const scenario=process.env.FAKE_MCP_SCENARIO||"success";
const pidFile=process.env.FAKE_MCP_PID_FILE;

if(scenario==="cleanup_tree"&&pidFile){
 const helperScript=[
  "import {spawn} from 'node:child_process';",
  "const grandchild=spawn(process.execPath,['-e',\"process.on('SIGTERM',()=>{});setInterval(()=>{},1000);\"] ,{stdio:'ignore'});",
  "process.stdout.write(JSON.stringify({helper:process.pid,grandchild:grandchild.pid})+'\\n');",
  "process.on('SIGTERM',()=>{});",
  "setInterval(()=>{},1000);",
 ].join("");
 const helper=spawn(process.execPath,["--input-type=module","-e",helperScript],{
  stdio:["ignore","pipe","ignore"],
  env:{...process.env},
 });
 const helperPids=await new Promise((resolve,reject)=>{
  let text="";
  helper.stdout.setEncoding("utf8");
  helper.stdout.on("data",(chunk)=>{
   text+=chunk;
   const nl=text.indexOf("\n");
   if(nl===-1)return;
   try {
    resolve(JSON.parse(text.slice(0,nl)));
   } catch (err) {
    reject(err);
   }
  });
  helper.on("error",reject);
 });
 await appendFile(pidFile,`server:${process.pid}\n`);
 await appendFile(pidFile,`helper:${helperPids.helper}\n`);
 await appendFile(pidFile,`grandchild:${helperPids.grandchild}\n`);
}

const reader=createInterface({input:process.stdin,crlfDelay:Infinity});
function ok(id,result){process.stdout.write(JSON.stringify({jsonrpc:"2.0",id,result})+"\n");}
for await (const line of reader){
 let msg;
 try { msg=JSON.parse(line); } catch { continue; }
 if(msg.method==="initialize"){
  ok(msg.id,{serverInfo:{name:"fake-rea",version:"test"}});
  continue;
 }
 if(msg.method==="tools/list"){
  if(scenario==="malformed_reply"){
   process.stdout.write("NOT_JSON\n");
   continue;
  }
  const tools=scenario==="missing_tool"
   ? [{name:"binary_session",inputSchema:{}},{name:"inspect_apktool_client",inputSchema:{}}]
   : scenario==="duplicate_tool"
    ? [{name:"binary_session",inputSchema:{}},{name:"binary_session",inputSchema:{}},{name:"inspect_apktool_client",inputSchema:{}},{name:"inspect_adb_client",inputSchema:{}}]
    : [{name:"binary_session",inputSchema:{}},{name:"inspect_apktool_client",inputSchema:{}},{name:"inspect_adb_client",inputSchema:{}}];
  ok(msg.id,{tools});
  continue;
 }
 if(msg.method!=="tools/call")continue;
 const name=msg.params?.name;
 if(scenario==="premature_exit")process.exit(0);
 if(scenario==="failure_exit_status")process.exit(17);
 if(scenario==="timeout")continue;
 if(scenario==="tool_error"){
  ok(msg.id,{isError:true,content:[{type:"text",text:'{"status":"error","message":"boom"}'}]});
  continue;
 }
 if(name==="binary_session"){
  const version=scenario==="invalid_identity"?"6.8.1":"6.8.0";
  ok(msg.id,{structuredContent:{server_identity:{package:{name:"rea-agents",version},catalog:{counts:{mcp_tools:229}}},normalized_result:{result:{server_identity:{package:{name:"rea-agents",version}}}}}});
  continue;
 }
 if(scenario==="incomplete_evidence"){
  ok(msg.id,{structuredContent:{result:{client:{version:"1.0.0"}}}});
  continue;
 }
 ok(msg.id,{structuredContent:{normalized_result:{result:{client:{version:name+"-1.0.0"}}}}});
}
