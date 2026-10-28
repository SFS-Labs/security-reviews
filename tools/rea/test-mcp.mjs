/**
 * Deterministic stdio MCP smoke test for the repository's exact REA registration.
 * No Copilot inference, target inputs, secrets, or network scanning.
 */
import { spawn } from "node:child_process";
import { readFile, appendFile } from "node:fs/promises";
import { StringDecoder } from "node:string_decoder";

const config = JSON.parse(await readFile(new URL("../../docs/rea-copilot-mcp.json", import.meta.url), "utf8"));
const server = config.mcpServers?.rea;
if (server?.type !== "local" || server?.command !== "npx" ||
    JSON.stringify(server.args) !== JSON.stringify(["-y", "rea-agents@6.8.0", "mcp"])) {
  throw Error("Repository REA MCP registration has unexpected command or args.");
}

const child = spawn(server.command, server.args, {
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env, npm_config_audit: "false", npm_config_fund: "false" },
});
const decoder = new StringDecoder("utf8");
const pending = new Map();
let seq = 0;
let lines = "";
let stderr = "";
let stopped = false;
child.stderr.on("data", (chunk) => { stderr = (stderr + chunk.toString("utf8")).slice(-2500); });
child.on("error", (error) => {
  stopped = true;
  for (const p of pending.values()) { clearTimeout(p.timer); p.reject(error); }
  pending.clear();
});
child.on("exit", (code, signal) => {
  stopped = true;
  const error = Error("MCP server exited before expected response: " + code + "/" + signal
    + " stderr_tail=" + stderr.slice(-700));
  for (const p of pending.values()) { clearTimeout(p.timer); p.reject(error); }
  pending.clear();
});
child.stdout.on("data", (chunk) => {
  lines += decoder.write(chunk);
  if (lines.length > 32 * 1024 * 1024) {
    child.kill();
    console.error("MCP output exceeded safe parse limit");
    return;
  }
  for (;;) {
    const index = lines.indexOf("\n");
    if (index === -1) break;
    const line = lines.slice(0, index).trim();
    lines = lines.slice(index + 1);
    if (!line) continue;
    let message;
    try { message = JSON.parse(line); } catch {
      console.error("Unexpected non-JSON MCP stdout (contents suppressed)");
      child.kill();
      return;
    }
    if (!Object.hasOwn(message, "id")) continue;
    const p = pending.get(message.id);
    if (!p) continue;
    pending.delete(message.id);
    clearTimeout(p.timer);
    if (message.error) p.reject(Error(JSON.stringify(message.error).slice(0, 600)));
    else p.resolve(message.result);
  }
});
function send(payload) {
  if (stopped) throw Error("MCP server is no longer running");
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", ...payload }) + "\n");
}
function request(method, params, ms = 160000) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(Error("MCP request timed out: " + method));
    }, ms);
    pending.set(id, { resolve, reject, timer });
    send({ id, method, params });
  });
}
function extractBody(result) {
  if (result?.isError) throw Error("MCP tool returned isError=true (message suppressed)");
  const candidates = [result?.structuredContent, result?.structuredContent?.result];
  for (const item of result?.content || []) {
    if (item.type === "text" && item.text) {
      try {
        const obj = JSON.parse(item.text);
        candidates.push(obj, obj?.result);
      } catch { }
    }
  }
  return candidates.find((c) => c && typeof c === "object" && c.server_identity) || null;
}
try {
  const initialization = await request("initialize", {
    protocolVersion: "2025-06-18", capabilities: {},
    clientInfo: { name: "sfs-rea-mcp-e2e", version: "1.0.0" },
  });
  if (!initialization?.serverInfo?.name) throw Error("MCP initialize lacked serverInfo.name");
  send({ method: "notifications/initialized" });
  let cursor;
  let names = [];
  for (let page = 0; page < 20; page++) {
    const listing = await request("tools/list", cursor ? { cursor } : {});
    if (!Array.isArray(listing?.tools)) throw Error("MCP tools/list lacked tools");
    names = names.concat(listing.tools.map((t) => t.name));
    cursor = listing.nextCursor;
    if (!cursor) break;
    if (page === 19) throw Error("MCP tools/list pagination exceeded limit");
  }
  if (!names.includes("binary_session")) throw Error("REA binary_session is absent from MCP tools/list");
  const response = await request("tools/call", { name: "binary_session", arguments: {} }, 160000);
  const body = extractBody(response);
  if (!body) throw Error("MCP binary_session response lacked parseable server_identity");
  const pkg = body.server_identity.package;
  const counts = body.server_identity.catalog?.counts;
  if (pkg?.name !== "rea-agents" || pkg?.version !== "6.8.0") {
    throw Error("REA MCP returned unexpected package identity");
  }
  if (!Number.isInteger(counts?.mcp_tools) || counts.mcp_tools < 1) {
    throw Error("REA MCP catalog count absent or invalid");
  }
  console.log(JSON.stringify({
    verdict: "PASS", invocation: "actual MCP tools/call, not CLI",
    server: initialization.serverInfo.name, requested_tool: "binary_session",
    arguments: {}, package: pkg.name, version: pkg.version,
    advertised_tools: names.length, catalog_mcp_tools: counts.mcp_tools,
    time_utc: new Date().toISOString(), copilot_cloud_agent_proven: false,
  }, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY,
      "### REA MCP stdio protocol test: PASS\n\n" +
      "- Actual MCP tools/list and tools/call for binary_session({}) completed on a GitHub-hosted runner.\n" +
      "- Package: " + pkg.name + "@" + pkg.version + ".\n" +
      "- Advertised tools: " + names.length + "; reported catalog tools: " + counts.mcp_tools + ".\n" +
      "- This is NOT proof of a Copilot Cloud Agent session.\n");
  }
} catch (err) {
  console.error("REA MCP PROTOCOL TEST FAILED:", err.message);
  process.exitCode = 1;
} finally {
  child.kill("SIGTERM");
  child.stdin.end();
}
