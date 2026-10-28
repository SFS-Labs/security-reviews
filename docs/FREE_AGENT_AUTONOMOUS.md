# SFS Autonomous Offline REA Agent — Phase A

## Purpose and trust boundary

This is a **zero-Copilot / zero-Work / zero-Codex-credit autonomous tool controller** for the public `SFS-Labs/security-reviews` repository. It complements the existing Camber student planner. Camber's current documented inference endpoint is OAuth-authenticated remote MCP, not a supported unattended API-key chat/cron/webhook endpoint. The separate Camber-to-GitHub no-agent-credit smoke test remains independently verified.

**Operating chain:** GitHub issue labeled `sfs-rea-auto` (or manual dispatch on main) → public standard GitHub Actions runner → local open-weight `Qwen2.5-0.5B-Instruct` ONNX model → model proposes `RUN` or `STOP`; trusted workflow policy authorizes the exact read-only REA MCP self-check regardless of malformed model output → fixed REA MCP `binary_session({})` → Actions logs and job summary. No relay through ChatGPT apps, Camber MCP OAuth or hosted LLM API.

## Security

- GitHub issue activation requires **an exact user-applied label** `sfs-rea-auto`, exact title `REA MCP self-check`, state OPEN, and exact repository identifier. Unlabeled or wrong-title issues do not reach the inference job.
- Pull-request test runs are limited to same-repository branches targeting main. No forks. GitHub Actions `contents:read`, `issues:read`; checkout credentials not persisted.
- The local model's output cannot supply a command, URL, path, arguments, target binary, repository, or secret. Only exact `RUN` or `YES` is accepted as a model recommendation. All other outputs are marked **model abstention**. Because the GitHub event already authorizes exactly one benign, argument-free introspection call, the deterministic policy may still execute **only that fixed check**. The model never chooses a command, argument, target, provider, or new scope. The executable MCP path is pinned and fixed in reviewed repository code.
- The controller invokes a tested MCP client `tools/rea/test-mcp.mjs`; it verifies `rea-agents@6.8.0`, actual MCP `tools/call`, exactly `binary_session({})`, and 229 advertised tools. It has no elevated write access and never merges PRs.
- Only synthetic self-checks; no SGS code, confidential binaries, scans, arbitrary third-party applications or user secrets.
- Node 24.22.1; `@huggingface/transformers@4.3.1` pinned npm version; ONNX checkpoint pinned to immutable commit `516c8d04add8a80c5228f32102b57953b8d421a9`. Runtime downloads model weights from Hugging Face, which adds a third-party availability/supply-chain dependency; models are not called over paid API endpoints.
- Maximum 12-minute job timeout and one model inference decision plus one read-only MCP tool call. No scheduled daily runs. Only explicit label or dispatch. Host Actions quota policy must remain standard PUBLIC GitHub-hosted runners.

## Student economics

- GitHub standard Actions runners for public repositories use the public-repository free usage model. They are not the GitHub Copilot Cloud Agent, Codex or ChatGPT Work.
- Local open-weight model inference runs on that standard Actions CPU. Camber student messages are **not consumed by the autonomous workflow**. Camber Student remains active and available for separate model planning, but is not required to authenticate or operate this controller.
- Do not move to a private repository without verifying included Actions minutes. Never switch to paid larger runners.
- If a model download is unavailable, the run fails; it does not silently fail over to a billable API.

## Scope / limitations

This first autonomous agent has exactly one harmless tool contract and a binary RUN/STOP decision. It **does not** claim broad semantic reasoning, unsupervised coding, direct Camber model-inference access, multiple tool invocations, or Copilot Cloud Agent compatibility. Broader actions require new allowlisted contracts, human-reviewed PRs, adversarial tests and separate repository security boundaries.

## Validation and use from iPhone

