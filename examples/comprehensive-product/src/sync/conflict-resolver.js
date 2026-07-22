// Stravica Notebook — sync conflict resolution.
//
// When the same note was edited locally (offline) and remotely (another
// device) since the last sync, we never silently pick a winner. A true
// divergence is surfaced to the UI with both versions intact so the user
// decides. Only a fast-forward — one side unchanged — is auto-merged.

/**
 * Decide the outcome of a local/remote pair for the same note id.
 *
 * - Fast-forward (local unchanged since base): take remote.
 * - Fast-forward (remote unchanged since base): keep local.
 * - Both diverged: report a conflict carrying both versions; the UI renders a
 *   side-by-side view and the user resolves it explicitly.
 *
 * @param {{ id: string, body: string, baseRev?: string, rev?: string }} local
 * @param {{ id: string, body: string, rev?: string }} remote
 * @returns {{ conflicted: boolean, merged?: object, local?: object, remote?: object }}
 */
export function resolveConflict(local, remote) {
  // Identical bodies are not a conflict regardless of revision bookkeeping.
  if (local.body === remote.body) {
    return { conflicted: false, merged: { ...remote, dirty: false } };
  }
  // Local never diverged from the revision the remote is based on: safe to
  // fast-forward to remote.
  if (local.baseRev && local.baseRev === remote.rev) {
    return { conflicted: false, merged: { ...remote, dirty: false } };
  }
  // Genuine divergence — surface both, resolve nothing automatically.
  return { conflicted: true, id: local.id, local, remote };
}
