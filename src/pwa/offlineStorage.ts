/**
 * IndexedDB Storage for PWA Offline Functionality
 */

const DB_NAME = 'rotasmart-offline-db';
const DB_VERSION = 1;

export interface PendingOperation {
  id: string;
  type: 'download' | 'credit_deduction' | 'address_save';
  data: any;
  timestamp: string;
  userId?: string;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  status: 'success' | 'error';
  message: string;
  operationsCount: number;
}

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Store para operações pendentes
      if (!database.objectStoreNames.contains('pendingOperations')) {
        const operationsStore = database.createObjectStore('pendingOperations', { keyPath: 'id' });
        operationsStore.createIndex('timestamp', 'timestamp', { unique: false });
        operationsStore.createIndex('userId', 'userId', { unique: false });
      }

      // Store para créditos locais
      if (!database.objectStoreNames.contains('creditsLocal')) {
        database.createObjectStore('creditsLocal', { keyPath: 'userId' });
      }

      // Store para endereços offline
      if (!database.objectStoreNames.contains('addressesLocal')) {
        const addressStore = database.createObjectStore('addressesLocal', { keyPath: 'id' });
        addressStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Store para logs de sincronização
      if (!database.objectStoreNames.contains('syncLogs')) {
        const logsStore = database.createObjectStore('syncLogs', { keyPath: 'id' });
        logsStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Store para cache de dados do usuário
      if (!database.objectStoreNames.contains('cachedUserData')) {
        database.createObjectStore('cachedUserData', { keyPath: 'key' });
      }
    };
  });
}

/**
 * Operações Pendentes
 */
export async function addPendingOperation(operation: Omit<PendingOperation, 'id'>): Promise<string> {
  const database = await initDB();
  const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fullOperation: PendingOperation = { ...operation, id };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['pendingOperations'], 'readwrite');
    const store = transaction.objectStore('pendingOperations');
    const request = store.add(fullOperation);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingOperations(): Promise<PendingOperation[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['pendingOperations'], 'readonly');
    const store = transaction.objectStore('pendingOperations');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removePendingOperation(id: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['pendingOperations'], 'readwrite');
    const store = transaction.objectStore('pendingOperations');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearPendingOperations(): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['pendingOperations'], 'readwrite');
    const store = transaction.objectStore('pendingOperations');
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Créditos Locais
 */
export async function getLocalCredits(userId: string): Promise<number | null> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['creditsLocal'], 'readonly');
    const store = transaction.objectStore('creditsLocal');
    const request = store.get(userId);

    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.credits : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function setLocalCredits(userId: string, credits: number): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['creditsLocal'], 'readwrite');
    const store = transaction.objectStore('creditsLocal');
    const request = store.put({ userId, credits, updatedAt: new Date().toISOString() });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Endereços Offline
 */
export async function saveAddressOffline(address: any): Promise<string> {
  const database = await initDB();
  const id = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fullAddress = { ...address, id, timestamp: new Date().toISOString() };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['addressesLocal'], 'readwrite');
    const store = transaction.objectStore('addressesLocal');
    const request = store.add(fullAddress);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineAddresses(): Promise<any[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['addressesLocal'], 'readonly');
    const store = transaction.objectStore('addressesLocal');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearOfflineAddresses(): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['addressesLocal'], 'readwrite');
    const store = transaction.objectStore('addressesLocal');
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Logs de Sincronização
 */
export async function addSyncLog(log: Omit<SyncLog, 'id'>): Promise<void> {
  const database = await initDB();
  const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fullLog: SyncLog = { ...log, id };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['syncLogs'], 'readwrite');
    const store = transaction.objectStore('syncLogs');
    const request = store.add(fullLog);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getSyncLogs(limit: number = 50): Promise<SyncLog[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['syncLogs'], 'readonly');
    const store = transaction.objectStore('syncLogs');
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev');
    const logs: SyncLog[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor && logs.length < limit) {
        logs.push(cursor.value);
        cursor.continue();
      } else {
        resolve(logs);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cache de Dados do Usuário
 */
export async function setCachedData(key: string, value: any): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['cachedUserData'], 'readwrite');
    const store = transaction.objectStore('cachedUserData');
    const request = store.put({ key, value, updatedAt: new Date().toISOString() });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedData(key: string): Promise<any | null> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['cachedUserData'], 'readonly');
    const store = transaction.objectStore('cachedUserData');
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.value : null);
    };
    request.onerror = () => reject(request.error);
  });
}
