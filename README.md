# rcf-examples

Synthetic-but-realistic fictional product RCF document trees for the [Requirements Confidence Framework (RCF)](https://stravica.ai/rcf-methodology/). Stress-test target during Phase 1; adopter gallery post-publish.

> **Status:** v0.1.0 (Phase 1 stress-test trees).

## What's here

Two RCF trees under `examples/`, each making a different point:

- **`minimal-product/`** - the smallest *valid* RCF tree: only required fields, and only the spec layer (PRD -> REQ -> US -> AC plus the TAD/TAC/ADR/BS/FBS roots). It stops where a valid tree can stop, so `rcf validate` is clean but `rcf coverage` reports its ACs uncovered - that is the honest state of a spec-only floor, not a defect. Demonstrates the minimum.
- **`comprehensive-product/`** - the *full* chain, intent all the way into code: every spec field populated, plus Test Suites (`rcf/test-suites/`) and Code Nodes (`rcf/code-nodes/`) that carry every acceptance criterion down to real synthetic source and tests. `rcf coverage` lights green (every AC covered, `--strict` clean) and `rcf coverage --with-code` reports every AC `implemented-and-covered`. Demonstrates the whole method.

Both trees use the `rcf/` folder layout the published CLI walks. Test Suites are discovered under `rcf/test-suites/` (each `TC` may carry a `testPointer` to a code-adjacent test file); Code Nodes under `rcf/code-nodes/` point at working-tree source paths, which `rcf validate` resolves for staleness.

```
examples/<tree>/
|-- rcf/
|   |-- manifest.json
|   |-- prd.json
|   |-- requirements/
|   |-- user-stories/
|   |-- tad.json
|   |-- tacs/
|   |-- adrs/
|   |-- build-sequence.json
|   |-- fbs/
|   |-- test-suites/       (TS docs; comprehensive-product only)
|   `-- code-nodes/        (CN docs; comprehensive-product only)
|-- src/                   (synthetic product source the CNs point at)
`-- test/                  (code-adjacent test files the TCs point at)
```

## Schema validation

Each tree validates clean against the latest published RCF CLI (`@stravica-ai/rcf-build-lite`, which bundles the current `@stravica-ai/rcf-schemas`). Two CI jobs enforce this:

- **`test`** — a fast, dependency-free check that every JSON file parses and every tree carries a `manifest.json`.
- **`gallery-vs-published-cli`** — installs the *latest* published CLI and runs `rcf validate` (which includes Code Node staleness resolution) and the `rcf view --strict` boot gate over every tree under `examples/`. A CLI or schema release that breaks the gallery turns this job red rather than ambushing users.

To reproduce locally: `npm install -g @stravica-ai/rcf-build-lite@latest`, then from any tree directory run `rcf validate`.

## Conventions used in the comprehensive tree

- **AC ids** use the hierarchical form (`AC-101-1`, `AC-101-2`, ...) so the parent US id is encoded in the AC id. The minimal tree uses the flat form (`AC-001`) to demonstrate both are supported.
- **Test Suites** live under `rcf/test-suites/ts-NNN.json`, one file per suite, holding inline Test Cases. One user story can carry several suites at different levels: `US-100` has both `TS-100` (unit) and `TS-103` (e2e). Test Cases carry an optional `testPointer` (`filePath::testName`) into the code-adjacent `test/` tree.
- **Code Nodes** live under `rcf/code-nodes/cn-NNN.json` and point at working-tree source under `src/`. They mix symbol-level (`src/notes/note-repository.js#saveNote`, load-bearing) and file-level (`src/lib/id.js`, coarse) granularity, declare `CN`->`CN` `dependencies`, and include one deliberate orphan (`CN-010`, empty `implementsAcIds`) to show that utilities/glue with no direct AC anchor are a legitimate, reported-not-errored state.
- **ADRs** show a full superseded-by cycle (`ADR-102` superseded by `ADR-103`).

## License

Apache 2.0, see [LICENSE](./LICENSE).
