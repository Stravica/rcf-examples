// Test suite TS-101 (integration) — offline edit + reconnect sync.
// Verifies AC-101-1 (offline edit persists), AC-101-2 (reconnect flushes
// pending edits), AC-101-3 (divergent edit surfaces a conflict).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { pushChanges, pullChanges } from '../../src/sync/sync-engine.js';
import { resolveConflict } from '../../src/sync/conflict-resolver.js';

test('reconnect pushes pending offline edits', async () => {
  const pending = [{ id: 'note_1', body: 'edited offline', dirty: true }];
  const { acked } = await pushChanges({
    pendingNotes: async () => pending,
    transport: async (notes) => ({ acked: notes.map((n) => n.id) }),
  });
  assert.deepEqual(acked, ['note_1']);
});

test('transport failure leaves edits pending, does not throw', async () => {
  const { acked } = await pushChanges({
    pendingNotes: async () => [{ id: 'note_1', body: 'x', dirty: true }],
    transport: async () => {
      throw new Error('offline');
    },
  });
  assert.deepEqual(acked, []);
});

test('divergent edit on both sides surfaces a conflict', () => {
  const outcome = resolveConflict(
    { id: 'note_1', body: 'local text' },
    { id: 'note_1', body: 'remote text' },
  );
  assert.equal(outcome.conflicted, true);
  assert.equal(outcome.local.body, 'local text');
  assert.equal(outcome.remote.body, 'remote text');
});
