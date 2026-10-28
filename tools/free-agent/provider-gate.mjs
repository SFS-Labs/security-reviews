/**
 * Fail-closed architectural provider gate.
 * This script does not call Camber, GitHub APIs, secrets, or remote inference.
 * Enabling Camber requires a separately reviewed implementation and E2E tests.
 */
import {readFile} from "node:fs/promises";
const configURL=new URL("../../config/free-agent-providers.json", import.meta.url);
const prodKeys=["executor","tool_authority","public_standard_runner_only","paid_inference_allowed","work_codex_copilot_inference_allowed"];
const camberKeys=["role","enabled","agent_tag","student_confirmed_by_owner","headless_inference_transport","headless_inference_verified","signed_delivery_verified","zero_cost_hard_ceiling_verified","unattended_e2e_verified","tool_selection_authority"];
function exactKeys(value,expected,label) {
 if(!value || typeof value!=="object" || Array.isArray(value) ||
   Object.keys(value).length!==expected.length ||
   expected.some(k=>!Object.hasOwn(value,k)) ||
   Object.keys(value).some(k=>!expected.includes(k))) {
     throw Error(label+": unknown or missing contract field");
 }
}
export function verifyProviderGate(c) {
 exactKeys(c,["schema_version","production","camber"],"root");
 if(c.schema_version!==1)throw Error("Unsupported provider contract version");
 exactKeys(c.production,prodKeys,"production");
 exactKeys(c.camber,camberKeys,"camber");
 const p=c.production, ca=c.camber;
 if(p.executor!=="github-actions" ||
    p.tool_authority!=="fixed-reviewed-contract" ||
    p.public_standard_runner_only!==true ||
    p.paid_inference_allowed!==false ||
    p.work_codex_copilot_inference_allowed!==false) {
    throw Error("Unreviewed or potentially billable production execution provider");
 }
 if(ca.role!=="optional-future-control-plane" ||
    ca.enabled!==false ||
    ca.agent_tag!=="@sfslabs46046859.sfs-rea-free-controller" ||
    ca.student_confirmed_by_owner!==true ||
    ca.headless_inference_transport!=="unavailable" ||
    ca.headless_inference_verified!==false ||
    ca.signed_delivery_verified!==false ||
    ca.zero_cost_hard_ceiling_verified!==false ||
    ca.unattended_e2e_verified!==false ||
    ca.tool_selection_authority!=="none") {
    throw Error("Camber headless provider must remain disabled until audited activation");
 }
 return Object.freeze({executor:p.executor,camber_enabled:false,paid_inference_allowed:false});
}
export async function readAndVerifyProviderGate(){
 const b=await readFile(configURL,"utf8");
 if(Buffer.byteLength(b,"utf8")>8192) throw Error("Provider config size limit exceeded");
 return verifyProviderGate(JSON.parse(b));
}
if(process.argv[1] && new URL("file://"+process.argv[1]).href===import.meta.url){
 const state=await readAndVerifyProviderGate();
 console.log("SFS_PROVIDER_GATE=PASS; executor="+state.executor+
   "; camber=disabled; unverified headless calls forbidden; paid-inference=false");
}
