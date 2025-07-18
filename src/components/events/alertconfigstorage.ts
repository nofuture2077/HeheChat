import { Database, ALERT_CONFIG_STORE } from "@/commons/database";

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
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
        return Database.getStore(ALERT_CONFIG_STORE, mode);
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
