# REA bounded execution | readiness checkpoint (7 November 2026)

**Status: TESTED/VERIFIED for the live bounded MCP runner at code SHA `301b08b9871a4d1208a6bd2185539ff4d374e32a`; FINAL RELEASE PENDING.**
An additional commit to this PR makes a new exact-head CI run necessary. GitHub App cannot dispatch `workflow_dispatch`; a GitHub UI/authorized browser action is required for that gate.
Do not present this as production/customer deployment or general-purpose autonomous AI.

## Proven live evidence, separately from code changes

- [Successful REA Camber-selected multi-tool run, 28 October](https://github.com/SFS-Labs/security-reviews/actions/runs/40716523503): `binary_session({})`, `inspect_apktool_client({})`, `inspect_adb_client({})`, 33 checks, REA `6.8.0`.
- [Fresh hardened run #42355851924 (7 November)](https://github.com/SFS-Labs/security-reviews/actions/runs/42355851924): exact head `301b08b9871a4d1208a6bd2185539ff4d374e32a`, **62 tests** across five deterministic test groups, actual MCP `binary_session`, `inspect_apktool_client`, `inspect_adb_client` responses, pinned identity `rea-agents@6.8.0`, catalog count `229`, `verdict=PASS_MCP_TOOLS`. See run/job logs for the raw evidence. This is the last independently observed *tested code* SHA; any subsequent commit needs revalidation.
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
- The 7 November live settings read returned **zero repository rulesets**. Classic branch-protection read returned HTTP 403 (`Resource not accessible by integration`), so this connector cannot establish whether classic protection is active. Owner must verify the `main` settings before merge.
- The runner passes through the job environment to the fixed `npx` child. The current read-only workflow does not explicitly supply write tokens/secrets, but environment inheritance is not a strict allowlist and must not be copied into credential-bearing workflows.
- REA is pinned to upstream `6.8.0`, but transitive npm dependencies and Ubuntu apt packages are not lockfile/digest pinned. This remains a bounded supply-chain limitation of ephemeral diagnostic runs; the live success cannot certify the upstream package.
- The conflicting PR #21 is unsuitable for acceptance: an override pair permits alternate commands when enabled, and the invented nested `normalized_result`/`client.version` contract is incompatible with existing live evidence. Existing #19 runner/fake-server tests already cover required failure categories. Do not merge #21 as-is.
- A deterministic fail-closed check alone is insufficient; the actual hardened third-party MCP session **did run successfully on SHA `301b08b`**. This establishes the bounded transport test, not semantic correctness of every diagnostic result or the safety of processing external targets.

## Exact verification / release gate

**Gate A — code and unit validation**: all three test files pass:
```sh
node --test tools/free-agent/test-camber-multitool.mjs
node --test tools/free-agent/test-provider-gate.mjs
node --test tools/free-agent/test-mcp-response-acceptance.mjs
```

**Gate B — VERIFIED on `301b08b`, PENDING again for any newer PR head**: [run #42355851924](https://github.com/SFS-Labs/security-reviews/actions/runs/42355851924) passed. For a newer SHA, from GitHub Actions select **SFS Camber selected REA multi-tool (no AI API)** → **Run workflow** against the reviewed branch/commit. Check zero failed steps, exactly 3 MCP `tools/call` records, identity REA `6.8.0`, catalog `229`, `verdict=PASS_MCP_TOOLS`, no target inputs or model requests. Save exact run URL and SHA. Do not extrapolate a GitHub status from locally passing tests.

**Gate C — change-control, PENDING**: independent review of final changes, owner inspection of effective main-branch protections, and explicit owner approval before merge. A GitHub App 403 is not evidence of absent protection. No workflow, provider or paid plan enablement; do not turn scheduling back on by accident.

If any gate fails, mark BLOCKED and diagnose from the first real failing log. No fake-green evidence, no bypass by manual editing of the evidence JSON.
