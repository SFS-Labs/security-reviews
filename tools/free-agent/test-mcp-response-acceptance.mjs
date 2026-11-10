import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyMcpToolReply, assertCompleteCamberEvidence } from './mcp-response-acceptance.mjs';
const reply = { isError: false, content:[{type:'text',text:'{"status":"ok"}'}] };
const plan = ['binary_session','inspect_apktool_client','inspect_adb_client'];
const successful = plan.map((tool)=>({tool,args:{},mcp_response_received:true,outcome:'REPLIED',duration_ms:2,identity:tool==='binary_session'?'rea-agents@6.8.0':null}));
test('genuine MCP reply accepted',()=>assert.doesNotThrow(()=>verifyMcpToolReply('inspect_adb_client',reply)));
for (const [name,bad] of [
 ['isError true',{isError:true,content:[{type:'text',text:'tool failed'}]}],
 ['null result',null],
 ['missing result',undefined],
 ['string result','ok'],
 ['malformed isError',{isError:'false',content:[]}],
 ['no content',{isError:false}],
 ['empty content',{isError:false,content:[]}],
 ['no textual or structured evidence',{content:[{type:'image',data:'x'}]}],
 ['error object',{error:{message:'bad'},content:[{type:'text',text:'ok'}]}],
])test('reject '+name,()=>assert.throws(()=>verifyMcpToolReply('inspect_adb_client',bad)));
test('three unique successful tool calls with identity accepted',()=>assert.doesNotThrow(()=>assertCompleteCamberEvidence(plan,successful)));
for (const [name,change] of [
 ['tool-reported error',r=>r[1].outcome='TOOL_REPORTED_ERROR'],
 ['missing call',r=>r.pop()],
 ['duplicate call',r=>r[2].tool='inspect_apktool_client'],
 ['wrong order',r=>r.reverse()],
 ['false MCP transport',r=>r[0].mcp_response_received=false],
 ['wrong identity',r=>r[0].identity='rea-agents@9'],
 ['extra target argument',r=>r[2].args={path:'/tmp/target'}],
]) test('evidence rejects '+name,()=>{const r=structuredClone(successful); change(r);assert.throws(()=>assertCompleteCamberEvidence(plan,r));});
