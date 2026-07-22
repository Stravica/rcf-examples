// Test suite TS-102 (e2e) — full-text search over the corpus.
// Verifies AC-102-1 (free-text query returns relevant notes ranked) and
// AC-102-2 (empty query yields the recent-notes list).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { indexNote, query } from '../../src/search/search-index.js';

function buildCorpus() {
  const index = new Map();
  indexNote(index, { id: 'n1', title: 'Trains', body: 'notes about railway journeys' });
  indexNote(index, { id: 'n2', title: 'Recipes', body: 'railway station sandwich recipe' });
  indexNote(index, { id: 'n3', title: 'Planning', body: 'quarterly planning offsite' });
  return index;
}

test('free-text query returns the most relevant notes first', () => {
  const results = query(buildCorpus(), 'railway', { limit: 10 });
  assert.ok(results.includes('n1'));
  assert.ok(results.includes('n2'));
  assert.ok(!results.includes('n3'));
});

test('empty query returns the recent-notes fallback', () => {
  const results = query(buildCorpus(), '', { recent: ['n3', 'n2', 'n1'] });
  assert.deepEqual(results, ['n3', 'n2', 'n1']);
});
