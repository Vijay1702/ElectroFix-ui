// IndexedDB utility for offline data caching and synchronization queue

const DB_NAME = "ElectroFix_Offline_DB";
const DB_VERSION = 1;

export interface SyncItem {
  id?: number;
  method: "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  data: any;
  timestamp: number;
}

export class OfflineDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        // Create object stores for caching API data (using id as primary key)
        const stores = [
          "products",
          "categories",
          "customers",
          "repairs",
          "invoices",
          "payments",
          "attendance",
          "users"
        ];

        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: "id" });
          }
        });

        // Create a sync queue store for capturing offline mutations
        if (!db.objectStoreNames.contains("syncQueue")) {
          db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve(this.db!);
      };

      request.onerror = (event: any) => {
        console.error("IndexedDB initialization error:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = "readonly"): Promise<IDBObjectStore> {
    const db = await this.init();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Get all items in a store
  async getAll<T>(storeName: string): Promise<T[]> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get item by ID
  async getById<T>(storeName: string, id: any): Promise<T | null> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Put (Insert or Update) a single item
  async put(storeName: string, item: any): Promise<void> {
    const store = await this.getStore(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Put multiple items
  async putMany(storeName: string, items: any[]): Promise<void> {
    const db = await this.init();
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      items.forEach(item => {
        if (item && typeof item === "object" && item.id) {
          store.put(item);
        }
      });
    });
  }

  // Delete an item
  async delete(storeName: string, id: any): Promise<void> {
    const store = await this.getStore(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear a store
  async clear(storeName: string): Promise<void> {
    const store = await this.getStore(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Add a task to the sync queue
  async addToSyncQueue(item: Omit<SyncItem, "timestamp">): Promise<void> {
    const store = await this.getStore("syncQueue", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.add({
        ...item,
        timestamp: Date.now()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get all sync queue items
  async getSyncQueue(): Promise<SyncItem[]> {
    const store = await this.getStore("syncQueue");
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete an item from the sync queue
  async deleteFromSyncQueue(id: number): Promise<void> {
    const store = await this.getStore("syncQueue", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineDB = new OfflineDB();
