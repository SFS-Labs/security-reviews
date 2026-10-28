"""Single-purpose Camber-to-GitHub REA integration dispatch.

Permission: Issues:write ONLY in SFS-Labs/security-reviews. No repo source
writes, workflow writes, secrets, webhook endpoints, arbitrary prompt args.
"""
from __future__ import annotations

REPOSITORY = "SFS-Labs/security-reviews"
WORKFLOW = "sfs-autonomous-rea.yml"
ISSUE_NUMBER = 12
ISSUE_TITLE = "REA MCP self-check"
TRIGGER_LABEL = "sfs-rea-auto"


def dispatch_rea_smoke(client=None) -> dict:
    """Owner-authorized exact issue label; idempotent, permission-gated."""
    if client is None:
        import camber
        client = camber.github.connect()
    repo = client.get_repo(REPOSITORY)
    if repo.full_name != REPOSITORY:
        raise ValueError("Unexpected repository")
    wf = repo.get_workflow(WORKFLOW)
    if wf.state != "active":
        raise RuntimeError("Workflow not active; no dispatch")
    issue = repo.get_issue(number=ISSUE_NUMBER)
    if issue.title != ISSUE_TITLE or issue.state != "open" or getattr(issue, "pull_request", None):
        raise ValueError("Issue is not authorized synthetic self-check")
    if any(label.name == TRIGGER_LABEL for label in issue.labels):
        return {
            "status": "ALREADY_LABELED",
            "issue_number": ISSUE_NUMBER,
            "label": TRIGGER_LABEL,
            "rea_mcp_called": False,
            "github_run_proven": False,
        }
    # This sole write requires Issues:write in this repository.
    issue.add_to_labels(TRIGGER_LABEL)
    return {
        "status": "LABEL_APPLIED",
        "repository": REPOSITORY,
        "issue_number": ISSUE_NUMBER,
        "label": TRIGGER_LABEL,
        "rea_mcp_called": False,
        "github_run_proven": False,
        "verification": "Inspect separate github issues event Actions run",
    }


if __name__ == "__main__":
    import json
    print(json.dumps(dispatch_rea_smoke(), indent=2, sort_keys=True))
