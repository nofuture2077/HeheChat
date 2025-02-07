import { BaseStorage, StoreSchema } from "@/commons/database";

const STORE_NAME = 'userEmotes';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface UserEmotes {
    userId: string;
    emotes: any[];
    timestamp: number;
    expiresAt: number; // Timestamp when cache should be invalidated
}

const emoteStoreSchema: StoreSchema = {
    name: STORE_NAME,
    keyPath: 'userId'
};

class EmoteStorage extends BaseStorage<UserEmotes> {
    constructor() {
        super(emoteStoreSchema);
        this.cleanExpiredEmotes(); // Clean expired emotes on initialization
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
        const now = Date.now();
        await this.put({
            userId,
            emotes,
            timestamp: now,
            expiresAt: now + CACHE_DURATION
        });
    }

    async getUserEmotes(userId: string): Promise<UserEmotes | null> {
        return this.get(userId);
    }

    async clearUserEmotes(userId: string): Promise<void> {
        return this.delete(userId);
    }
}

export const EmoteStore = new EmoteStorage();
