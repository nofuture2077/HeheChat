import { DB_VERSION, DB_NAME } from "@/commons/config";
// Constants for IndexedDB
const STORE_NAME = 'userEmotes';

interface UserEmotes {
    userId: string;
    emotes: any[];
    timestamp: number;
    expiresAt: number; // Timestamp when cache should be invalidated
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export class EmoteStorage {
    private db: IDBDatabase | null = null;
    private dbInitialized: Promise<void>;
    private cleanupScheduled = false;
    private initializationAttempts = 0;
    private readonly MAX_INIT_ATTEMPTS = 3;
    private initPromise: Promise<void>;
    private initResolve!: () => void;
    private initReject!: (error: Error) => void;

    constructor() {
        // Create a promise that we can resolve/reject from anywhere
        this.initPromise = new Promise<void>((resolve, reject) => {
            this.initResolve = resolve;
            this.initReject = reject;
        });
        // Start initialization in background
        this.dbInitialized = this.initDB();
        this.dbInitialized.then(() => {
            this.initResolve();
            // Schedule cleanup after successful initialization
            this.scheduleCleanup();
        }).catch(error => {
            console.error('Initial database initialization failed:', error);
            this.initReject(error instanceof Error ? error : new Error('Unknown initialization error'));
        });
    }

    private scheduleCleanup() {
        if (this.cleanupScheduled) return;
        this.cleanupScheduled = true;
        // Run cleanup in background
        Promise.resolve().then(() => {
            this.cleanExpiredEmotes().catch(console.error).finally(() => {
                this.cleanupScheduled = false;
            });
        });
    }

    private async initDB(): Promise<void> {
        if (this.initializationAttempts >= this.MAX_INIT_ATTEMPTS) {
            throw new Error('Max database initialization attempts reached');
        }
        this.initializationAttempts++;

        try {
            await new Promise<void>((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = () => {
                    console.error("Error opening IndexedDB:", request.error);
                    reject(request.error);
                };

                request.onblocked = () => {
                    console.error("Database blocked, closing other connections");
                    reject(new Error("Database blocked"));
                };

                request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                    console.log('Database upgrade needed, creating store...');
                    const db = (event.target as IDBOpenDBRequest).result;
                    
                    // Always recreate the store during upgrade
                    if (db.objectStoreNames.contains(STORE_NAME)) {
                        db.deleteObjectStore(STORE_NAME);
                    }
                    db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
                };

                request.onsuccess = (event: Event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    
                    // Handle connection errors
                    db.onerror = (event) => {
                        console.error("Database error:", event);
                    };
                    
                    // Verify store exists
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.close();
                        reject(new Error(`Store ${STORE_NAME} not found after initialization`));
                        return;
                    }
                    
                    this.db = db;
                    this.initializationAttempts = 0; // Reset counter on success
                    resolve();
                };
            });
        } catch (error) {
            // If initialization fails, try to recover by deleting the database and trying again
            if (this.initializationAttempts < this.MAX_INIT_ATTEMPTS) {
                console.log('Attempting database recovery...');
                await new Promise<void>((resolve, reject) => {
                    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
                    deleteRequest.onerror = () => reject(deleteRequest.error);
                    deleteRequest.onsuccess = () => resolve();
                });
                return this.initDB(); // Recursive call for retry
            }
            throw error;
        }
    }

    private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
        // Wait for initialization without blocking
        const initPromise = this.dbInitialized.catch(async error => {
            console.error('Database initialization failed, attempting recovery in background');
            // Start recovery in background
            this.dbInitialized = this.initDB();
            try {
                await this.dbInitialized;
                this.initResolve();
            } catch (error) {
                this.initReject(error instanceof Error ? error : new Error('Unknown recovery error'));
                throw error;
            }
        });

        // Return null for store operations if database isn't ready
        try {
            await initPromise;
        } catch (error) {
            console.error('Could not initialize database:', error);
            return Promise.reject(error);
        }

        if (!this.db) {
            return Promise.reject(new Error('Database not initialized'));
        }

        const db = this.db as IDBDatabase;
        // Verify object store exists
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            // Start recovery in background
            db.close();
            this.db = null;
            this.dbInitialized = this.initDB();
            this.dbInitialized.then(() => {
                this.initResolve();
            }).catch(error => {
                this.initReject(error instanceof Error ? error : new Error('Unknown store error'));
            });
            return Promise.reject(new Error('Store not found, recovery started'));
        }

        try {
            const transaction = db.transaction(STORE_NAME, mode);
            return transaction.objectStore(STORE_NAME);
        } catch (error) {
            // Start recovery in background
            this.db = null;
            this.dbInitialized = this.initDB();
            this.dbInitialized.then(() => {
                this.initResolve();
            }).catch(error => {
                this.initReject(error instanceof Error ? error : new Error('Unknown transaction error'));
            });
            return Promise.reject(error);
        }
    }

    private async cleanExpiredEmotes(): Promise<void> {
        try {
            const store = await this.getStore('readwrite');
            const request = store.openCursor();
            
            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    const emoteData = cursor.value as UserEmotes;
                    if (emoteData.expiresAt && emoteData.expiresAt < Date.now()) {
                        cursor.delete();
                    }
                    cursor.continue();
                }
            };
        } catch (error) {
            console.error('Error cleaning expired emotes:', error);
            // Don't throw error for background cleanup operations
        }
    }

    async storeUserEmotes(userId: string, emotes: any[]): Promise<void> {
        try {
            const store = await this.getStore('readwrite');
            return new Promise((resolve, reject) => {
                const now = Date.now();
                const request = store.put({
                    userId,
                    emotes,
                    timestamp: now,
                    expiresAt: now + CACHE_DURATION
                });
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error storing user emotes:', error);
            // Don't throw error for storage operations
            return Promise.resolve();
        }
    }

    async getUserEmotes(userId: string): Promise<UserEmotes | null> {
        try {
            const store = await this.getStore();
            return new Promise((resolve, reject) => {
                const request = store.get(userId);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error getting user emotes:', error);
            return null;
        }
    }

    async clearUserEmotes(userId: string): Promise<void> {
        try {
            const store = await this.getStore('readwrite');
            return new Promise((resolve, reject) => {
                const request = store.delete(userId);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error clearing user emotes:', error);
            // Don't throw error for deletion operations
            return Promise.resolve();
        }
    }
}

export const EmoteStore = new EmoteStorage();
