#!/usr/bin/env node
// Gallery-vs-CLI compatibility guard.
//
// Runs the PUBLISHED rcf CLI (@stravica-ai/rcf-build-lite) over every example
// tree under examples/ and fails if any tree is not clean. This is the guard
// that turns a CLI/schema release which breaks the gallery into a red build
// instead of an ambush for the next user who clones the repo.
//
// For each tree (a directory under examples/ that contains rcf/manifest.json):
//   1. `rcf validate`            -> must exit 0 (clean schema + references).
//   2. `rcf view --strict`       -> boot gate; must NOT exit 3. The strict gate
//                                   walks the tree once on boot and exits 3 on
//                                   structural errors, otherwise it holds the
//                                   HTTP listener open. We start it headless,
//                                   give it a grace window, and treat "still
//                                   serving after the window" as a pass.
//
// The rcf binary is taken from RCF_BIN (default: "rcf"), so CI can install the
// package globally and run this with no extra wiring. Node-only, no shell.

import { spawn } from 'node:child_process';
import { readdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLES_DIR = join(__dirname, '..', 'examples');
const RCF_BIN = process.env.RCF_BIN || 'rcf';
const STRICT_GRACE_MS = 6000;

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function findTrees() {
  const entries = await readdir(EXAMPLES_DIR, { withFileTypes: true });
  const trees = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const treeDir = join(EXAMPLES_DIR, e.name);
    if (await exists(join(treeDir, 'rcf', 'manifest.json'))) {
      trees.push({ name: e.name, dir: treeDir });
    }
  }
  return trees;
}

function run(args, cwd, extraEnv = {}) {
  return new Promise((resolve) => {
    const child = spawn(RCF_BIN, args, {
      cwd,
      env: { ...process.env, ...extraEnv },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('error', (err) => resolve({ code: null, out: `spawn error: ${err.message}` }));
    child.on('exit', (code) => resolve({ code, out }));
  });
}

// Start the strict view gate, hold it for a grace window, then kill it.
// Pass = it never exited with 3 (or any error) before we killed it.
function runStrictGate(cwd) {
  return new Promise((resolve) => {
    const child = spawn(RCF_BIN, ['view', '--strict', '--no-open', '--port', '4399'], {
      cwd,
      env: { ...process.env, CI: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    let settled = false;
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGTERM');
      resolve({ ok: true, code: 'serving', out });
    }, STRICT_GRACE_MS);

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ok: false, code: null, out: `spawn error: ${err.message}` });
    });
    child.on('exit', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Any early exit means the boot gate rejected the tree (3) or the server
      // failed to come up. Either way the tree is not gallery-clean.
      resolve({ ok: false, code, out });
    });
  });
}

async function main() {
  const trees = await findTrees();
  if (trees.length === 0) {
    console.error('No example trees found under examples/ (expected rcf/manifest.json in each).');
    process.exit(1);
  }
  console.log(`Checking ${trees.length} example tree(s) against published rcf CLI ("${RCF_BIN}").\n`);

  const failures = [];
  for (const tree of trees) {
    console.log(`## ${tree.name}`);

    const validate = await run(['validate'], tree.dir);
    if (validate.code === 0) {
      console.log('  validate      OK');
    } else {
      console.log(`  validate      FAIL (exit ${validate.code})`);
      console.log(indent(validate.out));
      failures.push(`${tree.name}: validate exit ${validate.code}`);
    }

    const strict = await runStrictGate(tree.dir);
    if (strict.ok) {
      console.log('  view --strict OK (boot gate passed, server came up)');
    } else {
      console.log(`  view --strict FAIL (exit ${strict.code})`);
      console.log(indent(strict.out));
      failures.push(`${tree.name}: view --strict exit ${strict.code}`);
    }
    console.log('');
  }

  if (failures.length > 0) {
    console.error(`FAILED: ${failures.length} check(s) did not pass:`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log('All example trees are clean against the published rcf CLI.');
}

function indent(s) {
  return String(s)
    .trimEnd()
    .split('\n')
    .map((l) => `      ${l}`)
    .join('\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
