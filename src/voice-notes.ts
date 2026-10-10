const DATABASE_NAME = "timex-voice-notes";
const STORE_NAME = "recordings";

type StoredRecording = {
  id: string;
  blob: Blob;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onerror = () => reject(request.error ?? new Error("Could not open voice-note storage."));
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

export async function saveVoiceRecording(id: string, blob: Blob): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ id, blob } satisfies StoredRecording);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save voice note."));
  });
  database.close();
}

export async function readVoiceRecording(id: string): Promise<Blob | null> {
  const database = await openDatabase();
  const result = await new Promise<StoredRecording | undefined>((resolve, reject) => {
    const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as StoredRecording | undefined);
    request.onerror = () => reject(request.error ?? new Error("Could not load voice note."));
  });
  database.close();
  return result?.blob ?? null;
}

export async function deleteVoiceRecording(id: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not delete voice note."));
  });
  database.close();
}
