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
