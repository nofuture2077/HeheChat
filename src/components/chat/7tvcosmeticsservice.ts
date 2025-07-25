import { SevenTVCosmeticsStore, SevenTVCosmeticsAPI, SevenTVUserCosmetics, SevenTVCosmeticsUtils } from './7tvcosmetics';

/**
 * Service for managing 7TV user cosmetics with caching
 */
export class SevenTVCosmeticsService {
    private static instance: SevenTVCosmeticsService;
    private loadingPromises: Map<string, Promise<SevenTVUserCosmetics | null>> = new Map();

    private constructor() {}

    static getInstance(): SevenTVCosmeticsService {
        if (!SevenTVCosmeticsService.instance) {
            SevenTVCosmeticsService.instance = new SevenTVCosmeticsService();
        }
        return SevenTVCosmeticsService.instance;
    }

    /**
     * Get user cosmetics with caching
     * @param userId The 7TV user ID
     * @param forceRefresh Force refresh from API
     */
    async getUserCosmetics(userId: string, forceRefresh: boolean = false): Promise<SevenTVUserCosmetics | null> {
        // Check if we're already loading this user's cosmetics
        if (this.loadingPromises.has(userId)) {
            return this.loadingPromises.get(userId)!;
        }

        // Check cache first if not forcing refresh
        if (!forceRefresh) {
            const cached = await SevenTVCosmeticsStore.getUserCosmetics(userId);
            if (cached) {
                return cached.cosmetics;
            }
        }

        // Create loading promise
        const loadingPromise = this.fetchAndCacheCosmetics(userId);
        this.loadingPromises.set(userId, loadingPromise);

        try {
            const result = await loadingPromise;
            return result;
        } finally {
            // Clean up loading promise
            this.loadingPromises.delete(userId);
        }
    }

    /**
     * Fetch cosmetics from API and cache them
     * @param userId The 7TV user ID
     */
    private async fetchAndCacheCosmetics(userId: string): Promise<SevenTVUserCosmetics | null> {
        try {
            const cosmetics = await SevenTVCosmeticsAPI.fetchUserCosmetics(userId);
            
            if (cosmetics) {
                // Cache the cosmetics
                await SevenTVCosmeticsStore.storeUserCosmetics(userId, cosmetics);
                return cosmetics;
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching 7TV cosmetics for user:', userId, error);
            return null;
        }
    }

    /**
     * Apply cosmetics to a DOM element
     * @param element The DOM element to apply cosmetics to
     * @param cosmetics The cosmetics data
     * @param theme The current theme ('light' or 'dark')
     */
    applyCosmetics(element: HTMLElement, cosmetics: SevenTVUserCosmetics, theme: 'light' | 'dark' = 'light'): void {
        if (!cosmetics.paint) {
            // Reset to default if no paint
            element.style.backgroundImage = '';
            element.style.filter = '';
            element.style.color = theme === 'dark' ? '#ffffff' : '#000000';
            return;
        }

        const { paintInfo, adjustedColors } = cosmetics;

        // Apply background image (gradient or image)
        if (paintInfo.backgroundImage) {
            element.style.backgroundImage = paintInfo.backgroundImage;
            element.style.backgroundClip = 'text';
            element.style.webkitBackgroundClip = 'text';
            element.style.color = 'transparent';
            
            // Force a reflow to ensure correct dimensions
            element.offsetHeight;
            
            // Adjust background size based on text dimensions
            const textWidth = element.scrollWidth;
            const textHeight = element.scrollHeight;
            element.style.backgroundSize = `${textWidth}px ${textHeight}px`;
            element.style.backgroundPosition = '0 0';
        } else {
            // Use adjusted color for the theme
            element.style.color = adjustedColors[theme];
        }

        // Apply shadows
        if (paintInfo.shadow) {
            element.style.filter = paintInfo.shadow;
        }
    }

    /**
     * Get cosmetics for multiple users in batch
     * @param userIds Array of user IDs
     * @param forceRefresh Force refresh from API
     */
    async getBatchUserCosmetics(userIds: string[], forceRefresh: boolean = false): Promise<Map<string, SevenTVUserCosmetics | null>> {
        const results = new Map<string, SevenTVUserCosmetics | null>();
        
        // Process all users concurrently
        const promises = userIds.map(async (userId) => {
            const cosmetics = await this.getUserCosmetics(userId, forceRefresh);
            results.set(userId, cosmetics);
        });

        await Promise.all(promises);
        return results;
    }

    /**
     * Clear cached cosmetics for a user
     * @param userId The user ID
     */
    async clearUserCosmetics(userId: string): Promise<void> {
        await SevenTVCosmeticsStore.clearUserCosmetics(userId);
    }

    /**
     * Check if user has cached cosmetics
     * @param userId The user ID
     */
    async hasValidCosmetics(userId: string): Promise<boolean> {
        return SevenTVCosmeticsStore.hasValidCosmetics(userId);
    }

    /**
     * Create a default cosmetics object for users without 7TV cosmetics
     * @param userId The user ID
     * @param username The username
     */
    createDefaultCosmetics(userId: string, username: string): SevenTVUserCosmetics {
        return {
            userId,
            username,
            adjustedColors: {
                light: '#000000',
                dark: '#ffffff'
            },
            paintInfo: {
                backgroundImage: null,
                shadow: null
            }
        };
    }

    /**
     * Enhanced color adjustment for better theme compatibility
     * @param baseColor The base color
     * @param theme The target theme
     */
    static adjustColorForTheme(baseColor: string, theme: 'light' | 'dark'): string {
        // This is a placeholder for more sophisticated color adjustment
        // You can implement actual color manipulation logic here
        if (theme === 'dark') {
            // For dark theme, ensure colors are bright enough
            return baseColor;
        } else {
            // For light theme, ensure colors are dark enough
            return baseColor;
        }
    }
}

// Export singleton instance
export const SevenTVCosmeticsServiceInstance = SevenTVCosmeticsService.getInstance();

/**
 * Hook for React components to use 7TV cosmetics
 */
export function useSevenTVCosmetics() {
    const service = SevenTVCosmeticsServiceInstance;

    return {
        getUserCosmetics: (userId: string, forceRefresh?: boolean) => 
            service.getUserCosmetics(userId, forceRefresh),
        getBatchUserCosmetics: (userIds: string[], forceRefresh?: boolean) => 
            service.getBatchUserCosmetics(userIds, forceRefresh),
        applyCosmetics: (element: HTMLElement, cosmetics: SevenTVUserCosmetics, theme?: 'light' | 'dark') => 
            service.applyCosmetics(element, cosmetics, theme),
        clearUserCosmetics: (userId: string) => 
            service.clearUserCosmetics(userId),
        hasValidCosmetics: (userId: string) => 
            service.hasValidCosmetics(userId),
        createDefaultCosmetics: (userId: string, username: string) => 
            service.createDefaultCosmetics(userId, username)
    };
}
