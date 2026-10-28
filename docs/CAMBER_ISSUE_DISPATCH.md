# Camber → GitHub Actions REA Dispatch (minimal-permission integration)

**Status:** Code implemented in an isolated PR; live Camber dispatch BLOCKED until one repo-scoped permission is granted.

## Live evidence

- Existing Camber GitHub connector: CONNECTED and READ_PASS; native status skill `sfs-rea-github-readonly` is registered and active (Camber Skill ID `e0869050-f127-4cd3-b4c1-b872ee2fc860`).
- Synthetic issue [#12](https://github.com/SFS-Labs/security-reviews/issues/12) exists, title `REA MCP self-check`, state OPEN, no labels at the time of test.
- Real Camber PyGithub call `issue.add_to_labels("sfs-rea-auto")` returned **HTTP 403** `Resource not accessible by personal access token`. This is a permission failure, not a missing Camber connector or lack of Python execution.
- [Live Camber scope test](https://app.cambercloud.com/project/8cff9482-7805-4d69-bd98-26a3c73295b0?chatId=a70dd567-de45-4332-aeeb-09fb26c6395a).

## The exact least-privilege permission

On the fine-grained GitHub PAT already configured in Camber, select:
- Owner: `SFS-Labs`
- Repository: **ONLY** `SFS-Labs/security-reviews`
- Repository permissions: **Issues → Read and write**
- Keep Contents, Actions and Pull requests at Read-only; all other scopes No access.

[GitHub docs: add label to an issue](https://docs.github.com/en/rest/issues/labels?apiVersion=2022-11-28#add-labels-to-an-issue) requires Issues:write (or Pull requests:write). The pre-existing REA workflow [sfs-autonomous-rea.yml](../.github/workflows/sfs-autonomous-rea.yml) requires owner-applied label `sfs-rea-auto` and exact issue title. No new GitHub Actions write privilege is necessary for this plan.

Editing a token's permissions may take effect for the existing token; if Camber still returns HTTP 403, update its GitHub Connector with a correctly scoped newly generated token. Never paste tokens into ChatGPT, GitHub issues, CI logs or commits.

## Scoped implementation

Reference script: [rea_issue_dispatch_skill.py](../tools/camber/rea_issue_dispatch_skill.py).
- The one and only authorized write is adding `sfs-rea-auto` to issue #12, **only if** the repository, issue title, issue state, and workflow activation match exactly.
- Repeated invocation after successful labeling becomes `ALREADY_LABELED` with no write.
- It never reads issue body as instructions, never shells out, never downloads binaries, never modifies source or settings, and never merges PRs.
- It returns `LABEL_APPLIED` only upon successful GitHub API response, not `MCP_PASS`. The independent GitHub Actions log must prove the real MCP call.
- Every tool or argument expansion requires a separately reviewed change.

## Completion gate

1. Owner upgrades **Issues:read → Issues:write** for the single repository in GitHub Fine-grained PAT settings and confirms Camber connection.
2. Execute the fixed Camber native Python dispatch function once; verify the 200 GitHub label response.
3. Identify the new GitHub `issues:labeled` run, independently inspect its final status and `rea-agents@6.8.0` REA MCP `binary_session({})` tool call (229 advertised tools).
4. Only then mark **Camber-initiated dispatch E2E = VERIFIED**. Distinguish this from an unattended Camber scheduler; the latter remains separately UNVERIFIED.
5. Record evidence in [Issue #5](https://github.com/SFS-Labs/security-reviews/issues/5). No costs or premium-model invocation.

No repository write from this PR is authorized via Camber beyond the label operation described above.

## Camber native dispatcher registration (VERIFIED, not invoked)

- `sfs-rea-issue-dispatch`, Skill ID `31e6c9aa-59d1-49fc-9fcb-84ceea230a5a`, was successfully registered under the existing Camber agent `@sfslabs46046859.sfs-rea-free-controller`, status ACTIVE.
- The Camber Skill was installed through the documented `camber.agent.skill.create` API; registration result was independently returned in [Camber session](https://app.cambercloud.com/project/732d738c-e466-4ba6-82e5-4380031e9f5f?chatId=383a4a3a-3cf4-4547-b5d4-fc6c0709e476).
- Camber verified repository read access, but did **not** execute the label-writing Skill. Its known GitHub connector permission remains HTTP 403 for Issues label writes.
- The Git-tracked reference implementation and Camber Stash script were created separately; byte-for-byte equality was not independently verified. The live script reports a safe `WRITE_BLOCKED` response upon HTTP 403.
- Standalone unit tests and the modified GitHub Actions CI passed in [run #40691421776](https://github.com/SFS-Labs/security-reviews/actions/runs/40691421776).
