# SFS Reverse Engineering Toolkit (REA)

## Scope and deployment model

Source: [REA / morluto](https://github.com/morluto/rea), release `rea-agents-6.8.0` (25 October 2026). This repository's tool integration is a **reviewable configuration**, not a persistent install on a GitHub account. GitHub-hosted runners are disposable. No external API keys, paid services or permanent cloud workers are required.

The default Copilot setup installs the pinned REA CLI on a temporary runner and performs CLI-capability checks. The manual **REA toolchain readiness** workflow can select `core`, `android`, `native` or `all` for additional provider checks. The optional Ghidra archive is roughly 570 MB; avoid installing it on every Copilot session.

| Component | Role | Acquisition |
| --- | --- | --- |
| Node.js 24 + npm | REA runtime | Official actions/setup-node |
| REA 6.8.0 CLI and MCP | Unified investigation / evidence | npm package `rea-agents@6.8.0` |
| JDK 21 | Ghidra / JADX prerequisite | Official actions/setup-java (Temurin) |
| Ghidra 12.1.4 | Native binary decompilation | Official NSA release, SHA-256 verified |
| jadx-headless-mcp 0.7.1 | Static APK analysis | Original upstream release, SHA-256 verified |
| Chrome-family browser | Website / browser runtime workflows | Use existing runner browser when present |
| Hopper / IDA | Alternative commercial native analysis providers | **Not installed**: separate software and licensing |
| Frida / radare2 / unrelated MCP servers | Mentioned as an external researcher's setup, not mandatory REA components | **Not installed**: no exact endorsed bundle in the article |

Ghidra 12.2 may be newer, but REA's current native bridge accepts Ghidra **12.1.x**; use the supported 12.1.4 release. Current REA requires Node 22.23.4+, 24.22.1+, or 26.12.1+ within the corresponding supported major versions. The script checks the actual version.

## Copilot Cloud Agent MCP: required one-time owner action

1. Review and merge the feature PR only after checking the workflow and scripts. Copilot setup steps activate only once the workflow is on the repository's default branch.
2. Navigate to **Repository Settings → Copilot → MCP servers**. This is a **repository setting**, not a Git-tracked `.mcp.json` file.
3. Paste the complete JSON from [rea-copilot-mcp.json](rea-copilot-mcp.json). **Merge it with existing MCP server entries** instead of replacing unrelated settings. Save.
4. The example enables the full REA MCP tool catalog using `"tools":["*"]`. GitHub warns that Copilot can invoke these tools without an additional per-tool approval. For confidential or untrusted targets, narrow the allowlist and retain repository-level permission controls; disable use by Copilot code review if that boundary is undesirable.
5. Assign only a bounded, expressly authorized issue to Copilot. Confirm that the new session enumerates REA tools; run one non-sensitive sample investigation to verify tool invocation.

GitHub's MCP settings cannot be modified by the connected GitHub repository-files API available here. Creating the JSON file alone **does not activate** the MCP server in Copilot. Nor does the stdio MCP endpoint become a remotely accessible ChatGPT iOS app; iPhone operation is via GitHub/Copilot Cloud Agent and its persisted PRs.

## Verify

On the default branch open **Actions → REA toolchain readiness (manual) → Run workflow**. Select `core` first and then `all` when the larger download/compute exposure is justified. Review output. `doctor` verifies prerequisites; only an actual source-target investigation verifies the analysis workflow.

Standalone Linux command: `bash tools/rea/install.sh core` (requires supported Node/npm and `ps`). With an existing full JDK 21, use `bash tools/rea/install.sh android`, `native` or `all`.

Evidence policy: record artifact provenance and SHA-256, the relevant method/function, confidence, limitations, unknowns, and reproducing commands. Compare a clean-room implementation against observed behavior with deterministic tests.

## Use cases beyond reconstructing apps

- **FinTech product due diligence:** static checks for bundled libraries, permissions, endpoints and data transfers in *authorized* mobile or desktop software.
- **Legacy system migration:** recover documented interfaces and behavior from legally obtained binaries where the source is unavailable.
- **Vendor interoperability:** capture file/protocol formats and generate bounded integration specs and reproducible compatibility tests.
- **Blockchain/contract risk review:** inspect bytecode for potentially privileged state changes; validate suspected selectors against chain evidence and simulations, not AI-inferred names alone.
- **Change intelligence:** compare two authorized application releases to assess security, privacy, and undocumented behavioral differences.
- **Software supply-chain research:** inspect distributed artifacts, compile reproducible findings, and distinguish verified evidence from inference.
- **RL or agent evaluations:** derive task/reward fixtures from owned test applications and recorded, authorized interactions.

Do not upload confidential client binaries to a **public** repository, issues, Actions logs or artifacts. The workflow installs tools only; it does not fetch client targets, execute suspect files, grant elevated privileges, or publish investigation outputs. Reverse engineering and reimplementation must respect applicable law, third-party IP and licenses.

## Sources

- REA official: https://github.com/morluto/rea
- REA installation: https://github.com/morluto/rea/blob/main/docs/installation.md
- GitHub Copilot setup: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/customize-the-agent-environment
- GitHub MCP settings: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/configure-mcp-servers
- Ghidra official release: https://github.com/NationalSecurityAgency/ghidra/releases/tag/Ghidra_12.1.4_build
- JADX upstream: https://github.com/1013503897/jadx-headless-mcp/releases/tag/v0.7.1
