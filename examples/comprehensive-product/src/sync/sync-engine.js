// Stravica Notebook — offline-first sync engine.
//
// The engine reconciles the local IndexedDB store with the remote service.
// Local writes are always accepted immediately (the repository marks them
// `dirty`); this module is what carries those changes to the server when
// connectivity allows and pulls remote changes back down. It owns no UI and
// never throws on a dropped connection — offline is a normal state, not an
// error.

import { resolveConflict } from './conflict-resolver.js';

const FLUSH_DEBOUNCE_MS = 2000;

/**
 * Push every locally `dirty` note to the remote. Called on reconnect and on a
 * debounced timer after local edits. Returns the ids the remote acknowledged
 * so the caller can clear their `dirty` flag. A transport failure resolves
 * with an empty ack list rather than rejecting — the notes stay dirty and are
 * retried on the next flush.
 *
 * @param {object} deps
 * @param {() => Promise<object[]>} deps.pendingNotes - dirty local notes
 * @param {(notes: object[]) => Promise<{ acked: string[] }>} deps.transport
 * @returns {Promise<{ acked: string[] }>}
 */
export async function pushChanges({ pendingNotes, transport }) {
  const pending = await pendingNotes();
  if (pending.length === 0) return { acked: [] };
  try {
    return await transport(pending);
  } catch {
    return { acked: [] };
  }
}

/**
 * Pull remote changes and merge them into the local store. Any note that was
 * edited on both sides since the last sync is handed to the conflict resolver
 * rather than being silently overwritten. Returns the merge outcome so the UI
 * can surface conflicts.
 *
 * @param {object} deps
 * @param {(since: string) => Promise<object[]>} deps.fetchRemote
 * @param {(id: string) => Promise<object|null>} deps.localNote
 * @param {(note: object) => Promise<void>} deps.applyLocal
 * @param {string} deps.since - watermark of the last successful pull
 * @returns {Promise<{ applied: string[], conflicts: object[] }>}
 */
export async function pullChanges({ fetchRemote, localNote, applyLocal, since }) {
  const remote = await fetchRemote(since);
  const applied = [];
  const conflicts = [];
  for (const remoteNote of remote) {
    const local = await localNote(remoteNote.id);
    if (local && local.dirty) {
      const outcome = resolveConflict(local, remoteNote);
      if (outcome.conflicted) {
        conflicts.push(outcome);
        continue;
      }
      await applyLocal(outcome.merged);
    } else {
      await applyLocal(remoteNote);
    }
    applied.push(remoteNote.id);
  }
  return { applied, conflicts };
}

/**
 * Schedule a debounced push. Multiple rapid edits collapse into one flush.
 * @param {() => void} flush
 * @returns {() => void} a cancel handle
 */
export function scheduleFlush(flush) {
  const handle = setTimeout(flush, FLUSH_DEBOUNCE_MS);
  return () => clearTimeout(handle);
}
