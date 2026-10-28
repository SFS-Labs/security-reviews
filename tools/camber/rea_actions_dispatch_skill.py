"""Camber-native, narrowly scoped GitHub Actions REA dispatcher.

The pre-existing Camber GitHub connector owns credentials. This skill never
requests, reads, prints or stores any token. It has ONE possible write:
workflow_dispatch for the fixed public synthetic REA MCP self-check on main.

Use ONLY after an explicit owner instruction. No scheduling or retry logic.
"""
from __future__ import annotations

REPOSITORY = "SFS-Labs/security-reviews"
WORKFLOW_FILE = "sfs-autonomous-rea.yml"
BRANCH = "main"
INPUTS = {"task": "selfcheck"}


def dispatch_rea_selfcheck(client=None) -> dict:
    """Return DISPATCH_ACCEPTED, not an unverified claim of MCP success."""
    if client is None:
        import camber
        client = camber.github.connect()

    repository = client.get_repo(REPOSITORY)
    if repository.full_name != REPOSITORY:
        raise ValueError("Unexpected repository; abort")
    if repository.default_branch != BRANCH:
        raise ValueError("Default branch changed; abort")
    workflow = repository.get_workflow(WORKFLOW_FILE)
    if workflow.state != "active":
        raise RuntimeError("Workflow not active; abort")

    # The fixed call accepts no user/model-generated parameters.
    accepted = workflow.create_dispatch(ref=BRANCH, inputs=dict(INPUTS))
    if accepted is not True:
        raise RuntimeError("GitHub did not confirm dispatch acceptance")

    return {
        "status": "DISPATCH_ACCEPTED",
        "repository": REPOSITORY,
        "workflow": WORKFLOW_FILE,
        "branch": BRANCH,
        "inputs": dict(INPUTS),
        "api_accepted": True,
        "rea_mcp_verified": False,
        "next": "Independently inspect Github Actions workflow_dispatch run and MCP tool logs",
    }


if __name__ == "__main__":
    import json
    print(json.dumps(dispatch_rea_selfcheck(), sort_keys=True, indent=2))
