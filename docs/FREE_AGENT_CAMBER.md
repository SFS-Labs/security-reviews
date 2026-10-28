# SFS Free-Agent Execution Layer — Camber + GitHub Actions + REA

## Evidence and status (28 October 2026)

- Repository: SFS-Labs/security-reviews (public). REA 6.8.0 actual MCP protocol smoke test: https://github.com/SFS-Labs/security-reviews/actions/runs/40674057791
- Connected Camber agent: @sfslabs46046859.sfs-rea-free-controller, a newly created private personal agent.
- The Camber agent produced a structured bounded plan, saved unchanged in substance as docs/free-agent/camber-smoke-20261028.json. It did NOT itself execute a REA MCP tool.
- GitHub Actions executes a single read-only binary_session({}) tool call using tools/rea/test-mcp.mjs. **TESTED (PASS):** GitHub Actions run https://github.com/SFS-Labs/security-reviews/actions/runs/40677874429 concluded SUCCESS. The log confirms Camber-approved task camber-smoke-20261028, real REA MCP binary_session({}) invocation, rea-agents@6.8.0, 229 advertised tools, and 11/11 plan and negative security tests passing. This is reproducible evidence for the bounded plan-to-MCP bridge; it is not proof of Copilot Cloud Agent or automated Camber API transport.
- This is a Camber-planned, GitHub-executed integration. It is not an autonomous coding agent, a fully automated Camber API handoff, or proof of GitHub Copilot Cloud Agent MCP access.

- **Hardened workflow confirmed PASS:** https://github.com/SFS-Labs/security-reviews/actions/runs/40678083759 — executed after restricting PR runs to trusted same-repository branches and manual runs to main; 11/11 tests pass; real binary_session({}) succeeded; REA 6.8.0, 229 tools.

## Cost boundaries

- The standard public-repository GitHub Actions runner used here does not consume GitHub AI Credits, ChatGPT Work or Codex quotas. No paid larger runners.
- No external AI inference is performed on Actions. The separately connected Camber planning message uses Camber's own entitlement.
- Official GitHub Student Developer Pack offer: free Camber Student while enrolled (40 CPU hours, 5 GPU hours, 50 GB, 50 agent messages per month). Account-specific Student activation and remaining balances cannot be read through the connected Camber MCP tools: verify before scaling, do not purchase overages.
- Free Cloudflare Workers AI is not needed for this phase. No credit-card or billing setting is changed.
- Hard GitHub workflow timeout: 8 minutes; one approved MCP call, no automatic merge.

## Controls

- tools/free-agent/validate-plan.mjs parses the entire plan against a strict fixed allowlist: backend camber, tool binary_session, exact empty arguments, one call, public-synthetic input, REA 6.8.0, and requires_human_confirmation=true.
- The reviewed workflow pins SFS_FREE_AGENT_APPROVED to camber-smoke-20261028; no other task ID may execute.
- tools/free-agent/test-validate-plan.mjs checks valid plans and adversarial negative cases.
- The runner uses only the fixed local tools/rea/test-mcp.mjs code path. It cannot execute model-supplied shell commands, paths, URLs or binaries.
- Workflow permissions are contents:read, checkout does not persist credentials. No secrets, no private target artifacts, no automated PR merges.
- Copilot Cloud Agent remains BLOCKED by GitHub AI Credit session admission. This pipeline is a distinct alternative, not a claim that Copilot works.

## iPhone operating procedure

1. Request a bounded read-only plan from the connected Camber agent.
2. Review the generated plan and approve the fixed task identifier before any runner executes.
3. Commit that reviewed plan through a branch/PR; Actions validates it and performs the permitted REA call.
4. Inspect the actual GitHub Actions job log and report evidence. All later tool/argument expansions require reviewed code and security tests.

## Next stage

A more autonomous platform needs an authenticated, supported Camber API-to-GitHub transport, an independently verified free student entitlement with hard quota behavior, and a reviewed finite-state tool-allowlist. This is NOT claimed implemented in this PR.
