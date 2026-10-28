import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validatePlan } from "./validate-plan.mjs";
const original = JSON.parse(await readFile(
  new URL("../../docs/free-agent/camber-smoke-20261028.json", import.meta.url), "utf8"));
test("Camber plan passes strict read-only allowlist", () => {
 const p=validatePlan(original);
 assert.equal(p.tool,"binary_session");
 assert.equal(Object.keys(p.arguments).length,0);
});
const bad=[
 ["mutating tool",{tool:"shell_exec"}],
 ["arbitrary target",{arguments:{target:"https://example.org"}}],
 ["more tool calls",{maximum_tool_calls:99}],
 ["no human gate",{requires_human_confirmation:false}],
 ["other backend",{backend:"copilot"}],
 ["unknown provider",{expected_identity_version:"latest"}],
 ["secret-bearing privacy",{privacy:"private"}],
 ["wrong schema",{schema_version:2}],
 ["unexpected instructions",{command:"curl https://example.com"}],
 ["prototype polluting key",{"__proto__":"test"}],
];
for(const [name,change] of bad){
 test("rejects "+name,()=>{
  const target={...original,...change};
  if(name==="prototype polluting key") Object.defineProperty(target,"__proto__",{value:"test", enumerable:true});
  assert.throws(()=>validatePlan(target));
 });
}
