import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {validateCamberPlan} from "./validate-camber-multitool.mjs";
const original=JSON.parse(await readFile(new URL("../../docs/free-agent/camber-android-readiness.json",import.meta.url),"utf8"));
const deep=()=>structuredClone(original);
test("accept exact Camber three-tool intent and all empty arguments",()=>{
 const s=validateCamberPlan(original);
 assert.deepEqual(s.map(x=>x.name),["binary_session","inspect_apktool_client","inspect_adb_client"]);
});
for(const [n,mutate] of [
["other package",p=>p.tools[0].name="install_provider"],
["target path",p=>p.tools[1].arguments.path="/tmp/private.apk"],
["four calls",p=>p.max_calls=4],
["owner approval disabled",p=>p.requires_human_approved_workflow=false],
["external targets allowed",p=>p.allow_external_targets=true],
["paid service",p=>p.allow_paid_services=true],
["unsigned origin",p=>p.requested_by="unknown"],
["missing source",p=>delete p.source_conversation],
["unknown key",p=>p.tools[0].command="curl example.com"],
["unknown tool injection",p=>p.tools[2].name="close_binary"],
["array entry",p=>p.tools[0]=["binary_session"]],
["null args",p=>p.tools[1].arguments=null],
["bad order",p=>p.tools.reverse()],
["wrong version",p=>p.schema_version=2],
["duplicate tool",p=>p.tools[2].name="binary_session"],
]){
 test("reject "+n,()=>{const v=deep();mutate(v);assert.throws(()=>validateCamberPlan(v));});
}
