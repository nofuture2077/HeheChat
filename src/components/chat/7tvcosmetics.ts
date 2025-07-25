import { Database } from "@/commons/database";

// Store name for 7TV cosmetics
export const SEVENTV_COSMETICS_STORE = 'seventvCosmetics';

interface UserCosmetics {
    userId: string;
    cosmetics: SevenTVUserCosmetics;
    timestamp: number;
    expiresAt: number; // Timestamp when cache should be invalidated
}

export interface SevenTVPaint {
    id: string;
    kind: string;
    name: string;
    function?: string;
    color?: number;
    angle?: number;
    shape?: string;
    image_url?: string;
    repeat?: boolean;
    stops: Array<{
        at: number;
        color: number;
    }>;
    shadows?: Array<{
        x_offset: number;
        y_offset: number;
        radius: number;
        color: number;
    }>;
}

export interface SevenTVBadge {
    id: string;
    kind: string;
    name: string;
    tooltip?: string;
    tag?: string;
}

export interface SevenTVUserCosmetics {
    userId: string;
    username: string;
    display_name?: string;
    paint?: SevenTVPaint;
    badge?: SevenTVBadge;
    adjustedColors: {
        light: string;
        dark: string;
    };
    paintInfo: {
        backgroundImage: string | null;
        shadow: string | null;
    };
}

