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

const NETWORK_TIMEOUT = 5000; // 5 second timeout for network requests
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration
const pendingRequests = new Map<string, Promise<any>>();

export class AlertConfigStorage {
    private db: IDBDatabase | null = null;
    private baseUrl: string;
    private dbInitialized: Promise<void>;
    private lastFetch: Map<string, number> = new Map();
    private initializationAttempts = 0;
    private readonly MAX_INIT_ATTEMPTS = 3;
    private initPromise: Promise<void>;
    private initResolve!: () => void;
    private initReject!: (error: Error) => void;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        // Create a promise that we can resolve/reject from anywhere
        this.initPromise = new Promise<void>((resolve, reject) => {
            this.initResolve = resolve;
            this.initReject = reject;
        });
        // Start initialization in background
        this.dbInitialized = this.initDB();
        this.dbInitialized.then(() => {
            this.initResolve();
        }).catch(error => {
            console.error('Initial database initialization failed:', error);
            this.initReject(error instanceof Error ? error : new Error('Unknown initialization error'));
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
                    
                    // Delete the old store if it exists to ensure clean upgrade
                    if (db.objectStoreNames.contains(STORE_NAME)) {
                        db.deleteObjectStore(STORE_NAME);
                    }
                    
                    // Create the store with proper schema
                    db.createObjectStore(STORE_NAME, { keyPath: 'meta.channel' });
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
                this.initReject(error);
            });
            return Promise.reject(error);
        }
    }

    private async fetchWithTimeout(url: string): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT);
        
        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    private getRequestUrl(endpoint: string, channel: string): string {
        const state = localStorage.getItem('hehe-token_state') || '';
        const sink = localStorage.getItem('hehe-sink') || '';
        return this.baseUrl + endpoint + '?' + [
            ['channels', channel].join('='),
            ['state', state].join('='),
            ['sink', sink].join('='),
            ['t', Date.now()].join('=')
        ].join('&');
    }

    async getConfigMeta(channel: string): Promise<AlertConfigMeta | null> {
        const cacheKey = `meta_${channel}`;
        const lastFetchTime = this.lastFetch.get(cacheKey) || 0;
        
        // Return existing promise if request is pending
        const pending = pendingRequests.get(cacheKey);
        if (pending) return pending;

        // Check if we should use cache
        if (Date.now() - lastFetchTime < CACHE_DURATION) {
            try {
                const cached = await this.getCachedConfig(channel);
                if (cached?.meta) return cached.meta;
            } catch (error) {
                console.warn('Error reading cache:', error);
            }
        }

        const fetchPromise = (async () => {
            try {
                const response = await this.fetchWithTimeout(
                    this.getRequestUrl('/event/config/meta', channel)
                );
                if (!response.ok) throw new Error('Failed to fetch config meta');
                const result = await response.json();
                this.lastFetch.set(cacheKey, Date.now());
                return result[channel];
            } catch (error) {
                console.error('Error fetching config meta:', error);
                // Try to return cached meta on error
                const cached = await this.getCachedConfig(channel);
                return cached?.meta || null;
            } finally {
                pendingRequests.delete(cacheKey);
            }
        })();

        pendingRequests.set(cacheKey, fetchPromise);
        return fetchPromise;
    }

    async getFullConfig(channel: string): Promise<any> {
        const cacheKey = `config_${channel}`;
        const pending = pendingRequests.get(cacheKey);
        if (pending) return pending;

        const fetchPromise = (async () => {
            try {
                const response = await this.fetchWithTimeout(
                    this.getRequestUrl('/event/config', channel)
                );
                if (!response.ok) throw new Error('Failed to fetch full config');
                const result = await response.json();
                return result[channel];
            } catch (error) {
                console.error('Error fetching full config:', error);
                // Try to return cached config on error
                const cached = await this.getCachedConfig(channel);
                if (!cached) throw error;
                return cached.config;
            } finally {
                pendingRequests.delete(cacheKey);
            }
        })();

        pendingRequests.set(cacheKey, fetchPromise);
        return fetchPromise;
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
            // Don't throw error for background storage operations
            return Promise.resolve();
        }
    }

    async getConfig(channel: string): Promise<any> {
        try {
            // Try to get cached config first
            const cached = await this.getCachedConfig(channel);
            
            // Get meta data from server (with built-in caching)
            const meta = await this.getConfigMeta(channel);
            if (!meta) {
                // If no meta available, return cached config or null
                return cached?.config || null;
            }

            meta.channel = channel;
            
            // Use cached version if hash matches
            if (cached?.meta.hash === meta.hash) {
                return cached.config;
            }

            // Fetch full config if needed
            const fullConfig = await this.getFullConfig(channel);
            if (fullConfig) {
                fullConfig.meta.channel = channel;
                // Store in background, don't block
                this.storeConfig(fullConfig, meta).catch(console.error);
                return fullConfig;
            }

            // Fallback to cached version if fetch failed
            return cached?.config || null;
        } catch (error) {
            console.error('Error in getConfig:', error);
            // Return cached version on error
            const cached = await this.getCachedConfig(channel);
            return cached?.config || null;
        }
    }
}

export const AlertConfig = new AlertConfigStorage(import.meta.env.VITE_BACKEND_URL);
