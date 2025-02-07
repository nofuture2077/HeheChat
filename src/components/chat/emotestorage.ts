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

    constructor() {
        this.dbInitialized = this.initDB();
        // Schedule cleanup instead of blocking initialization
        this.scheduleCleanup();
    }

    private scheduleCleanup() {
        if (this.cleanupScheduled) return;
        this.cleanupScheduled = true;
        // Run cleanup after initialization completes
        this.dbInitialized.then(() => {
            this.cleanExpiredEmotes();
            this.cleanupScheduled = false;
        }).catch(console.error);
    }

    private async initDB(): Promise<void> {

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error("Error opening IndexedDB:", request.error);
                reject(request.error);
            };

            request.onupgradeneeded = (event) => {
                console.log('Database upgrade needed, creating store...');
                const db = (event.target as IDBOpenDBRequest).result;
                
                // Always recreate the store during upgrade
                if (db.objectStoreNames.contains(STORE_NAME)) {
                    db.deleteObjectStore(STORE_NAME);
                }
                db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database initialized successfully');
                
                // Verify store exists
                if (!this.db.objectStoreNames.contains(STORE_NAME)) {
                    reject(new Error(`Store ${STORE_NAME} not found after initialization`));
                    return;
                }
                
                resolve();
            };
        });
    }

    private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
        if (!this.db) {
            try {
                await this.dbInitialized;
            } catch (error) {
                console.error('Error waiting for DB initialization:', error);
                // Only try to re-initialize if really needed
                await this.initDB();
            }
            
            if (!this.db) {
                throw new Error('Database initialization failed');
            }
        }

        if (!this.db.objectStoreNames.contains(STORE_NAME)) {
            throw new Error(`Store ${STORE_NAME} not found`);
        }

        return this.db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
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
            throw error;
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
            throw error;
        }
    }
}

export const EmoteStore = new EmoteStorage();
