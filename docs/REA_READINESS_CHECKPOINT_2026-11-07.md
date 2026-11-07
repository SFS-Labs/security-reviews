# REA bounded execution | readiness checkpoint (7 November 2026)

**Status: HARDENING IN REVIEW — not yet VERIFIED on the patched commit.**
Do not present this as production/customer deployment or general-purpose autonomous AI.

## Proven live evidence, separately from code changes

- [Successful REA Camber-selected multi-tool run, 28 October](https://github.com/SFS-Labs/security-reviews/actions/runs/40716523503): `binary_session({})`, `inspect_apktool_client({})`, `inspect_adb_client({})`, 33 checks, REA `6.8.0`.
- [Latest completed multi-tool run, 2 November](https://github.com/SFS-Labs/security-reviews/actions/runs/41475950911): three actual MCP calls on a GitHub-hosted runner, status success; this is evidence about its **historical SHA**, not this patch.
- [Issue #5](https://github.com/SFS-Labs/security-reviews/issues/5): noninteractive fresh Camber model invocation and enforced zero-charge limit **not** verified; leave disabled.
- On 2 November, security commits removed unattended triggers. Current workflow is **workflow_dispatch only**. Do not re-enable scheduled or PR/push executions without a separate security assessment.

## This change: concrete fail-closed acceptance

A green workflow now requires:
1. Exactly the reviewed three distinct read-only MCP calls with exactly `{}` arguments in prescribed order.
2. Actual stdio MCP initialization and a nonduplicated tool catalog; the configured package and version must match the pinned REA `6.8.0`.
3. Each `tools/call` must return a parseable, inspectable result; a malformed/empty response or MCP `isError=true` fails the job.
4. Identity evidence from `binary_session` must confirm `rea-agents@6.8.0` and pinned catalog count `229`.
5. Scope remains no targets, no scanned files, no devices, no billed model API, no arbitrary shell/tool inputs.
6. A complete evidence record must pass independent validation before the runner emits `PASS_MCP_TOOLS` and exits successfully.

Unit regression tests: `node --test tools/free-agent/test-mcp-response-acceptance.mjs` (18 positive/negative cases). The manual workflow runs this test **before** installing REA or Android utilities.

## Threat boundaries / limitations

- The selected Camber plan is a **reviewed source-controlled snapshot**; the validation is an allowlist, not a cryptographic signature proving new Camber inference. Do not claim fresh model autonomy.
- `adb`, `apktool` and Java may be installed on a fresh ephemeral runner as verified by the workflow. This is target-free diagnostic readiness, **not** a validated APK analysis, device analysis, malware sandbox or enterprise deployment.
- MCP response integrity follows trust in the pinned upstream package and the GitHub runner environment. The checks cannot establish third-party binary safety, a zero-vulnerability guarantee or persistent runtime uptime.
- GitHub branch protection / required reviews / rulesets were not configured as of the 7 November read-only check (`main` was unprotected); **repository admin action is needed**. A successful PR is not a substitute.
- A deterministic fail-closed check does not prove an actual current third-party MCP session until the patched workflow completes on an actual GitHub runner.

## Exact verification / release gate

**Gate A — code and unit validation**: all three test files pass:
```sh
node --test tools/free-agent/test-camber-multitool.mjs
node --test tools/free-agent/test-provider-gate.mjs
node --test tools/free-agent/test-mcp-response-acceptance.mjs
```

**Gate B — fresh live verification, currently PENDING**: from GitHub Actions select **SFS Camber selected REA multi-tool (no AI API)** → **Run workflow** against the reviewed branch/commit. Check zero failed steps, exactly 3 MCP `tools/call` records, identity REA `6.8.0`, catalog `229`, `verdict=PASS_MCP_TOOLS`, no target inputs or model requests. Save exact run URL and SHA. Do not extrapolate a GitHub status from locally passing tests.

**Gate C — change-control, currently PENDING**: require reviewer approval, configured main branch rules/required checks after risk assessment, and explicit owner approval before merge. No workflow, provider or paid plan enablement; do not turn scheduling back on by accident.

If any gate fails, mark BLOCKED and diagnose from the first real failing log. No fake-green evidence, no bypass by manual editing of the evidence JSON.
