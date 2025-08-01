import { useState, useEffect, useRef, useCallback } from 'react';
import { SevenTVUserCosmetics } from './7tvcosmetics';
import { SevenTVCosmeticsServiceInstance } from './7tvcosmeticsservice';

interface Use7TVCosmeticsOptions {
    userId?: string;
    username?: string;
    theme?: 'light' | 'dark';
    autoApply?: boolean;
    forceRefresh?: boolean;
}

interface Use7TVCosmeticsReturn {
    cosmetics: SevenTVUserCosmetics | null;
    loading: boolean;
    error: string | null;
    elementRef: React.RefObject<HTMLElement>;
    applyCosmetics: (element?: HTMLElement) => void;
    refreshCosmetics: () => Promise<void>;
    hasCosmetics: boolean;
}

/**
 * React hook for managing 7TV cosmetics
 */
export function use7TVCosmetics(options: Use7TVCosmeticsOptions = {}): Use7TVCosmeticsReturn {
    const {
        userId,
        username,
        theme = 'light',
        autoApply = true,
        forceRefresh = false
    } = options;

    const [cosmetics, setCosmetics] = useState<SevenTVUserCosmetics | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const elementRef = useRef<HTMLElement>(null);

    // Fetch cosmetics function
    const fetchCosmetics = useCallback(async (refresh: boolean = false) => {
        if (!userId) {
            if (username) {
                // Create default cosmetics for users without 7TV ID
                const defaultCosmetics = SevenTVCosmeticsServiceInstance.createDefaultCosmetics('', username);
                setCosmetics(defaultCosmetics);
            } else {
                setCosmetics(null);
            }
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await SevenTVCosmeticsServiceInstance.getUserCosmetics(userId, refresh);
            setCosmetics(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cosmetics';
            setError(errorMessage);
            console.error('Error fetching 7TV cosmetics:', err);
            // Set default cosmetics on error
            if (username) {
                const defaultCosmetics = SevenTVCosmeticsServiceInstance.createDefaultCosmetics(userId || '', username);
                setCosmetics(defaultCosmetics);
            }
        } finally {
            setLoading(false);
        }
    }, [userId, username]);

    // Apply cosmetics to element
    const applyCosmetics = useCallback((element?: HTMLElement) => {
        const targetElement = element || elementRef.current;
        if (!targetElement || !cosmetics) return;

        SevenTVCosmeticsServiceInstance.applyCosmetics(targetElement, cosmetics, theme);
    }, [cosmetics, theme]);

    // Refresh cosmetics
    const refreshCosmetics = useCallback(async () => {
        await fetchCosmetics(true);
    }, [fetchCosmetics]);

    // Initial fetch
    useEffect(() => {
        fetchCosmetics(forceRefresh);
    }, [fetchCosmetics, forceRefresh]);

    // Auto-apply cosmetics when they change or theme changes
    useEffect(() => {
        if (autoApply && cosmetics) {
            applyCosmetics();
        }
    }, [cosmetics, theme, autoApply, applyCosmetics]);

    return {
        cosmetics,
        loading,
        error,
        elementRef,
        applyCosmetics,
        refreshCosmetics,
        hasCosmetics: cosmetics?.paint !== undefined || cosmetics?.badge !== undefined
    };
}

/**
 * Hook for batch loading multiple users' cosmetics
 */
export function use7TVCosmeticsBatch(userIds: string[], theme: 'light' | 'dark' = 'light') {
    const [cosmeticsMap, setCosmeticsMap] = useState<Map<string, SevenTVUserCosmetics | null>>(new Map());
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBatchCosmetics = useCallback(async (refresh: boolean = false) => {
        if (userIds.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            const results = await SevenTVCosmeticsServiceInstance.getBatchUserCosmetics(userIds, refresh);
            setCosmeticsMap(results);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch batch cosmetics';
            setError(errorMessage);
            console.error('Error fetching batch 7TV cosmetics:', err);
        } finally {
            setLoading(false);
        }
    }, [userIds]);

    const refreshBatchCosmetics = useCallback(async () => {
        await fetchBatchCosmetics(true);
    }, [fetchBatchCosmetics]);

    const applyBatchCosmetics = useCallback((elements: Map<string, HTMLElement>) => {
        elements.forEach((element, userId) => {
            const cosmetics = cosmeticsMap.get(userId);
            if (cosmetics) {
                SevenTVCosmeticsServiceInstance.applyCosmetics(element, cosmetics, theme);
            }
        });
    }, [cosmeticsMap, theme]);

    useEffect(() => {
        fetchBatchCosmetics();
    }, [fetchBatchCosmetics]);

    return {
        cosmeticsMap,
        loading,
        error,
        refreshBatchCosmetics,
        applyBatchCosmetics,
        getCosmetics: (userId: string) => cosmeticsMap.get(userId) || null,
        hasCosmetics: (userId: string) => cosmeticsMap.get(userId)?.paint !== undefined || cosmeticsMap.get(userId)?.badge !== undefined
    };
}

/**
 * Hook for applying cosmetics to username elements in chat messages
 */
export function use7TVUsernameCosmetics(userId?: string, username?: string, theme: 'light' | 'dark' = 'light') {
    const usernameRef = useRef<HTMLSpanElement>(null);
    const { cosmetics, loading, applyCosmetics, hasCosmetics } = use7TVCosmetics({
        userId,
        username,
        theme,
        autoApply: false // We'll manually apply to avoid conflicts
    });

    // Apply cosmetics specifically to username element
    useEffect(() => {
        if (usernameRef.current && cosmetics) {
            applyCosmetics(usernameRef.current);
        }
    }, [cosmetics, applyCosmetics]);

    return {
        usernameRef,
        cosmetics,
        loading,
        hasCosmetics,
        applyToElement: (element: HTMLElement) => {
            if (cosmetics) {
                SevenTVCosmeticsServiceInstance.applyCosmetics(element, cosmetics, theme);
            }
        }
    };
}
