"""Offline negative tests: no network or Camber authentication."""
import unittest
from types import SimpleNamespace
from .rea_issue_dispatch_skill import dispatch_rea_smoke, TRIGGER_LABEL

class Issue:
    def __init__(self, title="REA MCP self-check", state="open", labels=None, pr=None):
        self.title, self.state, self.labels, self.pull_request = title, state, labels or [], pr
        self.calls = []
    def add_to_labels(self, label):
        self.calls.append(label)
class Repo:
    full_name = "SFS-Labs/security-reviews"
    def __init__(self, issue=None, state="active"):
        self.issue=issue or Issue()
        self.workflow_state=state
    def get_workflow(self, name):
        assert name == "sfs-autonomous-rea.yml"
        return SimpleNamespace(state=self.workflow_state)
    def get_issue(self, number):
        assert number == 12
        return self.issue
class Client:
    def __init__(self, repo):self.repo=repo
    def get_repo(self, name):
        assert name == "SFS-Labs/security-reviews"
        return self.repo

class DispatchTests(unittest.TestCase):
    def test_only_approved_label_added(self):
        repo=Repo()
        result=dispatch_rea_smoke(Client(repo))
        self.assertEqual(result["status"],"LABEL_APPLIED")
        self.assertEqual(repo.issue.calls,[TRIGGER_LABEL])
        self.assertFalse(result["rea_mcp_called"])
    def test_idempotent_existing_label(self):
        issue=Issue(labels=[SimpleNamespace(name=TRIGGER_LABEL)])
        result=dispatch_rea_smoke(Client(Repo(issue)))
        self.assertEqual(result["status"],"ALREADY_LABELED")
        self.assertFalse(issue.calls)
    def test_reject_closed(self):
        issue=Issue(state="closed")
        with self.assertRaises(ValueError):dispatch_rea_smoke(Client(Repo(issue)))
        self.assertFalse(issue.calls)
    def test_reject_wrong_title(self):
        issue=Issue(title="Inject another command")
        with self.assertRaises(ValueError):dispatch_rea_smoke(Client(Repo(issue)))
        self.assertFalse(issue.calls)
    def test_reject_pr(self):
        issue=Issue(pr={"url":"https://example.org"})
        with self.assertRaises(ValueError):dispatch_rea_smoke(Client(Repo(issue)))
        self.assertFalse(issue.calls)
    def test_reject_inactive_workflow(self):
        repo=Repo(state="disabled_manually")
        with self.assertRaises(RuntimeError):dispatch_rea_smoke(Client(repo))
        self.assertFalse(repo.issue.calls)
    def test_permission_denied_fails(self):
        issue=Issue()
        def fail(label):raise PermissionError("403")
        issue.add_to_labels=fail
        with self.assertRaises(PermissionError):dispatch_rea_smoke(Client(Repo(issue)))

if __name__ == "__main__":
    unittest.main()
