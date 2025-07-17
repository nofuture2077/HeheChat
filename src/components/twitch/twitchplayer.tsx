import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { ConfigContext } from "../../ApplicationContext";
import { LoginContextContext } from "../../ApplicationContext";
import { useViewportWidthCallback } from "../../commons/helper";

// Twitch Player Types
interface TwitchPlayer {
    setChannel: (channel: string) => void;
    setQuality: (quality: string) => void;
    setMuted: (muted: boolean) => void;
    getMuted: () => boolean;
    pause: () => void;
    play: () => void;
}

interface TwitchEmbed {
    addEventListener: (event: string, callback: () => void) => void;
    getPlayer: () => TwitchPlayer;
}

interface TwitchEmbedConstructor {
    new (elementId: string, options: {
        width: number;
        height: number;
        channel?: string;
        video?: string;
        collection?: string;
        parent: string[];
        autoplay?: boolean;
        layout?: string;
        muted?: boolean;
        storage?: { enabled: boolean };
    }): TwitchEmbed;
}

declare global {
    interface Window {
        Twitch?: {
            Embed: TwitchEmbedConstructor;
        };
    }
}

export function getDimension() {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    const w = Math.min(vw, 600);
    const h = (w / 16 * 9);
    return [w, h];
}

export function getFullDimension() {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    return [vw, vh];
}

interface DebouncedFunction<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): void;
    cancel: () => void;
}

function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): DebouncedFunction<T> {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const debounced = (...args: Parameters<T>) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            func(...args);
            timeout = null;
        }, wait);
    };

    debounced.cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    return debounced;
}

interface TwitchPlayerProps {
    fullSize?: boolean;
    customWidth?: number;
    customHeight?: number;
    muted?: boolean;
}

export function TwitchPlayer(props: TwitchPlayerProps) {
    const config = useContext(ConfigContext);
    const loginContext = useContext(LoginContextContext);
    const playerRef = useRef<TwitchEmbed | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const channel = config.getChatChannel();
    const [dimensions, setDimensions] = useState(() => {
        if (props.fullSize) {
            return getFullDimension();
        }
        return getDimension();
    });
    const [hasStorageAccess, setHasStorageAccess] = useState(true);
    
    // Use custom dimensions if provided, otherwise use calculated dimensions
    const w = props.customWidth || dimensions[0];
    const h = props.customHeight || dimensions[1];
    const containerId = props.fullSize ? 'twitch-embed-fullsize' : 'twitch-embed';

    // Request storage access for Twitch embed
    const requestStorageAccessForTwitch = useCallback(async () => {
        // Check if Storage Access API is available
        if (!('requestStorageAccess' in document)) {
            console.warn('Storage Access API not supported');
            return true; // Assume access if API not available
        }

        try {
            // Check if we already have access
            const hasAccess = await document.hasStorageAccess();
            if (hasAccess) {
                setHasStorageAccess(true);
                return true;
            }

            // Request access (must be called from user gesture)
            await document.requestStorageAccess();
            console.log('Storage access granted for Twitch embed');
            setHasStorageAccess(true);
            return true;
        } catch (error) {
            console.error('Failed to get storage access for Twitch:', error);
            setHasStorageAccess(false);
            return false;
        }
    }, []);

    const createPlayer = useCallback(async () => {
        if (!channel || !containerRef.current || !window.Twitch) return;

        // Request storage access before creating the embed
        const storageAccess = await requestStorageAccessForTwitch();

        // Clean up existing player
        if (playerRef.current) {
            playerRef.current = null;
        }
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }

        const isMuted = props.muted !== undefined ? props.muted : true;

        const options = {
            width: w,
            height: h,
            channel,
            parent: [window.location.hostname],
            autoplay: true,
            layout: "video",
            muted: isMuted,
            storage: { enabled: storageAccess }
        };

        const embed = new window.Twitch.Embed(containerId, options);
        embed.addEventListener('ready', () => {
            playerRef.current = embed;
            
            if (loginContext.accessToken) {
                const player = embed.getPlayer();
                player.setQuality(config.videoQuality);
                player.setMuted(isMuted);
            }
        });
    }, [channel, loginContext.accessToken, w, h, props.muted, requestStorageAccessForTwitch]);

    // Handle resize
    const handleResize = useCallback(
        debounce(() => {
            const [newW, newH] = getDimension();
            setDimensions([newW, newH]);
        }, 250),
        []
    );

    useViewportWidthCallback(handleResize);

    // Create player on mount or when script loads
    useEffect(() => {
        if (!window.Twitch && !document.getElementById('twitch-embed-script')) {
            const script = document.createElement('script');
            script.id = 'twitch-embed-script';
            script.src = 'https://player.twitch.tv/js/embed/v1.js';
            script.async = true;
            script.onload = createPlayer;
            document.body.appendChild(script);
        } else {
            createPlayer();
        }

        return () => {
            handleResize.cancel();
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
            playerRef.current = null;
        };
    }, [createPlayer]);

    // Handle channel or audio changes
    useEffect(() => {
        if (!channel || !playerRef.current) return;

        const isMuted = props.muted !== undefined ? props.muted : true;
        const player = playerRef.current.getPlayer();
        player.setChannel(channel);
        player.setMuted(isMuted);
        player.setQuality(config.videoQuality);
    }, [channel, props.muted]);

    if (!channel) return null;

    return (
        <>
            <style>
                {`p[data-test-selector="stream-info-card-component__description"] {display: none !important;}`}
            </style>
            <div 
                id={containerId}
                ref={containerRef}
                style={{ width: w, height: h }}
            />
        </>
    );
}
