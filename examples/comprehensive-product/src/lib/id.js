// Stravica Notebook — id generation utility.
//
// A tiny, dependency-free id helper shared across the store, sync, and search
// layers. It anchors to no acceptance criterion of its own — it is glue — and
// so its Code Node (CN-010) is a deliberate example of a legitimate orphan
// (empty implementsAcIds), reported by `rcf coverage --with-code` as
// CN-orphaned, never as an error.

/**
 * Generate a short, collision-resistant id with a semantic prefix, e.g.
 * `newId('note')` -> `note_l9x2q8_4f7a`. Not cryptographically strong; ids are
 * local record keys, never security tokens.
 *
 * @param {string} prefix
 * @returns {string}
 */
export function newId(prefix) {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${time}_${rand}`;
}
