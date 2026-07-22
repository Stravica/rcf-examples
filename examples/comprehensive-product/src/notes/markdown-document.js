// Stravica Notebook — markdown document model.
//
// The store persists notes as raw markdown text, never as a re-rendered HTML
// round-trip, so every construct the user typed survives byte-for-byte. These
// helpers are the single choke point through which note bodies enter and leave
// storage; keeping them lossless is what makes AC-100-2 hold.

/**
 * Serialize a note body for storage. Deliberately a near-identity transform:
 * we normalise trailing whitespace on the final line only (editors append a
 * stray newline) and otherwise preserve the markdown source verbatim —
 * headings, fenced code blocks, list markers, and wiki-links included.
 *
 * @param {string} body - raw markdown as typed by the user
 * @returns {string} storage form (lossless for every markdown construct)
 */
export function serialize(body) {
  if (typeof body !== 'string') {
    throw new TypeError('note body must be a string');
  }
  // Only the terminal newline run is collapsed; interior blank lines (which
  // are semantically significant in markdown) are untouched.
  return body.replace(/\n+$/, '\n');
}

/**
 * Parse a stored note body back into its in-editor form. The inverse of
 * `serialize`; because serialize is lossless, parse is the identity on
 * everything except the terminal newline it never removed.
 *
 * @param {string} stored
 * @returns {string} markdown source ready to load into the editor
 */
export function parse(stored) {
  if (typeof stored !== 'string') {
    throw new TypeError('stored body must be a string');
  }
  return stored;
}

/**
 * Extract the `[[wiki-style]]` links from a note body. Used by the linking
 * feature to build the backlink graph; exposed here because link extraction
 * must read the same source of truth serialize/parse preserve.
 *
 * @param {string} body
 * @returns {string[]} target titles, in order of first appearance, de-duped
 */
export function extractWikiLinks(body) {
  const seen = new Set();
  const out = [];
  const re = /\[\[([^\]]+)\]\]/g;
  let match;
  while ((match = re.exec(body)) !== null) {
    const target = match[1].trim();
    if (target && !seen.has(target)) {
      seen.add(target);
      out.push(target);
    }
  }
  return out;
}
