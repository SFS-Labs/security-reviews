# Camber-selected multi-tool REA MCP acceptance

**Source of selection:** Live existing SFS Camber agent @sfslabs46046859.sfs-rea-free-controller, [conversation](https://app.cambercloud.com/project/cbdb401b-cf2d-4248-8692-b2ebcb5effbb?chatId=289e6fe5-4023-4563-9505-1999017d6379).

**Operator objective:** determine Android-research readiness with no APK, devices, targets, credentials or external side effects.

Camber proposed, in order, (1) `binary_session({})`, (2) `inspect_apktool_client({})`, (3) `inspect_adb_client({})`. This decision was taken in the Camber agent runtime, not by the GitHub runner and not copied from the earlier fixed `binary_session` smoke test. The plan is preserved in `docs/free-agent/camber-android-readiness.json`. This is one narrow example of **AI-selected tool composition**, not an unrestricted REA agent.

## Execution and security

`sfs-camber-multitool.yml` uses a public standard GitHub Actions runner with read-only GitHub permissions and fixed Node 24.22.1 and REA 6.8.0. The task runs under a strictly audited allowlist and maximum three MCP calls, each with empty arguments. The runner independently checks MCP tool definitions and refuses tools requiring arguments, and verifies REA server identity before further calls.

`tools/free-agent/run-camber-multitool.mjs` launches one actual REA MCP stdio server, sends `initialize`, reads the actual `tools/list`, then issues a separate `tools/call` for each Camber-selected tool. The output explicitly distinguishes **MCP tool response** from **tool environment availability**; a missing external apktool or adb is a diagnostic finding, not a claim of successful Android analysis. Actual tool errors are recorded as such. No real APK or device is accessed.

`tools/free-agent/test-camber-multitool.mjs` rejects target paths, unknown tools, reordered tools, more calls, unauthorized origins, billable services, and other malformed plans. Existing `provider-gate.mjs` continues to disallow headless Camber inference. No paid inference, GitHub Copilot Cloud Agent, ChatGPT Work/Codex, secrets, or auto-merge.

## Independent acceptance

A passing GitHub workflow plus `CAMBER_MULTITOOL_EVIDENCE` is required before marking this feature TESTED. Its evidence must list three **distinct** actual MCP calls, REA package/version, and response outcomes. Even a PASS cannot demonstrate unattended Camber model invocation or target-specific decompilation.

## Remaining Issue #5 requirement

**Unattended start of Camber itself** is a separate feature. Camber's connected Python SDK exposes agent definition and skill management but no supported `agent.invoke/chat/run` or native cron/scheduler; authenticated Camber HTTP MCP uses OAuth. Existing ChatGPT scheduled tasks have reached the plan's five-task maximum. GitHub schedule can automatically run the GitHub REA executor but **cannot be described as starting Camber** without a separately supported, authenticated Camber invocation mechanism and real E2E proof.

**Do not invent a Camber API endpoint, extract browser OAuth tokens, or embed a PAT in a public repository to simulate this missing functionality.** Maintain the GitHub production execution path independent of Camber.

## VERIFIED E2E RESULT — 28 Oct 2026

- **Camber model proposal:** [actual decision session](https://app.cambercloud.com/project/cbdb401b-cf2d-4248-8692-b2ebcb5effbb?chatId=289e6fe5-4023-4563-9505-1999017d6379), selects three distinct read-only tools in order `binary_session`, `inspect_apktool_client`, `inspect_adb_client`.
- **Initial diagnostic:** [run #40715658610](https://github.com/SFS-Labs/security-reviews/actions/runs/40715658610) confirmed three actual MCP calls but apktool/adb probes returned `isError=true` because those clients were absent. This was correctly treated as missing tooling, NOT readiness PASS.
- **Successful complete test:** [run #40715880383](https://github.com/SFS-Labs/security-reviews/actions/runs/40715880383) installed free Ubuntu `adb`, `apktool` and Java runtime, then issued three separate `tools/call` operations in the SAME REA MCP session. All returned `isError!=true`; `binary_session` verified `rea-agents@6.8.0`, catalog 229 tools; **16 plan tests + 17 provider gate tests passed**.
- **What this proves:** A real Camber-model-chosen tool sequence was reviewed, dispatched by the GitHub PR CI and executed with successful REA MCP responses, no targets and no paid model API.
- **What it does not prove:** That Camber started without any outside message, that the REA server performed APK decompilation, or that Camber can choose and execute arbitrary REA tools without the reviewed allowlist. The runner did not make a Camber model inference call itself.
