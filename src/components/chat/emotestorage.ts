import { Database, EMOTES_STORE } from "@/commons/database";

interface UserEmotes {
    userId: string;
    emotes: any[];
    timestamp: number;
    expiresAt: number; // Timestamp when cache should be invalidated
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export class EmoteStorage {
    constructor() {
        this.cleanExpiredEmotes(); // Clean expired emotes on initialization
    }

    private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
        return Database.getStore(EMOTES_STORE, mode);
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
