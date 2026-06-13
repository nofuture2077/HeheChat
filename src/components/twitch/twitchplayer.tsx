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
    hideViewer?: boolean;
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
    const [isHovered, setIsHovered] = useState(false);
    const [touchTimeout, setTouchTimeout] = useState<NodeJS.Timeout | null>(null);

    // Use custom dimensions if provided, otherwise use calculated dimensions
    const w = props.customWidth || dimensions[0];
    const h = props.customHeight || dimensions[1];
    const containerId = props.fullSize ? 'twitch-embed-fullsize' : 'twitch-embed';

    // Refs so effects that run once can still access the latest values
    const channelRef = useRef(channel);
    channelRef.current = channel;
    const configRef = useRef(config);
    configRef.current = config;
    const loginContextRef = useRef(loginContext);
    loginContextRef.current = loginContext;
    const propsRef = useRef(props);
    propsRef.current = props;
    const dimensionsRef = useRef({ w, h });
    dimensionsRef.current = { w, h };
    const containerIdRef = useRef(containerId);
    containerIdRef.current = containerId;

    // Create the player exactly once on mount (or when the Twitch script first loads).
    // All subsequent changes (channel, quality, size) are handled by separate effects below.
    useEffect(() => {
        const initPlayer = async () => {
            if (!channelRef.current || !containerRef.current || !window.Twitch) return;

            let storageAccess = true;
            if ('requestStorageAccess' in document) {
                try {
                    storageAccess = await document.hasStorageAccess();
                    if (!storageAccess) {
                        await document.requestStorageAccess();
                        storageAccess = true;
                    }
                } catch {
                    storageAccess = false;
                }
            }


            if (playerRef.current) playerRef.current = null;
            if (containerRef.current) containerRef.current.innerHTML = '';

            const isMuted = propsRef.current.muted !== undefined ? propsRef.current.muted : true;
            const { w: currentW, h: currentH } = dimensionsRef.current;

            const embed = new window.Twitch!.Embed(containerIdRef.current, {
                width: currentW,
                height: currentH,
                channel: channelRef.current,
                parent: [window.location.hostname],
                autoplay: true,
                layout: "video",
                muted: isMuted,
                storage: { enabled: storageAccess }
            });

            embed.addEventListener('ready', () => {
                playerRef.current = embed;
                const player = embed.getPlayer();
                if (loginContextRef.current.accessToken) {
                    player.setQuality(configRef.current.videoQuality);
                }
                player.setMuted(isMuted);

                // Hide viewer count bar if needed
                const style = document.createElement('style');
                style.textContent = `.tw-card-body { display: none !important; }`;
                document.head.appendChild(style);
            });
        };

        if (!window.Twitch && !document.getElementById('twitch-embed-script')) {
            const script = document.createElement('script');
            script.id = 'twitch-embed-script';
            script.src = 'https://player.twitch.tv/js/embed/v1.js';
            script.async = true;
            script.onload = () => initPlayer();
            document.body.appendChild(script);
        } else {
            initPlayer();
        }

        return () => {
            if (containerRef.current) containerRef.current.innerHTML = '';
            playerRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle resize — update iframe dimensions without recreating the player
    const handleResize = useCallback(
        debounce(() => {
            const [newW, newH] = getDimension();
            setDimensions([newW, newH]);
        }, 250),
        []
    );
    useViewportWidthCallback(handleResize);

    useEffect(() => {
        if (!containerRef.current) return;
        const iframe = containerRef.current.querySelector('iframe');
        if (iframe) {
            iframe.width = String(w);
            iframe.height = String(h);
        }
    }, [w, h]);

    // Handle channel switches — call setChannel() on the existing player, no recreation
    useEffect(() => {
        if (!channel || !playerRef.current) return;
        const isMuted = props.muted !== undefined ? props.muted : true;
        const player = playerRef.current.getPlayer();
        player.setChannel(channel);
        player.setMuted(isMuted);
        player.setQuality(config.videoQuality);
    }, [channel, props.muted]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleTouchStart = () => {
        setIsHovered(true);
        // Clear any existing timeout
        if (touchTimeout) {
            clearTimeout(touchTimeout);
        }
        // Hide the mask after 3 seconds on mobile
        const timeout = setTimeout(() => {
            setIsHovered(false);
        }, 3000);
        setTouchTimeout(timeout);
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
        // Clear touch timeout if mouse is used
        if (touchTimeout) {
            clearTimeout(touchTimeout);
            setTouchTimeout(null);
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        // Clear touch timeout if mouse is used
        if (touchTimeout) {
            clearTimeout(touchTimeout);
            setTouchTimeout(null);
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (touchTimeout) {
                clearTimeout(touchTimeout);
            }
        };
    }, [touchTimeout]);

    if (!channel) return null;

    return (
        <div 
            style={{ position: 'relative', width: w, height: h }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
        >
            <div 
                id={containerId}
                ref={containerRef}
                style={{ width: w, height: h }}
            />
            
            {/* Mask bar - always visible when hideViewer is enabled */}
            {props.hideViewer && (
                <div 
                    style={{
                        position: 'absolute',
                        top: '58px',
                        left: '2%',
                        width: '96%',
                        height: '60px',
                        background: 'rgba(0, 0, 0, 1)',
                        borderRadius: '4px',
                        zIndex: 10,
                        pointerEvents: 'none',
                        opacity: 1
                    }}
                />
            )}
        </div>
    );
}
