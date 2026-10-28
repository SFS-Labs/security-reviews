"""Mock-based tests; never use real credentials or GitHub network."""
import json
import unittest
from types import SimpleNamespace
from .rea_status_skill import read_rea_status

class StubFile:
    decoded_content = json.dumps({
        "production": {"executor": "github-actions"},
        "camber": {"enabled": False}
    }).encode()

class StubRuns:
    def __iter__(self):
        for i in range(5):
            yield SimpleNamespace(id=i + 1, event="issues",
                status="completed", conclusion="success",
                html_url="https://github.com/SFS-Labs/security-reviews/actions/runs/" + str(i + 1))

class StubWorkflow:
    def get_runs(self):
        return StubRuns()

class StubRepo:
    full_name = "SFS-Labs/security-reviews"
    def get_branch(self, name):
        assert name == "main"
        return SimpleNamespace(commit=SimpleNamespace(sha="a" * 40))
    def get_contents(self, path, ref):
        assert path == "config/free-agent-providers.json" and ref == "main"
        return StubFile()
    def get_workflow(self, name):
        assert name == "sfs-autonomous-rea.yml"
        return StubWorkflow()

class StubClient:
    def get_repo(self, name):
        assert name == "SFS-Labs/security-reviews"
        return StubRepo()

class SkillTests(unittest.TestCase):
    def test_read_only_contract(self):
        out = read_rea_status(StubClient())
        self.assertEqual(out["status"], "READ_PASS")
        self.assertEqual(len(out["latest_runs"]), 3)
        self.assertFalse(out["can_dispatch_from_this_skill"])
        self.assertFalse(out["rea_mcp_called"])
        self.assertFalse(out["camber_provider_enabled"])
        self.assertEqual(out["head_sha"], "a"*40)

if __name__ == "__main__":
    unittest.main()
