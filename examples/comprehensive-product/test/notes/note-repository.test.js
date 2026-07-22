// Test suite TS-100 (unit) — local note persistence.
// Verifies AC-100-1 (a saved note persists locally) and AC-100-2 (markdown
// preserved verbatim). Uses the in-memory IndexedDB shim from test/fixtures.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { openDatabase, saveNote, getNote } from '../../src/notes/note-repository.js';
import { serialize, parse } from '../../src/notes/markdown-document.js';
import { memoryIndexedDb } from '../fixtures/indexeddb-shim.js';

test('saves a new note and reads it back', async () => {
  const db = await openDatabase(memoryIndexedDb());
  const saved = await saveNote(db, { title: 'First', body: 'hello' });
  const reloaded = await getNote(db, saved.id);
  assert.equal(reloaded.body, 'hello');
});

test('preserves markdown constructs byte-for-byte', () => {
  const md = '# Heading\n\n- item\n\n```js\nconst x = 1;\n```\n\n[[Linked Note]]';
  assert.equal(parse(serialize(md)), md);
});
