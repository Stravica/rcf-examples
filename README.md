# rcf-examples

Synthetic-but-realistic fictional product RCF document trees for the [Requirements Confidence Framework (RCF)](https://stravica.ai/rcf-methodology/). Stress-test target during Phase 1; adopter gallery post-publish.

> **Status:** v0.1.0 (Phase 1 stress-test trees).

## What's here

Two complete RCF trees under `examples/`:

- **`minimal-product/`** - smallest viable RCF tree. Only required fields populated. Demonstrates the floor.
- **`comprehensive-product/`** - every optional field populated across every schema. Demonstrates the ceiling.

Both trees use the recommended `rcf/` folder layout from `@stravica/rcf-schemas/docs/file-layout.md`, with Test Suite files OUTSIDE `rcf/` (code-adjacent), to prove the pattern.

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
|   `-- fbs/
`-- test/                  (TS files: code-adjacent, outside rcf/)
    `-- ...
```

## Schema validation

Each tree validates clean against the latest published RCF CLI (`@stravica-ai/rcf-build-lite`, which bundles the current `@stravica-ai/rcf-schemas`). Two CI jobs enforce this:

- **`test`** — a fast, dependency-free check that every JSON file parses and every tree carries a `manifest.json`.
- **`gallery-vs-published-cli`** — installs the *latest* published CLI and runs `rcf validate` and the `rcf view --strict` boot gate over every tree under `examples/`. A CLI or schema release that breaks the gallery turns this job red rather than ambushing users.

To reproduce locally: `npm install -g @stravica-ai/rcf-build-lite@latest`, then from any tree directory run `rcf validate`.

## Conventions used in the comprehensive tree

- **AC ids** use the hierarchical form (`AC-101-1`, `AC-101-2`, ...) so the parent US id is encoded in the AC id. The minimal tree uses the flat form (`AC-001`) to demonstrate both are supported.
- **TS files** live under `test/<domain>/<AC-id>.test.json`.
- **ADRs** show a full superseded-by cycle (`ADR-102` superseded by `ADR-103`).

## License

Apache 2.0, see [LICENSE](./LICENSE).