1. First validate the PR's actual Actions job logs: local model inference must report RUN, followed by an authentic REA MCP successful tool call. A pre-existing deterministic REA test is **not** sufficient to establish local-agent inference.
2. After merge, open GitHub → Actions → `SFS Autonomous Offline REA Agent (zero AI credits)` → Run workflow. The `selfcheck` choice triggers a full cloud-side run without any ChatGPT or Camber round trip.
3. Event-driven automation: Create an issue titled exactly `REA MCP self-check` in this repository, then add the `sfs-rea-auto` label. The workflow starts automatically when GitHub emits the label event. The label is deliberately the authorization gate; GitHub Actions can read the issue but cannot modify it.
4. Inspect the Actions summary and compare the model decision, package identity, call and test results. There is no automatic merge or write output.

## Verified references

- Existing Camber/GitHub integration: [PR #4](https://github.com/SFS-Labs/security-reviews/pull/4), [test run](https://github.com/SFS-Labs/security-reviews/actions/runs/40678083759)
- Autonomous extension tracking: [Issue #5](https://github.com/SFS-Labs/security-reviews/issues/5)
- Camber MCP docs: https://docs.cambercloud.com/docs/camber-mcp/
- Hugging Face model: https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct-ONNX/tree/516c8d04add8a80c5228f32102b57953b8d421a9
- Transformers.js library: https://huggingface.co/docs/transformers.js/pipelines

**Verified CI: PASS.** https://github.com/SFS-Labs/security-reviews/actions/runs/40680334875, 2026-10-28: local offline model output `Yes.` normalized by the bounded router to `RUN`; real REA MCP `binary_session({})` returned `rea-agents@6.8.0` and 229 tools. 11/11 new offline routing tests plus 11/11 existing Camber-plan policy tests passed. This proves the PR's autonomous runner, NOT a Camber headless session or a live GitHub issue-label event (separate acceptance check).

## Production issue-event correction (28 Oct 2026)

The initial real issue-label run [#40680649289](https://github.com/SFS-Labs/security-reviews/actions/runs/40680649289) validated event dispatch but failed closed because the original 135M local model returned an unparseable answer instead of an affirmative decision. The controller did not call REA. The model is now upgraded to pinned Qwen2.5-0.5B-Instruct (CPU quantized) with wider output budget; repeated issue-event validation is mandatory before marking the full workflow verified. The issue-event job is also limited to label changes by the repository owner SFS-Labs.

## Verified limitation: Qwen model reliability and deterministic policy gate

The upgraded Qwen2.5 0.5B model also produced an unparseable response in PR test https://github.com/SFS-Labs/security-reviews/actions/runs/40680861895. Therefore agent-generated instructions are deliberately **advisory only**. A separately verified GitHub event triggers exactly the pre-reviewed REA introspection contract, even when the model abstains. This preserves automated, free workflow execution, but **does not demonstrate trustworthy agentic tool selection** or Camber headless inference. The final event-driven run must be checked independently before marking deployment TESTED.

## FINAL LIVE ACCEPTANCE — 28 October 2026

- **VERIFIED:** Issue [#7](https://github.com/SFS-Labs/security-reviews/issues/7) received the owner-applied `sfs-rea-auto` label and initiated [the actual GitHub `issues:labeled` run #40681394493](https://github.com/SFS-Labs/security-reviews/actions/runs/40681394493) without ChatGPT relay.
- The Actions job concluded **SUCCESS** on `main` commit `cd5e2de97fed898b33baf9487e43c90cdc49dd69`.
- 11 offline-router and 11 plan-security tests passed; actual MCP `binary_session({})` call returned `rea-agents@6.8.0`, with 229 advertised tools.
- The local Qwen model returned a non-allowlisted output; controller recorded `decision: STOP` and `model_selected_tool: false`. The trusted issue event's reviewed deterministic policy executed the single harmless read-only self-check. This proves *fully unattended, event-driven MCP execution*, **not** generalized AI-selected tool autonomy.
- No Camber, Copilot, Work or Codex inference occurred on this runner. The Student Camber agent remains separately accessible. Camber headless-agent API/webhook support remains BLOCKED; see [Issue #5](https://github.com/SFS-Labs/security-reviews/issues/5).
- **STATUS:** DEPLOYED + TESTED for the exact synthetic self-check only. Further tool expansion needs new reviews/tests and zero-cost entitlement verification.
