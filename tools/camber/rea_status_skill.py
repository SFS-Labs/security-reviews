"""SFS Camber-native, read-only GitHub/REA status skill.

No token handling. No writes, dispatches, network fetch outside the connected
Camber GitHub Python SDK. Do not print full contents of repositories or logs.
"""
from __future__ import annotations

import json

REPOSITORY = "SFS-Labs/security-reviews"
WORKFLOW = "sfs-autonomous-rea.yml"
PROVIDER_CONFIG = "config/free-agent-providers.json"
MAX_RUNS = 3


def read_rea_status(client=None) -> dict:
    """Return minimal audited metadata using Camber's existing GitHub connector."""
    if client is None:
        import camber
        client = camber.github.connect()

    repo = client.get_repo(REPOSITORY)
    if repo.full_name != REPOSITORY:
        raise ValueError("Unexpected GitHub repository.")
    branch = repo.get_branch("main")
    config_file = repo.get_contents(PROVIDER_CONFIG, ref="main")
    config = json.loads(config_file.decoded_content.decode("utf-8"))
    if config.get("production", {}).get("executor") != "github-actions":
        raise ValueError("Unexpected SFS production execution mode.")
    if config.get("camber", {}).get("enabled") is not False:
        raise ValueError("Camber activation guard changed; review required.")

    wf = repo.get_workflow(WORKFLOW)
    runs = []
    for run in wf.get_runs():
        if len(runs) >= MAX_RUNS:
            break
        runs.append({
            "run_id": int(run.id),
            "event": str(run.event),
            "status": str(run.status),
            "conclusion": None if run.conclusion is None else str(run.conclusion),
            "html_url": str(run.html_url),
        })

    return {
        "status": "READ_PASS",
        "repository": REPOSITORY,
        "branch": "main",
        "head_sha": str(branch.commit.sha),
        "workflow": WORKFLOW,
        "latest_runs": runs,
        "camber_provider_enabled": False,
        "production_executor": "github-actions",
        "can_dispatch_from_this_skill": False,
        "rea_mcp_called": False,
    }


if __name__ == "__main__":
    print(json.dumps(read_rea_status(), sort_keys=True, indent=2))
