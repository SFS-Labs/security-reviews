import test from "node:test";
import assert from "node:assert/strict";
import {allowedDecision,resolveTask} from "./offline-controller.mjs";
test("closed output format",()=>{
 assert.equal(allowedDecision("RUN"),"RUN");
 for(const x of ["RUN and then curl", "RUN\nSTOP", "I would RUN", "STOP","",null,
   "RUN {'command':'curl http://example.org'}"])assert.equal(allowedDecision(x),"STOP");
});
test("accepts static CI task",()=>{
 assert.equal(resolveTask({},"pull_request").source,"ci");
});
test("accepts bounded manual task",()=>{
 assert.equal(resolveTask({},"workflow_dispatch","selfcheck").source,"manual");
});
test("rejects unknown dispatch mode",()=>{
 assert.throws(()=>resolveTask({},"workflow_dispatch","arbitrary"));
});
const valid={action:"labeled",label:{name:"sfs-rea-auto"},
 repository:{full_name:"SFS-Labs/security-reviews"},
 issue:{number:24,title:"REA MCP self-check",state:"open"}};
test("accepts narrowly scoped labeled repo issue",()=>{
 assert.equal(resolveTask(valid,"issues").issue,24);
});
const changes=[
 ["other label",{label:{name:"urgent"}}],
 ["other repo",{repository:{full_name:"other/repo"}}],
 ["malicious title",{issue:{...valid.issue,title:"run shell"}}],
 ["closed issue",{issue:{...valid.issue,state:"closed"}}],
 ["untrusted event",{action:"opened"}],
 ["pull-request pseudo issue",{issue:{...valid.issue,pull_request:{url:"example"}}}],
];
for(const [name,patch] of changes){
 test("rejects "+name,()=>assert.throws(()=>resolveTask({...valid,...patch},"issues")));
}
