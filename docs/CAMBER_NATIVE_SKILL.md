# Camber-native REA read-only skill

**Status:** Git-tracked implementation, awaiting separate verification and Camber skill registration.

## What is actually connected

The private Camber agent `@sfslabs46046859.sfs-rea-free-controller` is authenticated through the connected Camber MCP app. The agent's **own runtime** (not ChatGPT's GitHub token) successfully called `camber.github.connect()`, `get_repo("SFS-Labs/security-reviews")`, checked the main branch SHA and read `docs/FREE_AGENT_CAMBER.md`. This establishes read-only repository access inside Camber. No PAT is stored in this repository.

## Bounded native Python Skill

Source: [rea_status_skill.py](../tools/camber/rea_status_skill.py). Execute `read_rea_status()` in Camber's Python code environment with the *existing Camber GitHub connector*. It reads only:
- `SFS-Labs/security-reviews` main branch,
- `config/free-agent-providers.json` (checks that the Camber provider is still disabled),
- three recent executions of the `sfs-autonomous-rea.yml` workflow.

It produces short JSON evidence and **does not** issue repository writes, label changes, Actions dispatches, external network requests, REA MCP calls, or shell commands. The output says `rea_mcp_called: false` explicitly.

This is a replaceable Camber-side observation capability, not the final autonomous REA executor.

## GitHub scope correction

Previous guidance claiming `repository_dispatch` requires **Actions:write** was incorrect. Per [GitHub REST docs](https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#create-a-repository-dispatch-event):
- `repo.create_repository_dispatch(...)` requires **Contents:write**.
- `workflow_dispatch` (Actions `workflow.create_dispatch`) requires **Actions:write**.
- Our existing `issues:labeled` gate can be triggered via a specific issue label operation using **Issues:write**. This is a narrower repository-content attack surface and is preferred for a Camber-to-GitHub executor adapter, but still requires separate explicit permission from the owner if the current PAT has Issues:read.

The GitHub connector's presence and an SDK method's existence do **not** prove permission to write. Never infer write access from a successful GET.

## Future E2E gate

(1) Verify native Camber skill installation and actual call, (2) select the supported dispatch primitive and obtain only its minimal permission, (3) bound payloads, replay nonce and expiry, strict schema plus per-run quotas, (4) perform a Camber-initiated, authenticated, synthetic GitHub Actions call and verify its actual REA MCP tool result, (5) keep the future unattended Camber scheduler separate until supported, and (6) confirm no paid overage and no Work/Codex/Copilot agent credits.

Decision and tracking: [ADR-005](architecture/ADR-005-CAMBER-OPTIONAL-CONTROL-PLANE.md) and [Issue #5](https://github.com/SFS-Labs/security-reviews/issues/5).

## Live Camber Skill verification — 28 October 2026

- Camber's personal agent `@sfslabs46046859.sfs-rea-free-controller` registered reusable Skill **`sfs-rea-github-readonly`**, Camber Skill ID `e0869050-f127-4cd3-b4c1-b872ee2fc860`, status ACTIVE.
- The Camber agent invoked its registered Python skill and obtained the repository HEAD SHA `7a772052c869a37ff7d2e59168995d7176552df9` and successful workflow run [#40683007685](https://github.com/SFS-Labs/security-reviews/actions/runs/40683007685).
- Evidence: [live Camber skill registration and invocation](https://app.cambercloud.com/project/d3bf21bb-5455-4f3a-ac12-c4ba5db3b5cc?chatId=657b7379-2adf-4cd9-af90-f77e73229502).
- Git-tracked reference implementation independently passed offline CI: [Actions run #40690228810](https://github.com/SFS-Labs/security-reviews/actions/runs/40690228810). Camber's registered script is a separate native resource; byte-for-byte identity with Git-tracked reference was not independently established.
- This proves Camber-native **read-only observation**. The Camber-agent-to-Actions write/dispatch permission and truly unattended Camber agent invocation are still distinct acceptance gates.
