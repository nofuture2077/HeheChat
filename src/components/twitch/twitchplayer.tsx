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
    audioOnly?: boolean;
}

export function TwitchPlayer({ audioOnly = false }: TwitchPlayerProps) {
    const config = useContext(ConfigContext);
    const loginContext = useContext(LoginContextContext);
    const playerRef = useRef<TwitchEmbed | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const channel = config.getChatChannel();
    const [dimensions, setDimensions] = useState(getDimension);
    const [w, h] = dimensions;
    const containerId = 'twitch-embed';

    const createPlayer = useCallback(() => {
        if (!channel || !containerRef.current || !window.Twitch) return;

        // Clean up existing player
        if (playerRef.current) {
            playerRef.current = null;
        }
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }

        const options = {
            width: w,
            height: h,
            channel,
            parent: [window.location.hostname],
            autoplay: true,
            layout: "video",
            muted: !audioOnly
        };

        const embed = new window.Twitch.Embed(containerId, options);
        embed.addEventListener('ready', () => {
            playerRef.current = embed;
            
            if (loginContext.accessToken) {
                const player = embed.getPlayer();
                player.setQuality(config.videoQuality);
                player.setMuted(!audioOnly);
            }
        });
    }, [channel, audioOnly, loginContext.accessToken, w, h]);

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

        const player = playerRef.current.getPlayer();
        player.setChannel(channel);
        player.setMuted(!audioOnly);
        player.setQuality(config.videoQuality);
    }, [channel, audioOnly]);

    if (!channel) return null;

    return (
        <div 
            id={containerId}
            ref={containerRef}
            style={{ width: w, height: h }}
        />
    );
}
