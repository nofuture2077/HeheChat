import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Profile, DEFAULT_PROFILE } from './commons/profile';
import { MantineProvider } from '@mantine/core';
import { ProfileContext, ChatEmotesContext, ConfigContext } from './ApplicationContext';
import { ChatEmotes, DEFAULT_CHAT_EMOTES } from './commons/emotes';
import { DEFAULT_CONFIG } from './commons/config';
import { HeheMessage, parseMessage, isSystemMessageType, isYTChatMessageType, HeheChatMessage, YTChatMessage, SystemMessage } from './commons/message';
import { ChatMessageBrowserSource } from './components/chat/ChatMessageBrowserSource';
import { YTChatMessageBrowserSource } from './components/chat/YTChatMessageBrowserSource';
import { SystemMessageComp } from './components/chat/systemmessage';
import { ModActions } from './components/chat/mod/modactions';
import { useDocumentVisibility, useNetwork } from '@mantine/hooks';
import { initializeStoragePatches } from './commons/patches';
import { theme } from './theme';
import { version } from '../package.json';

const NOOP_MOD_ACTIONS: ModActions = {
    deleteMessage: () => {},
    timeoutUser: () => {},
    banUser: () => {},
    unbanUser: () => {},
    shoutoutUser: () => {},
    raidUser: () => {},
    unraid: () => {},
    modUser: () => {},
    unmodUser: () => {},
    vipUser: () => {},
    unvipUser: () => {},
};

interface TrackedMessage {
    msg: HeheMessage;
    addedAt: number;
    exiting: boolean;
}

interface ChatSourceAppProps {
    token: string | undefined;
}

const FADE_OUT_MS = 600;

const KEYFRAME_STYLES = `
    @keyframes chatBsSlideIn {
        from { transform: translateY(16px); opacity: 0; }
        to   { transform: translateY(0);    opacity: 1; }
    }
    @keyframes chatBsFadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
    }
    @keyframes chatBsFadeOut {
        from { opacity: 1; }
        to   { opacity: 0; }
    }
`;

