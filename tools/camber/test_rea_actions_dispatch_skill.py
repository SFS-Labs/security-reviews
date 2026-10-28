"""Deterministic offline tests: no actual GitHub requests or secrets."""
import unittest
from types import SimpleNamespace
from .rea_actions_dispatch_skill import dispatch_rea_selfcheck


class FakeWorkflow:
    state = "active"
    def __init__(self, result=True, error=None):
        self.result, self.error, self.calls = result, error, []
    def create_dispatch(self, ref, inputs):
        self.calls.append((ref, inputs))
        if self.error:
            raise self.error
        return self.result

class FakeRepository:
    full_name = "SFS-Labs/security-reviews"
    default_branch = "main"
    def __init__(self, workflow=None):
        self.workflow=workflow or FakeWorkflow()
    def get_workflow(self, name):
        assert name == "sfs-autonomous-rea.yml"
        return self.workflow

class FakeClient:
    def __init__(self, repo): self.repo=repo
    def get_repo(self, name):
        assert name == "SFS-Labs/security-reviews"
        return self.repo

class DispatchTests(unittest.TestCase):
    def test_fixed_dispatch_accepted_but_mcp_unverified(self):
        wf=FakeWorkflow()
        result=dispatch_rea_selfcheck(FakeClient(FakeRepository(wf)))
        self.assertEqual(result["status"],"DISPATCH_ACCEPTED")
        self.assertFalse(result["rea_mcp_verified"])
        self.assertEqual(wf.calls,[("main",{"task":"selfcheck"})])
    def test_changed_default_branch_aborts(self):
        repo=FakeRepository()
        repo.default_branch="dev"
        with self.assertRaises(ValueError): dispatch_rea_selfcheck(FakeClient(repo))
        self.assertFalse(repo.workflow.calls)
    def test_changed_repository_aborts(self):
        repo=FakeRepository()
        repo.full_name="attacker/repo"
        with self.assertRaises(ValueError): dispatch_rea_selfcheck(FakeClient(repo))
        self.assertFalse(repo.workflow.calls)
    def test_disabled_workflow_aborts(self):
        wf=FakeWorkflow()
        wf.state="disabled_manually"
        with self.assertRaises(RuntimeError): dispatch_rea_selfcheck(FakeClient(FakeRepository(wf)))
        self.assertFalse(wf.calls)
    def test_api_denial_propagates_without_retry(self):
        wf=FakeWorkflow(error=PermissionError("403"))
        with self.assertRaises(PermissionError): dispatch_rea_selfcheck(FakeClient(FakeRepository(wf)))
        self.assertEqual(len(wf.calls),1)
    def test_false_api_result_rejected(self):
        wf=FakeWorkflow(result=False)
        with self.assertRaises(RuntimeError): dispatch_rea_selfcheck(FakeClient(FakeRepository(wf)))
        self.assertEqual(len(wf.calls),1)
    def test_none_api_result_rejected(self):
        wf=FakeWorkflow(result=None)
        with self.assertRaises(RuntimeError): dispatch_rea_selfcheck(FakeClient(FakeRepository(wf)))
        self.assertEqual(len(wf.calls),1)

if __name__=="__main__":
    unittest.main()
