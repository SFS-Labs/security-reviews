#!/usr/bin/env node
import readline from 'node:readline';
import {writeFileSync} from 'node:fs';
if(process.env.FAKE_PID_FILE) writeFileSync(process.env.FAKE_PID_FILE,String(process.pid));
const scenario=process.env.FAKE_SCENARIO;
if(scenario==='stubborn'){process.on('SIGTERM',()=>{});setInterval(()=>{},1000);}
const names=['binary_session','inspect_apktool_client','inspect_adb_client'];
let calls=0;
readline.createInterface({input:process.stdin}).on('line',line=>{
 const msg=JSON.parse(line);
 if(!msg.id)return;
 if((scenario==='timeout'||scenario==='stubborn') && msg.method==='tools/list')return;
 if(scenario==='exit' && msg.method==='initialize')process.exit(7);
 if(scenario==='malformed' && msg.method==='initialize'){process.stdout.write('not json\n');return;}
 let result;
 if(msg.method==='initialize')result={serverInfo:{name:'fake'}};
 if(msg.method==='tools/list'){
  let tools=names.map(name=>({name,inputSchema:{type:'object'}}));
  if(scenario==='missing')tools.pop();
  if(scenario==='duplicate')tools.push(tools[0]);
  result={tools};
 }
 if(msg.method==='tools/call'){
  calls++;
  if(scenario==='incomplete' && calls===2)process.exit(8);
  if(scenario==='tool-error' && calls===2)result={isError:true,content:[{type:'text',text:'failure'}]};
  else if(msg.params.name==='binary_session')result={structuredContent:{server_identity:{package:{name:'rea-agents',version:scenario==='identity'?'0':'6.8.0'},catalog:{counts:{mcp_tools:229}}}}};
  else result={content:[{type:'text',text:'synthetic diagnostic'}]};
 }
 process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:msg.id,result})+'\n');
});
