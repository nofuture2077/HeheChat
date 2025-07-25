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

        // 7TV uses ARGB format: Alpha (bits 24-31), Red (bits 16-23), Green (bits 8-15), Blue (bits 0-7)
        const alpha = (color >> 24) & 0xFF;
        const red = (color >> 16) & 0xFF;
        const green = (color >> 8) & 0xFF;
        const blue = color & 0xFF;
        
        // Return RGB format (ignore alpha for now)
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
            // Sort stops by position to ensure correct gradient order
            const sortedStops = paint.stops
                .map(stop => ({
                    at: stop.at * 100, // Convert from 0-1 range to 0-100% range
                    color: stop.color
                }))
                .sort((a, b) => a.at - b.at);

            const gradient = sortedStops.map(stop =>
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
    private static readonly GQL_URL = 'https://7tv.io/v3/gql';
    private static readonly REST_URL = 'https://7tv.io/v3';

    /**
     * Fetch paint data by paint ID
     * @param paintId The paint ID
     */
    static async fetchPaint(paintId: string): Promise<SevenTVPaint | null> {
        try {
            const response = await fetch(this.GQL_URL, {
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
     * Fetch user cosmetics data using REST API only
     * @param twitchUserId The Twitch user ID
     */
    static async fetchUserCosmetics(twitchUserId: string): Promise<SevenTVUserCosmetics | null> {
        try {
            // Use REST API to fetch user by Twitch ID - this includes style data
            const userResponse = await fetch(`${this.REST_URL}/users/twitch/${twitchUserId}`);

            if (!userResponse.ok) {
                if (userResponse.status === 404) {
                    // User doesn't exist on 7TV - return null so we use normal username color
                    console.log('User not found on 7TV:', twitchUserId);
                    return null;
                }
                throw new Error(`HTTP error! Status: ${userResponse.status}`);
            }

            const user = await userResponse.json();

            if (!user || !user.id) {
                // User exists but no valid data - return null so we use normal username color
                console.log('Invalid user data from 7TV:', twitchUserId);
                return null;
            }

            console.log('Found 7TV user:', user.username, 'User object:', user);

            // The REST API returns the user with style directly
            let paint: SevenTVPaint | null = null;
            let badge: SevenTVBadge | null = null;

            if (user.style?.paint) {
                console.log('User has paint, fetching paint details:', user.style.paint.id);
                paint = await this.fetchPaint(user.style.paint.id);
                console.log('Fetched paint data:', paint);
            } else {
                console.log('User has no paint');
            }

            // Set badge if user has badge
            if (user.style?.badge) {
                badge = user.style.badge;
            }

            // If user has 7TV account but no paint, return null so we use normal username color
            if (!paint) {
                console.log('User has 7TV account but no paint, using normal username color');
                return null;
            }

            // Process paint info
            const paintInfo = SevenTVCosmeticsUtils.processPaintInfo(paint);
            console.log('Processed paint info:', paintInfo);

            // Calculate adjusted colors
            const baseColor = paint?.color ? SevenTVCosmeticsUtils.argbToRgba(paint.color) : '#ffffff';
            const adjustedColors = SevenTVCosmeticsUtils.calculateAdjustedColors(baseColor);

            console.log('7TV user cosmetics result:', {
                userId: twitchUserId,
                username: user.username,
                hasPaint: !!paint,
                paintName: paint?.name,
                adjustedColors,
                paintInfo
            });

            return {
                userId: twitchUserId, // Store the original Twitch user ID for caching
                username: user.username,
                display_name: user.display_name,
                paint: paint,
                badge: badge || undefined,
                adjustedColors,
                paintInfo
            };
        } catch (error) {
            console.error('Error fetching 7TV user cosmetics:', error);
            // Return null on error so we use normal username color
            return null;
        }
    }
}

// Export singleton instance
export const SevenTVCosmeticsStore = new SevenTVCosmeticsStorage();
