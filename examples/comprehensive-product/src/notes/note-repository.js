// Stravica Notebook — local note persistence.
//
// Offline-first store backed by IndexedDB in the browser and by an in-memory
// shim under test (see test/fixtures/indexeddb-shim.js). Every write lands
// locally first and is picked up by the sync engine on the next flush; the UI
// never blocks on the network.

import { newId } from '../lib/id.js';

const STORE = 'notes';

/**
 * Open (or upgrade) the IndexedDB database that backs the note store.
 * @param {IDBFactory} factory - injected so tests can pass the in-memory shim
 * @returns {Promise<IDBDatabase>}
 */
export function openDatabase(factory = globalThis.indexedDB) {
  return new Promise((resolve, reject) => {
    const request = factory.open('stravica-notebook', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Persist a note locally. A note with no id is treated as new and assigned
 * one; an existing id updates in place. Returns the stored record so callers
 * can render the freshly persisted state without a re-read.
 *
 * @param {IDBDatabase} db
 * @param {{ id?: string, title: string, body: string }} note
 * @returns {Promise<{ id: string, title: string, body: string, updatedAt: string, dirty: boolean }>}
 */
export function saveNote(db, note) {
  const record = {
    id: note.id ?? newId('note'),
    title: note.title,
    body: note.body,
    updatedAt: new Date().toISOString(),
    // `dirty` marks the record for the next sync flush. Cleared by the sync
    // engine once the change is acknowledged by the remote.
    dirty: true,
  };
  return runWrite(db, (store) => store.put(record)).then(() => record);
}

/**
 * Read a single note by id. Resolves to null when the id is unknown so the
 * caller can distinguish "not found" from a transport error.
 *
 * @param {IDBDatabase} db
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export function getNote(db, id) {
  return runRead(db, (store) => store.get(id)).then((r) => r ?? null);
}

/**
 * List every locally stored note, most-recently-updated first.
 *
 * @param {IDBDatabase} db
 * @returns {Promise<object[]>}
 */
export function listNotes(db) {
  return runRead(db, (store) => store.getAll()).then((notes) =>
    [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );
}

function runWrite(db, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const request = fn(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runRead(db, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = fn(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
