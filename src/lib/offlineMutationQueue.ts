// Offline Mutation Queue
// Stores mutations in IndexedDB when offline and syncs when back online

interface QueuedMutation {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = 'smash-mutations';
const DB_VERSION = 1;
const STORE_NAME = 'mutations';

class OfflineMutationQueue {
  private db: IDBDatabase | null = null;
  private isOnline = navigator.onLine;

  constructor() {
    this.init();
    this.setupListeners();
  }

  private async init() {
    try {
      this.db = await this.openDatabase();
    } catch (error) {
      console.error('Failed to initialize mutation queue:', error);
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  private setupListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Add a mutation to the queue
  async addMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    if (!this.db) {
      throw new Error('Database not available');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.add({
        ...mutation,
        timestamp: Date.now(),
        retryCount: 0,
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve();
        // Try to sync if online
        if (this.isOnline) {
          this.processQueue();
        } else {
          // Register for background sync
          this.registerBackgroundSync();
        }
      };
    });
  }

  // Get all queued mutations
  async getMutations(): Promise<QueuedMutation[]> {
    if (!this.db) {
      await this.init();
    }

    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Delete a mutation from the queue
  async deleteMutation(id: number): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Update mutation retry count
  async updateMutationRetry(id: number, retryCount: number): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const mutation = getRequest.result;
        if (mutation) {
          mutation.retryCount = retryCount;
          const updateRequest = store.put(mutation);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Process all queued mutations
  async processQueue(): Promise<void> {
    if (!this.isOnline) {
      return;
    }

    const mutations = await this.getMutations();

    for (const mutation of mutations) {
      try {
        const response = await fetch(mutation.url, {
          method: mutation.method,
          headers: mutation.headers,
          body: JSON.stringify(mutation.body),
        });

        if (response.ok) {
          await this.deleteMutation(mutation.id!);
          console.log('Synced offline mutation:', mutation.id);
        } else if (response.status >= 400 && response.status < 500) {
          // Client error - delete and don't retry
          await this.deleteMutation(mutation.id!);
          console.error('Mutation failed with client error:', response.status);
        } else {
          // Server error - update retry count
          const newRetryCount = mutation.retryCount + 1;
          if (newRetryCount >= 3) {
            await this.deleteMutation(mutation.id!);
            console.error('Mutation exceeded max retries:', mutation.id);
          } else {
            await this.updateMutationRetry(mutation.id!, newRetryCount);
          }
        }
      } catch (error) {
        console.error('Failed to process mutation:', error);
        // Network error - keep for retry
        const newRetryCount = mutation.retryCount + 1;
        if (newRetryCount >= 3) {
          await this.deleteMutation(mutation.id!);
        } else {
          await this.updateMutationRetry(mutation.id!, newRetryCount);
        }
      }
    }
  }

  // Register for background sync
  private async registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-mutations');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }

  // Get queue count
  async getQueueCount(): Promise<number> {
    const mutations = await this.getMutations();
    return mutations.length;
  }

  // Clear all mutations
  async clearQueue(): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Export singleton instance
export const offlineMutationQueue = new OfflineMutationQueue();

// Helper to wrap fetch with offline support
export async function offlineFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const isOnline = navigator.onLine;
  const isMutation = options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method);

  if (!isOnline && isMutation) {
    // Queue mutation for later
    await offlineMutationQueue.addMutation({
      url,
      method: options.method || 'POST',
      headers: options.headers as Record<string, string> || {},
      body: options.body ? JSON.parse(options.body as string) : {},
    });

    // Return fake success response
    return new Response(JSON.stringify({ queued: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return fetch(url, options);
}
