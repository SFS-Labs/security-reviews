import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {verifyProviderGate} from "./provider-gate.mjs";
const valid=JSON.parse(await readFile(new URL("../../config/free-agent-providers.json",import.meta.url),"utf8"));
const clone=()=>structuredClone(valid);
test("production free runner and disabled Camber contract passes",()=>{
  const status=verifyProviderGate(valid);
  assert.equal(status.executor,"github-actions");
  assert.equal(status.camber_enabled,false);
  assert.equal(status.paid_inference_allowed,false);
});
for (const [label,mutation] of [
  ["Camber silently activated",c=>c.camber.enabled=true],
  ["Camber tool authority enabled",c=>c.camber.tool_selection_authority="unrestricted"],
  ["unverified Camber API guess",c=>c.camber.headless_inference_transport="https://unknown.example/api"],
  ["Camber auth claimed verified",c=>c.camber.headless_inference_verified=true],
  ["signed delivery falsely claimed",c=>c.camber.signed_delivery_verified=true],
  ["zero-cost limit falsely claimed",c=>c.camber.zero_cost_hard_ceiling_verified=true],
  ["unattended E2E falsely claimed",c=>c.camber.unattended_e2e_verified=true],
  ["future provider made production",c=>c.production.executor="camber"],
  ["paid inference",c=>c.production.paid_inference_allowed=true],
  ["premium agent usage",c=>c.production.work_codex_copilot_inference_allowed=true],
  ["paid or larger runner",c=>c.production.public_standard_runner_only=false],
  ["unknown instructions",c=>c.camber.shell_command="curl external.example"],
  ["unknown root key",c=>c.secret="not-allowed"],
  ["missing cost guard",c=>delete c.production.paid_inference_allowed],
  ["wrong tag",c=>c.camber.agent_tag="attacker"],
  ["wrong schema version",c=>c.schema_version=2]
]){
  test("reject "+label,()=>{
    const v=clone();
    mutation(v);
    assert.throws(()=>verifyProviderGate(v));
  });
}
