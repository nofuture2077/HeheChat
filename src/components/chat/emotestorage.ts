import { Database, EMOTES_STORE } from "@/commons/database";

interface UserEmotes {
    userId: string;
    emotes: any[];
    timestamp: number;
    expiresAt: number; // Timestamp when cache should be invalidated
}

// Emote type prefixes for storage
export enum EmotePrefix {
    USER = "user_",
    CHANNEL = "channel_",
    GLOBAL = "global_",
    SEVENTV = "7tv_"
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

    /**
     * Store emotes with a prefixed userId
     * @param prefix The prefix to use (from EmotePrefix enum)
     * @param userId The user ID or identifier
     * @param emotes The emotes to store
     */
    async storeEmotes(prefix: EmotePrefix, userId: string, emotes: any[]): Promise<void> {
        try {
            const prefixedId = `${prefix}${userId}`;
            const store = await this.getStore('readwrite');
            return new Promise((resolve, reject) => {
                const now = Date.now();
                const request = store.put({
                    userId: prefixedId,
                    emotes,
                    timestamp: now,
                    expiresAt: now + CACHE_DURATION
                });
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error storing emotes:', error);
            throw error;
        }
    }

    /**
     * Get emotes with a prefixed userId
     * @param prefix The prefix to use (from EmotePrefix enum)
     * @param userId The user ID or identifier
     */
    async getEmotes(prefix: EmotePrefix, userId: string): Promise<UserEmotes | null> {
        try {
            const prefixedId = `${prefix}${userId}`;
            const store = await this.getStore();
            return new Promise((resolve, reject) => {
                const request = store.get(prefixedId);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error getting emotes:', error);
            return null;
        }
    }

    // Legacy methods for backward compatibility
    async storeUserEmotes(userId: string, emotes: any[]): Promise<void> {
        return this.storeEmotes(EmotePrefix.USER, userId, emotes);
    }

    async getUserEmotes(userId: string): Promise<UserEmotes | null> {
        return this.getEmotes(EmotePrefix.USER, userId);
    }

    async clearEmotes(prefix: EmotePrefix, userId: string): Promise<void> {
        try {
            const prefixedId = `${prefix}${userId}`;
            const store = await this.getStore('readwrite');
            return new Promise((resolve, reject) => {
                const request = store.delete(prefixedId);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error clearing emotes:', error);
            throw error;
        }
    }

    // Legacy method for backward compatibility
    async clearUserEmotes(userId: string): Promise<void> {
        return this.clearEmotes(EmotePrefix.USER, userId);
    }
}

export const EmoteStore = new EmoteStorage();
