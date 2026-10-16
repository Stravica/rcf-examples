# Agent instructions

The trees under `examples/<name>/rcf/` are reference examples. An agent that changes an example's code or its chain follows the section below, running `rcf` commands from that example's directory and `pnpm test` at the root.

## RCF five-stage delivery (separated hands)

No `rcf:managed` block lives in this file. If `rcf init` writes one into an example, this section still governs there where it is stricter.

Every build spec, fix or story runs all five stages, in order, one hand per stage. The stage names are rcf-lite's (`guidance/build-cycle.md`). One change from rcf-lite's runbook: the test-author writes the test-suite and test-case records at Define, not at Test, so the builder works against a fixed contract.

| Stage | Hand | Writes |
|---|---|---|
| Define | test-author | AC-based tests, E2E tests, test-suite and test-case bindings, criterion wording, the `inProgress` mark |
| Build | builder | Production code, code-hygiene unit tests bound to no criterion, Code Nodes through `rcf define create cn` |
| Review | reviewer (independent Codex gate) | Nothing in the repo; MERGE or FINDINGS on the diff |
| Test | verifier | Nothing; evidence only. PASS means the AC and E2E suites ran through the real entry point on the preview or version host serving the reviewed head |
| Finalise | stage-keeper | The merge, the `complete` mark, the finalise run |

- A build hand writes production code and code-hygiene unit tests only; AC-based tests, E2E tests, test-suite and test-case bindings and criterion text are written by the test-author hand, never by the coding agent. If a test looks wrong, the builder stops and says why; it never adapts the test.
- The test-author hand never edits production code. The reviewer hand and the verifier hand edit nothing.
- A merge happens only on a MERGE from the Review gate and a PASS from the Test stage, both at the same head. Nothing merges on the builder's word or on a gate alone.
- Finalise runs after the merge, from the stage-keeper's own session, never from a dispatched hand: `rcf build finalise <fbs-id> --url <deployed-url> --mode agentScreenshotCritique`, in a fresh clone on the default branch. A dispatched hand stops at "ready to finalise" and reports the exact command. Exit 0 writes `verified`; the spec is not done until then.
- If Finalise fails for a tooling reason, that is an ESCALATE to the operator, never a skip. The exit code and stderr go with it verbatim; "cannot run" is never recorded and moved past.
- No later spec on the same example enters Build until every merged spec is `verified` (`executionStatus` in `examples/<name>/rcf/fbs/*.json`).
- Test-stage prerequisites (hosts, accounts, sandboxes, credential names) come from the operational notes the stage-keeper supplies, kept outside this repo. The notes carry names, never values; never commit a key, token or password here.
- The five RCF verbs are define, build, verify, release and audit. The fifth is audit, not attest.
- Runbook commands: `rcf build bundle --next` (the next spec bundle and its five-stage runbook), `rcf define validate` (before acting on the tree and after any edit to it), `rcf audit coverage --strict` (the Define and Build exits).

Source: the RCF five-stage separation standard (2026-10-16).
