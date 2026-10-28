/**
 * Camber-planned, GitHub-executed bounded runner.
 * Fixed tool allowlist, no arbitrary shell commands from agent output.
 */
import { spawnSync } from "node:child_process";
import { appendFile } from "node:fs/promises";
import { loadPlan } from "./validate-plan.mjs";

const plan = await loadPlan(new URL("../../docs/free-agent/camber-smoke-20261028.json", import.meta.url));
if (process.env.GITHUB_ACTIONS !== "true") throw Error("Approved runner only available in GitHub Actions.");
if (process.env.SFS_FREE_AGENT_APPROVED !== "camber-smoke-20261028" ||
    plan.task_id !== process.env.SFS_FREE_AGENT_APPROVED) {
  throw Error("Per-task authorization does not match the approved plan.");
}
const p = spawnSync(process.execPath, ["tools/rea/test-mcp.mjs"], {
  encoding: "utf8", timeout: 240000, maxBuffer: 1024 * 1024,
  env: { ...process.env, SFS_ALLOWLISTED_TASK: plan.task_id },
});
if (p.error || p.status !== 0 || p.signal) {
  throw Error("MCP process failed: "+(p.error?.message || "exit "+p.status+" signal "+p.signal));
}
let proof;
try { proof=JSON.parse(p.stdout.trim()); }
catch { throw Error("MCP proof is not valid JSON."); }
if (proof.verdict !== "PASS" || proof.invocation !== "actual MCP tools/call, not CLI" ||
    proof.requested_tool !== plan.tool || Object.keys(proof.arguments || {}).length !== 0 ||
    proof.package !== plan.expected_identity_package ||
    proof.version !== plan.expected_identity_version ||
    proof.copilot_cloud_agent_proven !== false ||
    !Number.isInteger(proof.advertised_tools) || proof.advertised_tools < 1) {
  throw Error("The real MCP tool call does not match the Camber plan.");
}
const evidence = {
  verdict:"PASS",mode:"camber-plan-to-github-actions-readonly-executor",
  task_id:plan.task_id,selected_tool:plan.tool,arguments:{},
  actual_mcp_tool_call:true,actual_camber_inference:true,
  camber_direct_mcp_tool_call:false,copilot_cloud_agent_proven:false,
  identity:proof.package+"@"+proof.version,
  advertised_tools:proof.advertised_tools,utc_time:proof.time_utc,
};
console.log(JSON.stringify(evidence,null,2));
if(process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY,
    "### SFS Free-Agent: Camber plan to REA MCP - PASS\n\n" +
    "- Actual read-only MCP call: binary_session({})\n" +
    "- Task: "+plan.task_id+"\n" +
    "- Package: "+proof.package+"@"+proof.version+"\n" +
    "- Tools advertised: "+proof.advertised_tools+"\n" +
    "- Not proven: Copilot Cloud Agent or automated Camber-GitHub transport.\n");
}
