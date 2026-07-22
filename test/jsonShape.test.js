// Sanity test for the rcf-examples repo: every JSON file under examples/ must
// parse as JSON, and every example tree must contain a manifest at its root.
//
// This is the fast, dependency-free parse + layout check. Full schema and
// reference validation against the PUBLISHED CLI (@stravica-ai/rcf-build-lite)
// runs in a separate CI job driven by test/validate-against-published-cli.mjs,
// so a CLI/schema release that breaks the gallery turns the build red.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLES_DIR = join(__dirname, '..', 'examples');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      out.push(full);
    }
  }
  return out;
}

test('every example .json file parses as JSON', async () => {
  const files = await walk(EXAMPLES_DIR);
  assert.ok(files.length > 0, 'expected at least one JSON file under examples/');
  for (const file of files) {
    const raw = await readFile(file, 'utf8');
    try {
      JSON.parse(raw);
    } catch (err) {
      assert.fail(`${file} failed to parse: ${err.message}`);
    }
  }
});

test('every example tree contains a manifest', async () => {
  const trees = (await readdir(EXAMPLES_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  assert.ok(trees.length >= 2, 'expected at least 2 example trees');
  for (const tree of trees) {
    const manifestPath = join(EXAMPLES_DIR, tree, 'rcf', 'manifest.json');
    try {
      const info = await stat(manifestPath);
      assert.ok(info.isFile(), `${manifestPath} is not a file`);
    } catch {
      assert.fail(`expected manifest at ${manifestPath}`);
    }
  }
});
