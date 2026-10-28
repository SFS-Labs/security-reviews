import { readFile } from "node:fs/promises";

const REQUIRED = [
  "schema_version", "task_id", "backend", "tool", "arguments",
  "requires_human_confirmation", "maximum_tool_calls",
  "expected_identity_package", "expected_identity_version", "privacy",
  "evidence_requirements", "warnings",
];
const EXPECTED = new Set(REQUIRED);

export function validatePlan(plan) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) throw Error("Plan must be a JSON object.");
  const keys = Object.keys(plan);
  if (keys.length !== REQUIRED.length || keys.some(k => !EXPECTED.has(k))) {
    throw Error("Unexpected or missing plan fields (fail closed).");
  }
  if (plan.schema_version !== 1) throw Error("Unsupported plan schema.");
  if (typeof plan.task_id !== "string" ||
      !/^camber-[a-z0-9-]{8,64}$/.test(plan.task_id)) throw Error("Invalid Camber task ID.");
  if (plan.backend !== "camber") throw Error("Only Camber plans are supported.");
  if (plan.tool !== "binary_session") throw Error("Tool not in read-only allowlist.");
  if (!plan.arguments || typeof plan.arguments !== "object" || Array.isArray(plan.arguments) ||
      Object.keys(plan.arguments).length !== 0) throw Error("binary_session requires exact {} arguments.");
  if (plan.requires_human_confirmation !== true) throw Error("Human authorization must be required.");
  if (plan.maximum_tool_calls !== 1) throw Error("One MCP tool call maximum.");
  if (plan.expected_identity_package !== "rea-agents" ||
      plan.expected_identity_version !== "6.8.0") throw Error("Expected REA package identity mismatch.");
  if (plan.privacy !== "public-synthetic") throw Error("Only public synthetic inputs allowed.");
  for (const prop of ["evidence_requirements", "warnings"]) {
    if (!Array.isArray(plan[prop]) || plan[prop].length > 16 ||
        plan[prop].some(x => typeof x !== "string" || x.length > 500)) {
      throw Error("Invalid non-executable plan annotations.");
    }
  }
  return Object.freeze({task_id:plan.task_id,tool:"binary_session",arguments:Object.freeze({}),
    backend:"camber",expected_identity_package:"rea-agents",expected_identity_version:"6.8.0"});
}

export async function loadPlan(filePath) {
  const raw = await readFile(filePath, "utf8");
  if (Buffer.byteLength(raw, "utf8") > 12000) throw Error("Plan too large.");
  return validatePlan(JSON.parse(raw));
}
