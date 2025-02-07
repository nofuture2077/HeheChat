import { DB_VERSION, DB_NAME } from "@/commons/config";

export interface StoreSchema {
    name: string;
    keyPath: string;
    indexes?: { name: string; keyPath: string; options?: IDBIndexParameters }[];
}

class DatabaseManager {
    private static instance: DatabaseManager;
    private db: IDBDatabase | null = null;
    private dbInitialized: Promise<void>;
    private stores: Set<StoreSchema> = new Set();

    private constructor() {
        this.dbInitialized = this.initDB();
    }

    public static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    public registerStore(schema: StoreSchema) {
        this.stores.add(schema);
        // If DB is already initialized, we need to close it to trigger an upgrade
        if (this.db) {
            this.db.close();
            this.dbInitialized = this.initDB();
        }
    }

    private async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error("Error opening IndexedDB:", request.error);
                reject(request.error);
            };

            request.onupgradeneeded = (event) => {
                console.log('Database upgrade needed, creating stores...');
                const db = (event.target as IDBOpenDBRequest).result;
                
                // Create/update all registered stores
                this.stores.forEach(store => {
                    if (db.objectStoreNames.contains(store.name)) {
                        db.deleteObjectStore(store.name);
                    }
                    const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
                    
                    // Create any indexes
                    store.indexes?.forEach(index => {
                        objectStore.createIndex(index.name, index.keyPath, index.options);
                    });
                });
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database initialized successfully');
                resolve();
            };
        });
    }

    public async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
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

export abstract class BaseStorage<T> {
    protected db: DatabaseManager;
    protected storeName: string;
    protected schema: StoreSchema;

    constructor(schema: StoreSchema) {
        this.db = DatabaseManager.getInstance();
        this.storeName = schema.name;
        this.schema = schema;
        this.db.registerStore(schema);
    }

    protected async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
        return this.db.getStore(this.storeName, mode);
    }

    async get(key: string): Promise<T | null> {
        try {
            const store = await this.getStore();
            return new Promise((resolve, reject) => {
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`Error getting item from ${this.storeName}:`, error);
            return null;
        }
    }

    async put(item: T): Promise<void> {
        try {
            const store = await this.getStore('readwrite');
            return new Promise((resolve, reject) => {
                const request = store.put(item);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`Error storing item in ${this.storeName}:`, error);
            throw error;
        }
    }

    async delete(key: string): Promise<void> {
        try {
            const store = await this.getStore('readwrite');
            return new Promise((resolve, reject) => {
                const request = store.delete(key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`Error deleting item from ${this.storeName}:`, error);
            throw error;
        }
    }
}

export const dbManager = DatabaseManager.getInstance();
