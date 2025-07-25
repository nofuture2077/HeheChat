import { DB_VERSION, DB_NAME } from "./config";

// Store names
export const EMOTES_STORE = 'userEmotes';
export const ALERT_CONFIG_STORE = 'alertConfigs';
export const SEVENTV_COSMETICS_STORE = 'seventvCosmetics';

class DatabaseService {
    private db: IDBDatabase | null = null;
    private dbInitialized: Promise<void>;

    constructor() {
        this.dbInitialized = this.initDB();
    }

    private initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error("Error opening IndexedDB:", request.error);
                reject(request.error);
            };

            request.onupgradeneeded = (event) => {
                console.log('Database upgrade needed, creating stores...');
                const db = (event.target as IDBOpenDBRequest).result;
                
                // Handle userEmotes store
                if (db.objectStoreNames.contains(EMOTES_STORE)) {
                    db.deleteObjectStore(EMOTES_STORE);
                }
                db.createObjectStore(EMOTES_STORE, { keyPath: 'userId' });

                // Handle alertConfigs store
                if (!db.objectStoreNames.contains(ALERT_CONFIG_STORE)) {
                    db.createObjectStore(ALERT_CONFIG_STORE, { keyPath: 'meta.channel' });
                }

                // Handle seventvCosmetics store
                if (!db.objectStoreNames.contains(SEVENTV_COSMETICS_STORE)) {
                    db.createObjectStore(SEVENTV_COSMETICS_STORE, { keyPath: 'userId' });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database initialized successfully');
                resolve();
            };
        });
    }

    async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
        try {
            await this.dbInitialized;
            if (!this.db) {
                throw new Error('Database not initialized');
            }
            if (!this.db.objectStoreNames.contains(storeName)) {
                throw new Error(`Store ${storeName} not found`);
            }
            const transaction = this.db.transaction(storeName, mode);
            return transaction.objectStore(storeName);
        } catch (error) {
            console.error('Error getting store:', error);
            // Re-initialize database on error
            await this.initDB();
            if (!this.db) {
                throw new Error('Database initialization failed');
            }
            const transaction = this.db.transaction(storeName, mode);
            return transaction.objectStore(storeName);
        }
    }
}

export const Database = new DatabaseService();
