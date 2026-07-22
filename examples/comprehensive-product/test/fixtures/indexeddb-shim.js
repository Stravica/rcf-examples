// Minimal in-memory IndexedDB shim for the note-repository unit tests. Covers
// only the object-store surface note-repository.js exercises: open/upgrade,
// put, get, getAll — enough to run the store offline in a plain Node test with
// no browser and no real IndexedDB.

export function memoryIndexedDb() {
  const stores = new Map();
  return {
    open() {
      const db = {
        objectStoreNames: { contains: (n) => stores.has(n) },
        createObjectStore(name, { keyPath }) {
          stores.set(name, { keyPath, rows: new Map() });
        },
        transaction(name) {
          const store = stores.get(name);
          return {
            objectStore() {
              return {
                put(record) {
                  store.rows.set(record[store.keyPath], record);
                  return successRequest(undefined);
                },
                get(key) {
                  return successRequest(store.rows.get(key));
                },
                getAll() {
                  return successRequest([...store.rows.values()]);
                },
              };
            },
          };
        },
      };
      const request = { result: db, onupgradeneeded: null, onsuccess: null, onerror: null };
      queueMicrotask(() => {
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    },
  };
}

function successRequest(result) {
  const request = { result, onsuccess: null, onerror: null };
  queueMicrotask(() => request.onsuccess?.());
  return request;
}
