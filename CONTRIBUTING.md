# Contributing to RCF Examples

Thanks for taking the time to contribute. We are not currently accepting external code contributions to this repository. It exists as a set of reference RCF document trees for the [Requirements Confidence Framework (RCF)](https://stravica.ai/rcf-methodology/), and changes to the example trees are curated to keep the minimal and comprehensive examples internally consistent and in step with `@stravica/rcf-schemas`.

## Issues are welcome

If you spot a mistake in an example tree, an inconsistency with the current schema version, or a gap in what the examples demonstrate, please open an [issue](https://github.com/Stravica/rcf-examples/issues). Include:

- which example tree you were looking at (`examples/minimal-product/` or `examples/comprehensive-product/`),
- the file and field involved,
- what you expected versus what you found.

## Development setup

If you want to run the test suite locally:

- Node.js >= 24
- pnpm 9

```sh
git clone https://github.com/Stravica/rcf-examples.git
cd rcf-examples
pnpm install
pnpm test
```

The suite confirms every JSON file under `examples/` parses and that each example tree contains a manifest at its root. Schema validation against `@stravica/rcf-schemas` runs in that repo's own CI, not here.

## Where to ask

- **Bugs and defects:** open an [issue](https://github.com/Stravica/rcf-examples/issues).
- **Security problems:** never open a public issue; see [SECURITY.md](./SECURITY.md).

## Licensing

This project is licensed under Apache-2.0. There is no CLA and no DCO ceremony.