export default function ChatSourceApp({ token }: ChatSourceAppProps) {
    const backendWorkerRef = useRef<Worker | undefined>(undefined);
    const [profile, setProfile] = useState<Profile>({ ...DEFAULT_PROFILE });
    const [chatEmotes] = useState<ChatEmotes>(DEFAULT_CHAT_EMOTES);
    const [messages, setMessages] = useState<TrackedMessage[]>([]);
    const profileRef = useRef<Profile>({ ...DEFAULT_PROFILE });
    const documentVisible = useDocumentVisibility();
    const networkStatus = useNetwork();

    useEffect(() => {
        initializeStoragePatches();
    }, []);

    useEffect(() => {
        backendWorkerRef.current = new Worker(
            new URL('./components/webworker/backendworker.ts', import.meta.url),
            { type: 'module' }
        );

        backendWorkerRef.current.onmessage = (event) => {
            const data = event.data;

            if (data.type === 'profile') {
                const p: Profile = data.profile;
                profileRef.current = p;
                setProfile(p);
                (p.config.channels || []).forEach((channel: string) => {
                    chatEmotes.updateChannel(channel);
                });
            }

            if (data.type === 'sharedata') {
                const p: Profile = data.profile;
                profileRef.current = p;
                setProfile(p);
                (p.config.channels || []).forEach((channel: string) => {
                    chatEmotes.updateChannel(channel);
                });
                const channels = p.config?.channels || [];
                const subscribeMsg = {
                    type: 'subscribe',
                    source: 'ChatBrowserSource',
                    profile: p.guid,
                    profileName: p.name,
                    version,
                    token,
                    channels: Object.fromEntries(channels.map((key: string) => [key, true])),
                };
                backendWorkerRef.current?.postMessage({ type: 'SEND', data: subscribeMsg });
            }

            if (data.type === 'msg') {
                const msg = parseMessage(data.data.message);
                setMessages((prev) => {
                    const cfg = profileRef.current.config;
                    if (isSystemMessageType(msg) && !(cfg.chatBsShowSystem ?? false)) return prev;
                    const ignoredUsers = (cfg.chatBsIgnoredUsers ?? []).map((u: string) => u.toLowerCase());
                    if (!isSystemMessageType(msg) && ignoredUsers.includes((msg as HeheChatMessage).userInfo?.displayName?.toLowerCase())) return prev;
                    return [...prev, { msg, addedAt: Date.now(), exiting: false }];
                });
            }

            if (data.type === 'ytchat') {
                const msg = parseMessage(data.data.message);
                setMessages((prev) => [...prev, { msg, addedAt: Date.now(), exiting: false }]);
            }
        };

        backendWorkerRef.current.postMessage({
            type: 'SEND',
            data: { type: 'sink', source: 'ChatBrowserSource', token },
        });

        return () => {
            if (backendWorkerRef.current) {
                backendWorkerRef.current.postMessage({ type: 'STOP' });
                backendWorkerRef.current.terminate();
            }
        };
    }, [token]);

    useEffect(() => {
        let timeoutId: number;
        if (networkStatus.online && documentVisible && backendWorkerRef.current) {
            timeoutId = setTimeout(() => {
                backendWorkerRef.current?.postMessage({ type: 'RECONNECT' });
            }, 1000) as unknown as number;
        }
        return () => { if (timeoutId) clearTimeout(timeoutId); };
    }, [networkStatus.online, documentVisible]);

    // Message lifetime / expiry ticker
    useEffect(() => {
        const cfg = profile.config;
        const maxMsg = cfg.chatBsMaxMessages ?? 5;
        const showSystem = cfg.chatBsShowSystem ?? false;
        const lifetime = cfg.chatBsMessageLifetime ?? 15;

        const interval = setInterval(() => {
            const now = Date.now();
            setMessages((prev) => {
                // filter out system messages if showSystem is off
                let next = prev.filter(m => {
                    if (isSystemMessageType(m.msg) && !showSystem) return false;
                    return true;
                });

                // cap to maxMessages
                if (next.length > maxMsg) next = next.slice(next.length - maxMsg);

                if (lifetime <= 0) return next;

                // mark expired messages as exiting
                let changed = false;
                const marked = next.map(m => {
                    if (!m.exiting && now - m.addedAt > lifetime * 1000) {
                        changed = true;
                        return { ...m, exiting: true };
                    }
                    return m;
                });
                return changed ? marked : next;
            });
        }, 500);

        return () => clearInterval(interval);
    }, [profile.config]);

    const handleAnimationEnd = useCallback((id: string) => {
        setMessages(prev => prev.filter(m => {
            const msgId = isSystemMessageType(m.msg) ? 'system-' + m.msg.id : m.msg.id;
            return !(msgId === id && m.exiting);
        }));
    }, []);

    const cfg = profile.config;

    const bsConfig = useMemo(() => ({
        ...DEFAULT_CONFIG,
        ...cfg,
        fontSize: cfg.chatBsFontSize ?? 14,
        showImportantBadges: cfg.chatBsShowImportantBadges ?? true,
        showSubBadges: cfg.chatBsShowSubBadges ?? true,
        showOtherBadges: cfg.chatBsShowOtherBadges ?? false,
        show7TVCosmetics: cfg.chatBsShow7TVBadges ?? true,
    }), [cfg]);

    const msgBg = cfg.chatBsMsgBackground ?? 'none';
    const msgSpacing = cfg.chatBsMsgSpacing ?? 2;
    const msgBgStyle = useMemo<React.CSSProperties>(() => msgBg === 'dark'
        ? { background: 'rgba(0,0,0,0.45)', borderRadius: 4, padding: '2px 5px', marginBottom: msgSpacing }
        : msgBg === 'light'
        ? { background: 'rgba(255,255,255,0.15)', borderRadius: 4, padding: '2px 5px', marginBottom: msgSpacing }
        : { marginBottom: msgSpacing }, [msgBg, msgSpacing]);

    const animateIn = cfg.chatBsAnimateIn ?? 'slide';
    const animateOut = cfg.chatBsAnimateOut ?? 'fade';
    const inAnimation = animateIn === 'slide' ? 'chatBsSlideIn 0.3s ease-out'
        : animateIn === 'fade' ? 'chatBsFadeIn 0.3s ease-out'
        : undefined;
    const outAnimation = animateOut === 'fade' ? `chatBsFadeOut ${FADE_OUT_MS}ms ease-in forwards` : undefined;

    const fontSize = bsConfig.fontSize;

    const containerStyle = useMemo<React.CSSProperties>(() => ({
        width: cfg.chatBsWidth || '100%',
        height: cfg.chatBsHeight || '100%',
        background: (cfg.chatBsTransparentBg ?? true) ? 'transparent' : '#1a1a1a',
        overflow: 'hidden',
        padding: cfg.chatBsPadding ?? 4,
        boxSizing: 'border-box',
        fontFamily: cfg.chatBsFontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSize,
        color: cfg.chatBsTextColor || undefined,
        textShadow: (cfg.chatBsTextShadow ?? true) ? '0 1px 3px rgba(0,0,0,0.85)' : undefined,
        transform: 'translateZ(0)',
    }), [cfg, fontSize]);

    const hideHeheBadges = !(cfg.chatBsShowHeheBadges ?? true);

    return (
        <MantineProvider defaultColorScheme="dark" theme={theme}>
            <style>{KEYFRAME_STYLES}</style>
            <ProfileContext.Provider value={profile}>
                <ChatEmotesContext.Provider value={chatEmotes}>
                    <ConfigContext.Provider value={bsConfig}>
                        <div style={containerStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column-reverse', height: '100%', overflow: 'hidden' }}>
                            {[...messages].reverse().map((tracked) => {
                                const { msg, exiting } = tracked;
                                const isSystem = isSystemMessageType(msg);
                                const isYT = isYTChatMessageType(msg);
                                const key = isSystem ? 'system-' + msg.id : msg.id;

                                const wrapperStyle: React.CSSProperties = {
                                    flexShrink: 0,
                                    willChange: 'transform, opacity',
                                    animation: exiting ? outAnimation : inAnimation,
                                    ...msgBgStyle,
                                };

                                return (
                                    <div
                                        key={key}
                                        style={wrapperStyle}
                                        onAnimationEnd={exiting ? () => handleAnimationEnd(key) : undefined}
                                    >
                                        {isSystem && (
                                            <SystemMessageComp
                                                msg={msg as SystemMessage}
                                                modActions={NOOP_MOD_ACTIONS}
                                                moderatedChannel={{}}
                                            />
                                        )}
                                        {isYT && <YTChatMessageBrowserSource msg={msg as YTChatMessage} />}
                                        {!isSystem && !isYT && (
                                            <ChatMessageBrowserSource
                                                msg={msg as HeheChatMessage}
                                                hideHeheBadges={hideHeheBadges}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        </div>
                    </ConfigContext.Provider>
                </ChatEmotesContext.Provider>
            </ProfileContext.Provider>
        </MantineProvider>
    );
}
