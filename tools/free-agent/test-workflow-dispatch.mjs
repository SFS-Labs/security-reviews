import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../../.github/workflows/sfs-camber-multitool.yml',import.meta.url),'utf8');
test('explicit manual dispatch permits the reviewed hardening branch',()=>{
  const condition=workflow.match(/    if: >-\n([\s\S]*?)    runs-on:/)?.[1] ?? '';
  assert.match(condition,/github\.event_name == 'workflow_dispatch'[^\n]*refs\/heads\/hardening\/rea-readiness-20261107/);
});
test('workflow remains manual only',()=>{
  assert.match(workflow,/'on':\s*\n  workflow_dispatch:/);
  assert.doesNotMatch(workflow,/^  (?:schedule|push|pull_request):/m);
});
