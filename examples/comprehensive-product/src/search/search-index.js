// Stravica Notebook — full-text search index.
//
// An in-memory inverted index over the local note corpus. Rebuilt lazily from
// IndexedDB on first query and kept warm by incremental updates as notes are
// saved. Ranking is a plain term-frequency score — deliberately simple and
// fully local, so search works offline and over ten-thousand-note corpora
// without a server round-trip.

const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'is']);

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * Add (or replace) a note in the inverted index. Idempotent per note id: a
 * re-index of the same note first drops its old postings so stale terms never
 * linger after an edit.
 *
 * @param {Map<string, Map<string, number>>} index - term -> (noteId -> tf)
 * @param {{ id: string, title: string, body: string }} note
 * @returns {Map<string, Map<string, number>>} the same index, mutated
 */
export function indexNote(index, note) {
  // Drop existing postings for this note id.
  for (const postings of index.values()) postings.delete(note.id);
  const terms = tokenize(`${note.title} ${note.body}`);
  for (const term of terms) {
    let postings = index.get(term);
    if (!postings) {
      postings = new Map();
      index.set(term, postings);
    }
    postings.set(note.id, (postings.get(note.id) ?? 0) + 1);
  }
  return index;
}

/**
 * Run a free-text query against the index. An empty (or all-stop-word) query
 * is not an error: it returns the caller-supplied recent-notes fallback so the
 * search surface always has something to show. Non-empty queries return the
 * top `limit` note ids by term-frequency score, highest first.
 *
 * @param {Map<string, Map<string, number>>} index
 * @param {string} queryText
 * @param {object} [opts]
 * @param {number} [opts.limit=10]
 * @param {string[]} [opts.recent=[]] - fallback list for an empty query
 * @returns {string[]} ranked note ids
 */
export function query(index, queryText, opts = {}) {
  const limit = opts.limit ?? 10;
  const terms = tokenize(queryText);
  if (terms.length === 0) {
    return (opts.recent ?? []).slice(0, 20);
  }
  const scores = new Map();
  for (const term of terms) {
    const postings = index.get(term);
    if (!postings) continue;
    for (const [noteId, tf] of postings) {
      scores.set(noteId, (scores.get(noteId) ?? 0) + tf);
    }
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([noteId]) => noteId);
}
