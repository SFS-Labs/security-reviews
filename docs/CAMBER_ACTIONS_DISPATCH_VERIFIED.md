# Camber → GitHub Actions → REA MCP: Verified direct dispatch

**Evidence date:** 28 October 2026. **Camber-initiated execution: VERIFIED.** The existing private Camber agent initiated the real GitHub Actions workflow using its fine-grained GitHub token's **Actions: Read and write** permission.

## Verified E2E chain

1. Camber agent `@sfslabs46046859.sfs-rea-free-controller` connected through its own `camber.github.connect()` Python SDK. This does not expose the user's GitHub token to ChatGPT or to GitHub repositories.
2. It obtained workflow `sfs-autonomous-rea.yml` in **only** `SFS-Labs/security-reviews`, then sent exactly one PyGithub API call:
   `workflow.create_dispatch(ref="main", inputs={"task":"selfcheck"})`.
3. GitHub API accepted the dispatch (`True`); live Camber session: https://app.cambercloud.com/project/9994975e-e24e-4060-a949-19e858b05b12?chatId=03660567-3785-4e30-9a2e-b1d84e9356ae .
4. GitHub created and completed [workflow_dispatch Actions run #40695671435](https://github.com/SFS-Labs/security-reviews/actions/runs/40695671435) **SUCCESS**. Independent GitHub job logs report **39 passing tests** (11 routing + 11 plan + 17 provider); read-only REA MCP `binary_session({})` **PASS**, npm package `rea-agents@6.8.0`, 229 advertised tools.
5. The locally executed Qwen model on the Actions runner returned `STOP`; the exact, owner-authorized read-only self-check executed through the deterministic fallback. This does **not** prove genuine multi-tool model selection or a Camber-agent scheduler.

## Actual token rights: corrected

User-provided GitHub Fine-grained PAT scope screenshot establishes:
- Single repository `SFS-Labs/security-reviews`.
- **Actions: Read and write** (sufficient for `workflow_dispatch`).
- **Issues: Read-only**; adding an issue label returns HTTP 403, as previously observed.
- Repository contents/administration/PR read-only.
- No GitHub user-level permissions.

**No permission changes are needed for the current direct-dispatch route.** The earlier instruction to grant `Issues:write` applies only to the inferior issue-label workaround and is now superseded. Do not broaden the PAT, regenerate it unnecessarily, or post credentials in chat or CI.

## Reusable Camber Skill

Source file `tools/camber/rea_actions_dispatch_skill.py` provides a fixed, narrowly scoped, on-demand `dispatch_rea_selfcheck()` method. It makes exactly one accepted-write operation against `workflow_dispatch` on `main` with task `selfcheck`, checks repository/workflow identity, and fails on any API error. It cannot accept arbitrary LLM-generated paths, task names, shell commands, binary targets, or parameters.

Offline tests: `tools/camber/test_rea_actions_dispatch_skill.py`; coverage includes exact allowed call, changed repository or branch, disabled workflow, 403, non-True results and no retries. GitHub Actions CI `.github/workflows/camber-rea-skill.yml`.

**Status: ACTIVE in Camber, CI PASS.** The existing Camber agent registered the reusable native Skill `sfs-rea-actions-dispatch` (ID `89d36432-9f1d-4011-b544-5d66846bdc9b`) with the official Camber skill registry on 28 October 2026. [Registration evidence](https://app.cambercloud.com/project/f600c6b2-abee-42d3-b422-a11b908ca318?chatId=faee481f-7817-4aa8-9c03-4bb1d2b709e9). The registered Skill has **not yet been invoked** (no duplicate dispatch); the preceding direct Camber Python API call already proved the same fixed E2E route in run #40695671435. The Git-tracked reference and runtime-registered Python file were independently created and are not certified byte-for-byte identical. GitHub [CI run #40696093045](https://github.com/SFS-Labs/security-reviews/actions/runs/40696093045) passed **15/15 offline Python tests**.

## Operating model

- Production GitHub REA runner continues independently of Camber.
- The user can ask the connected Camber agent to perform the **explicitly authorized bounded** REA self-check. Camber initiates GitHub Actions without an Issues-write token.
- Camber itself is an authenticated **on-demand control plane**, not a self-starting unattended scheduler. Do not confuse a ChatGPT-triggered Camber action with an autonomous timer or webhook.
- Camber's broader proprietary or confidential binary analysis is out of scope in this public repository. No automatic merges; no paid inference or premium coding agents; use standard public repository runners.

## Follow-up

Issue #5 remains open **only** for a supported unattended Camber trigger and independently authorized, semantically chosen multi-tool workflows. The direct Camber → GitHub Actions → REA read-only end-to-end acceptance is complete. The unsupported label-based dispatch method and issue #12 can remain a historical, unused test.
