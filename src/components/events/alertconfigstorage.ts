import { DB_VERSION, DB_NAME } from "@/commons/config";

// Constants for IndexedDB
const STORE_NAME = 'alertConfigs';

interface AlertConfigMeta {
    hash: string;
    channel: string;
    updatedAt: string;
}

interface AlertConfig {
    config: any;
    meta: AlertConfigMeta;
}


export class AlertConfigStorage {
    private db: IDBDatabase | null = null;
    private baseUrl: string;
    private dbInitialized: Promise<void>;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.dbInitialized = this.initDB();
    }

    private initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error("Error opening IndexedDB");
                reject(request.error);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'meta.channel' });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
        });
    }

    private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
        await this.dbInitialized;
        if (!this.db) throw new Error('Database not initialized');
        const transaction = this.db.transaction(STORE_NAME, mode);
        return transaction.objectStore(STORE_NAME);
    }

    async getConfigMeta(channel: string): Promise<AlertConfigMeta | null> {
        try {
            const state = localStorage.getItem('hehe-token_state') || '';
            const sink = localStorage.getItem('hehe-sink') || '';
            const response = await fetch(this.baseUrl + '/event/config/meta?' + [['channels', channel].join('='), ['state', state].join('='), ['sink', sink].join('='), ['t', Date.now()].join('=')].join('&'));
            if (!response.ok) throw new Error('Failed to fetch config meta');
            return await response.json().then(r => r[channel]);
        } catch (error) {
            console.error('Error fetching config meta:', error);
            return null;
        }
    }

    async getFullConfig(channel: string): Promise<any> {
        try {
            const state = localStorage.getItem('hehe-token_state') || '';
            const sink = localStorage.getItem('hehe-sink') || '';
            const response = await fetch(this.baseUrl + '/event/config?' + [['channels', channel].join('='), ['state', state].join('='), ['sink', sink].join('='), ['t', Date.now()].join('=')].join('&'));
            if (!response.ok) throw new Error('Failed to fetch full config');
            return await response.json().then(r => r[channel]);
        } catch (error) {
            console.error('Error fetching full config:', error);
            throw error;
        }
    }

    async getCachedConfig(channel: string): Promise<{config: any, meta: AlertConfigMeta} | null> {
        try {
            const store = await this.getStore();
            return new Promise((resolve, reject) => {
                const request = store.get(channel);
                request.onsuccess = () => {
                    const result = request.result;
                    if (!result) return resolve(null);
                    // Return just the config and meta parts
                    const { config, meta } = result;
                    resolve({ config, meta });
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error getting cached config:', error);
            return null;
        }
    }

    async storeConfig(config: any, meta: AlertConfigMeta): Promise<void> {
        try {
            const store = await this.getStore('readwrite');
            return new Promise((resolve, reject) => {
                const request = store.put({
                    meta,
                    config
                });
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error storing config:', error);
            throw error;
        }
    }

    async getConfig(channel: string): Promise<any> {
        try {
            // First, get the meta data from the server
            const meta = await this.getConfigMeta(channel);
            if (!meta) return;

            // Check if we have a cached version
            meta.channel = channel;
            const cached = await this.getCachedConfig(channel);
            // If we have a cached version and the hash matches, use it
            if (cached && cached.meta.hash === meta.hash) {
                return cached.config;
            }

            // Otherwise, fetch the full config
            const fullConfig = await this.getFullConfig(channel);
            fullConfig.meta.channel = channel;
            // Store the new config in IndexedDB
            await this.storeConfig(fullConfig, meta);

            return fullConfig;
        } catch (error) {
            console.error('Error in getConfig:', error);
            throw error;
        }
    }
}


export const AlertConfig = new AlertConfigStorage(import.meta.env.VITE_BACKEND_URL);