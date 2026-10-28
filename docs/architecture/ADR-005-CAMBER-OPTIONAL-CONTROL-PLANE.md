# ADR-005: Camber as optional future SFS control plane

**Decision date:** 2026-10-28
**Status:** ACCEPTED (architectural decision); Camber headless integration BLOCKED
**Scope:** Phase A of SFS AI Development, repository `SFS-Labs/security-reviews`.

## Decision

Keep the **VERIFIED GitHub Actions / deterministic REA MCP executor** as the production foundation. Hold the existing private Camber Student agent `@sfslabs46046859.sfs-rea-free-controller` as an **optional, disabled, replaceable control-plane provider**. Do **not** make Camber a startup dependency, require interactive OAuth in CI, or pretend that its supported MCP agent chat is a headless API.

The user has confirmed that **Camber Student is active**. This is not evidence of unlimited usage, non-interactive agent inference or hard payment blocking; those are distinct requirements.

## Evidence (actual state, not aspiration)

- GitHub issue event #7 → successful standard runner #40681394493 → real REA `binary_session({})` response, package `rea-agents@6.8.0`, 229 tools, 22 validation tests.
- The local Qwen model **abstained** in that run and the pre-authorized deterministic allowlist executed the exact harmless MCP self-check. This verifies **unattended automation**, not trustworthy free-form model tool selection.
- Camber agent `@sfslabs46046859.sfs-rea-free-controller` successfully supplied a bounded plan; GitHub verified the reviewed plan through #40678083759.
- Camber's publicly documented HTTP MCP interface supports `agents_chat` through an OAuth sign-in. Its documented `camber agent` CLI commands cover pull/update/push, not headless conversational inference. No supported signed Camber→GitHub outbound webhook or CI-compatible headless OAuth credentials were verified.
- Documentation consulted: https://docs.cambercloud.com/docs/camber-mcp/ and https://docs.cambercloud.com/docs/camber-cli/agent/ and https://docs.cambercloud.com/docs/camber-cli/login/ .

## Immutable default / kill-switch

`config/free-agent-providers.json` is the versioned, reviewable provider declaration. It explicitly fixes:

- `production.executor = github-actions`
- `production.tool_authority = fixed-reviewed-contract`
- `production.public_standard_runner_only = true`
- `production.paid_inference_allowed = false`
- `production.work_codex_copilot_inference_allowed = false`
- `camber.enabled = false`
- `camber.headless_inference_transport = unavailable`
- `camber.tool_selection_authority = none`

`tools/free-agent/provider-gate.mjs` validates the entire schema and refuses to run if any unreviewed provider or inference permission is enabled. The production workflow checks this before installing model/runtime dependencies. `tools/free-agent/test-provider-gate.mjs` supplies both positive and adversarial checks.

**This is a fail-closed configuration contract, not a functional Camber transport adapter.** Simply flipping JSON booleans must never activate Camber; implementing a transport requires a separate reviewed code change.

## Activation requirements (all mandatory)

1. **Supported headless transport:** Official Camber documentation or a first-party written confirmation specifying a headless chat/inference API or webhook, documented supported authentication, service terms, and revocation/recovery behavior.
2. **Provable zero-cost policy:** Explicit Student free allowance and a reliable *hard fail-before-charge* boundary, not merely an estimate or billing alert. Check rate, session, storage and CPU/GPU limits.
3. **Minimal permissions:** Only specific Camber agent tag and dedicated one-way task submission; no GitHub admin scope, repository write token in the Camber prompt, or general-purpose browser cookies.
4. **Authenticated delivery:** Short-lived signed payload (issuer, audience, timestamp/expiry, task_id, nonce); replay protection with atomic store, expiration and rate limits. Store signing material only in GitHub/Cloudflare protected secrets.
5. **Tool isolation:** Strict typed action allowlist with independent input schema, maximum calls, CPU time and privacy classification. No model-generated shell, workflow edits, secrets, unapproved external targets or automatic merges.
6. **True model-selected E2E proof:** Camber autonomously selects an allowed tool; a supported headless Camber API delivers the plan; an independently verified GitHub-hosted runner authorizes and calls the real REA MCP tool. Log actual tool call evidence, distinguish model recommendation from deterministic fallback.
7. **Migration gates:** Separate Draft PR, hostile test suite, one canary, kill-switch, and rollback. No unapproved costs, SGS repository or confidential binaries.

## Non-goals in this release

No Camber API key storage, undocumented OAuth or private endpoints, paid LLM fallback, new cloud subscription, blanket `tools: ["*"]` authority on the production runner, or changes to SGS.

## Lifecycle and ownership

- **NOW:** Production stays `github-actions`. Camber is a private optional capability, DISABLED for unattended calls.
- **TRIGGER:** Reevaluate only when a *documented supported* Camber transport and zero-cost guard become available; do not spend credits on continuous checks.
- **THEN:** Implement and test the optional Camber adapter in its own PR. Require objective PASS before changing production.
- **ROLLBACK:** Config continues to hard-fail closed on any unauthorized Camber activation.

**Tracking:** https://github.com/SFS-Labs/security-reviews/issues/5

**Cross-chat reusability:** This decision supersedes designs making proprietary or public workflow execution depend on an unverified Camber headless API. The current core runner remains the source of truth.
