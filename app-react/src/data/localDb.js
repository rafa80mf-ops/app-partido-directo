const DB_NAME = 'partidoDirectoDb';
const DB_VERSION = 1;
const MATCH_STORE = 'matches';
const EVENT_STORE = 'events';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      if (!database.objectStoreNames.contains(MATCH_STORE)) {
        const matchStore = database.createObjectStore(MATCH_STORE, { keyPath: 'id' });
        matchStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!database.objectStoreNames.contains(EVENT_STORE)) {
        const eventStore = database.createObjectStore(EVENT_STORE, { keyPath: 'id' });
        eventStore.createIndex('matchId', 'matchId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('No se pudo abrir la base de datos local'));
  });
}

export async function saveMatchSnapshot(snapshot) {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return snapshot;
  }

  const database = await openDatabase();
  const transaction = database.transaction(MATCH_STORE, 'readwrite');
  const store = transaction.objectStore(MATCH_STORE);

  store.put({
    id: 'current-match',
    ...snapshot,
    updatedAt: snapshot.updatedAt || new Date().toISOString(),
  });

  return snapshot;
}

export async function loadMatchSnapshot() {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return null;
  }

  const database = await openDatabase();
  const transaction = database.transaction(MATCH_STORE, 'readonly');
  const store = transaction.objectStore(MATCH_STORE);

  return new Promise((resolve, reject) => {
    const request = store.get('current-match');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error('No se pudo leer la base de datos local'));
  });
}

export async function saveEventRecord(eventRecord) {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return eventRecord;
  }

  const database = await openDatabase();
  const transaction = database.transaction(EVENT_STORE, 'readwrite');
  const store = transaction.objectStore(EVENT_STORE);
  store.put(eventRecord);

  return eventRecord;
}