// Cache duration: 24 hours
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export class SevenTVCosmeticsStorage {
    constructor() {
        this.cleanExpiredCosmetics();
    }

    private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
        return Database.getStore(SEVENTV_COSMETICS_STORE, mode);
    }

    private async cleanExpiredCosmetics(): Promise<void> {
        try {
            const store = await this.getStore('readwrite');
            const request = store.openCursor();
            
            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    const cosmeticsData = cursor.value as UserCosmetics;
                    if (cosmeticsData.expiresAt && cosmeticsData.expiresAt < Date.now()) {
                        cursor.delete();
                    }
                    cursor.continue();
                }
            };
        } catch (error) {
            console.error('Error cleaning expired 7TV cosmetics:', error);
        }
    }

    /**
     * Store user cosmetics
     * @param userId The user ID
     * @param cosmetics The cosmetics data to store
     */
    async storeUserCosmetics(userId: string, cosmetics: SevenTVUserCosmetics): Promise<void> {
        try {
            const store = await this.getStore('readwrite');
            return new Promise((resolve, reject) => {
                const now = Date.now();
                const request = store.put({
                    userId,
                    cosmetics,
                    timestamp: now,
                    expiresAt: now + CACHE_DURATION
                });
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error storing 7TV cosmetics:', error);
            throw error;
        }
    }

    /**
     * Get user cosmetics
     * @param userId The user ID
     */
    async getUserCosmetics(userId: string): Promise<UserCosmetics | null> {
        try {
            const store = await this.getStore();
            return new Promise((resolve, reject) => {
                const request = store.get(userId);
                request.onsuccess = () => {
                    const result = request.result;
                    // Check if cache is still valid
                    if (result && result.expiresAt > Date.now()) {
                        resolve(result);
                    } else {
                        resolve(null);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error getting 7TV cosmetics:', error);
            return null;
        }
    }

    /**
     * Clear user cosmetics
     * @param userId The user ID
     */
    async clearUserCosmetics(userId: string): Promise<void> {
        try {
            const store = await this.getStore('readwrite');
            return new Promise((resolve, reject) => {
                const request = store.delete(userId);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error clearing 7TV cosmetics:', error);
            throw error;
        }
    }

    /**
     * Check if user cosmetics exist and are valid
     * @param userId The user ID
     */
    async hasValidCosmetics(userId: string): Promise<boolean> {
        const cosmetics = await this.getUserCosmetics(userId);
        return cosmetics !== null;
    }
}

/**
 * Utility functions for 7TV cosmetics processing
 */
export class SevenTVCosmeticsUtils {
    /**
     * Convert ARGB color to RGBA format
     * @param color ARGB color value
     */
    static argbToRgba(color: number): string {
        if (color < 0) {
            color = color >>> 0; // Convert negative to unsigned
        }

        const red = (color >> 24) & 0xFF;
        const green = (color >> 16) & 0xFF;
        const blue = (color >> 8) & 0xFF;
        return `rgb(${red}, ${green}, ${blue})`;
    }

    /**
     * Calculate adjusted color for light and dark themes
     * @param baseColor The base color
     */
    static calculateAdjustedColors(baseColor: string): { light: string; dark: string } {
        // For now, return the base color for both themes
        // This can be enhanced with actual color adjustment logic
        return {
            light: baseColor,
            dark: baseColor
        };
    }

    /**
     * Process paint data into paint info
     * @param paint The paint data
     */
    static processPaintInfo(paint: SevenTVPaint | null): {
        backgroundImage: string | null;
        shadow: string | null;
    } {
        if (!paint) {
            return {
                backgroundImage: null,
                shadow: null
            };
        }

        let backgroundImage: string | null = null;
        let shadow: string | null = null;

        // Handle image-based paint
        if (paint.image_url) {
            backgroundImage = `url('${paint.image_url}')`;
        } 
        // Handle gradient-based paint
        else if (paint.stops && paint.stops.length > 0) {
            const colors = paint.stops.map(stop => ({
                at: stop.at,
                color: stop.color
            }));

            const normalizedColors = colors.map((stop, index) => ({
                at: (100 / (colors.length - 1)) * index,
                color: stop.color
            }));

            const gradient = normalizedColors.map(stop =>
                `${this.argbToRgba(stop.color)} ${stop.at}%`
            ).join(', ');

            backgroundImage = `linear-gradient(${paint.angle || 45}deg, ${gradient})`;
        }

        // Handle shadows
        if (paint.shadows && paint.shadows.length > 0) {
            const shadows = paint.shadows.map(shadowData => {
                let rgbaColor = this.argbToRgba(shadowData.color);
                rgbaColor = rgbaColor.replace(/rgba\((\d+), (\d+), (\d+), (\d+(\.\d+)?)\)/, `rgba($1, $2, $3)`);
                return `drop-shadow(${rgbaColor} ${shadowData.x_offset}px ${shadowData.y_offset}px ${shadowData.radius}px)`;
            }).join(' ');

            shadow = shadows;
        }

        return {
            backgroundImage,
            shadow
        };
    }
}

/**
 * 7TV API service for fetching cosmetics
 */
export class SevenTVCosmeticsAPI {
    private static readonly BASE_URL = 'https://7tv.io/v3/gql';

    /**
     * Fetch paint data by paint ID
     * @param paintId The paint ID
     */
    static async fetchPaint(paintId: string): Promise<SevenTVPaint | null> {
        try {
            const response = await fetch(this.BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operationName: 'GetCosmetics',
                    variables: { list: [paintId] },
                    query: `query GetCosmetics($list: [ObjectID!]) {
                        cosmetics(list: $list) {
                            paints {
                                id
                                kind
                                name
                                function
                                color
                                angle
                                shape
                                image_url
                                repeat
                                stops {
                                    at
                                    color
                                }
                                shadows {
                                    x_offset
                                    y_offset
                                    radius
                                    color
                                }
                            }
                        }
                    }`,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            return data.data?.cosmetics?.paints?.[0] || null;
        } catch (error) {
            console.error('Error fetching 7TV paint:', error);
            return null;
        }
    }

    /**
     * Fetch user cosmetics data
     * @param userId The user ID
     */
    static async fetchUserCosmetics(userId: string): Promise<SevenTVUserCosmetics | null> {
        try {
            const response = await fetch(this.BASE_URL, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "query": "query GetUserCurrentCosmetics($id: ObjectID!) { user(id: $id) { id username display_name style { paint { id kind name } badge { id kind name } } } }",
                    "variables": {
                        "id": userId
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            const user = data.data?.user;

            if (!user) {
                return null;
            }

            let paint: SevenTVPaint | null = null;
            let badge: SevenTVBadge | null = null;

            // Fetch paint details if user has paint
            if (user.style?.paint) {
                paint = await this.fetchPaint(user.style.paint.id);
            }

            // Set badge if user has badge
            if (user.style?.badge) {
                badge = user.style.badge;
            }

            // Process paint info
            const paintInfo = SevenTVCosmeticsUtils.processPaintInfo(paint);

            // Calculate adjusted colors
            const baseColor = paint?.color ? SevenTVCosmeticsUtils.argbToRgba(paint.color) : '#ffffff';
            const adjustedColors = SevenTVCosmeticsUtils.calculateAdjustedColors(baseColor);

            return {
                userId,
                username: user.username,
                display_name: user.display_name,
                paint: paint || undefined,
                badge: badge || undefined,
                adjustedColors,
                paintInfo
            };
        } catch (error) {
            console.error('Error fetching 7TV user cosmetics:', error);
            return null;
        }
    }
}

// Export singleton instance
export const SevenTVCosmeticsStore = new SevenTVCosmeticsStorage();
