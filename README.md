# SFS.Labs — REA Orchestration & Security Reviews

**Applied AI integration, bounded agent execution and evidence-led technical review.**  
This repository contains two distinct areas of personal, AI-assisted engineering work: a tested **REA/MCP execution stack** and a documented **external Solidity pre-launch review**. It is not an enterprise deployment, a security-audit certification or proof of unrestricted agent autonomy.

## 1 · REA Stack — agent decisions to controlled execution

**Goal:** Connect an AI agent's task planning to a real MCP tool server while keeping authorization, tests and operational execution independently verifiable.

| Layer | Implementation | Verified boundary |
| --- | --- | --- |
| Agent selection | Existing Camber agent selected three read-only REA tools for an Android-readiness check and chose an approved workflow | Real agent decision; not an unattended Camber self-start |
| Execution | GitHub Actions starts `rea-agents@6.8.0`, enumerates the MCP catalog and performs actual `tools/call` requests | 3 distinct target-free operations succeeded; 229 available tools at the dated test |
| Security | Source-controlled allowlist, strict argument validation, maximum 3 calls, read-only permissions and provider gates | The runner does not accept arbitrary model-generated tools or commands |
| Operations | Public standard GitHub-hosted runner, manual dispatch and configured weekly schedule | Scheduled replay does not generate a new Camber plan; first cron occurrence not evidenced in the original acceptance |

**Acceptance:** [Camber-selected three-tool test](docs/CAMBER_MULTITOOL_ACCEPTANCE.md) · [successful Actions run #40716523503](https://github.com/SFS-Labs/security-reviews/actions/runs/40716523503) (**33 validation checks**, three real REA MCP calls without tool errors) · [approved tool plan](docs/free-agent/camber-android-readiness.json) · [workflow](.github/workflows/sfs-camber-multitool.yml).

**Additional implementation:** A separately [documented local-model, issue-triggered REA self-check](docs/FREE_AGENT_AUTONOMOUS.md) uses an open-weight model under a deterministic authorization gate; a model abstention must not be described as successful free-form reasoning. [Camber read-only skill](docs/CAMBER_NATIVE_SKILL.md) and [protocol/toolchain evidence](docs/REA_MCP_E2E_VERIFICATION.md) record the remaining integration boundaries.

**Still open:** [Issue #5 — unattended fresh Camber model invocation](issues/5). This optional capability is distinct from the already functioning GitHub REA executor. No APK, connected Android device, customer environment or third-party binary was examined in the multi-tool acceptance run.

## 2 · External Solidity review — POINCARÉ

**Client question:** Analyze a Uniswap v4 custom-curve hook against specific manipulation, liquidity-accounting and configuration risks, then give the developer actionable findings.

- **Pinned scope:** 7 first-party Solidity files (~1,298 LOC); initial **222 Foundry tests independently reproduced**.
- **Original results:** 2 Low findings and 8 notes, supported by manual review and scoped static/property-based checks.
- **Developer follow-up:** 9 remediation commits covering 26 changed files were inspected at source level.
- **Verification limit:** The maintainer reported 240 tests on the revised branch; that revised suite was **not independently rerun**. This was a scope-limited individual review, not an end-to-end audit or production-security guarantee.

**Review and remediation evidence:** [POINCARÉ case study (PDF)](POINCARE-case-study.pdf) · [public detailed findings and follow-up](https://github.com/SFS-Labs/SFS-Labs/blob/main/security-review/case-studies/poincare-2026.md) · [developer's source-level remediation comparison](https://github.com/Prakhar-30/POINCARE/compare/78d75e24d7a899fbd488aedd0c0d4de6fe019adb...7699f62630404a34fd89298f8994cdc63c9da1ab).

## 3 · Source and verification map

| Evidence | Start here |
| --- | --- |
| REA package, local protocol and toolchain | [REA toolchain](docs/REA_TOOLCHAIN.md) · [MCP E2E verification](docs/REA_MCP_E2E_VERIFICATION.md) |
| Camber-to-GitHub control | [Camber decision/dispatch record](docs/CAMBER_ACTIONS_DISPATCH_VERIFIED.md) · [multi-tool acceptance](docs/CAMBER_MULTITOOL_ACCEPTANCE.md) |
| Permission and provider trade-offs | [Control-plane decision ADR-005](docs/architecture/ADR-005-CAMBER-OPTIONAL-CONTROL-PLANE.md) |
| Public-facing engineering documentation | [SFS.Labs REA case](https://sfs-labs.gitbook.io/sfs-labs-docs/ai-docs/agent-orchestration-rea/rea) · [portfolio evidence index](https://sfs-labs.gitbook.io/sfs-labs-docs/ai-docs/engineering-proof-index/projects) |

**Attribution:** I define the problem, integration boundaries, task requirements and acceptance criteria and use AI-assisted implementation, review and verification. Repo activity alone does not establish independent manual authorship of every line. The listed results have deliberately narrow scope; a passing runner or test suite is not interchangeable with a deployed customer system.
