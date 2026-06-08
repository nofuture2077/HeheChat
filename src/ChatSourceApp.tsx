import { useEffect, useRef, useState } from 'react';
import { Profile, DEFAULT_PROFILE } from './commons/profile';
import { ProfileContext, ChatEmotesContext, ConfigContext } from './ApplicationContext';
import { ChatEmotes, DEFAULT_CHAT_EMOTES } from './commons/emotes';
import { DEFAULT_CONFIG } from './commons/config';
import { HeheMessage, parseMessage, isSystemMessageType, isYTChatMessageType, HeheChatMessage, YTChatMessage, SystemMessage } from './commons/message';
import { ChatMessageComp } from './components/chat/ChatMessage';
import { YTChatMessageComp } from './components/chat/YTChatMessage';
import { SystemMessageComp } from './components/chat/systemmessage';
import { ModActions } from './components/chat/mod/modactions';
import { useDocumentVisibility, useNetwork } from '@mantine/hooks';
import { initializeStoragePatches } from './commons/patches';
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

interface ChatSourceAppProps {
    token: string | undefined;
    showSystem: boolean;
    maxMessages: number;
    fontSize: number;
    width: string;
    height: string;
    padding: number;
}

export default function ChatSourceApp({ token, showSystem, maxMessages, fontSize, width, height, padding }: ChatSourceAppProps) {
    const backendWorkerRef = useRef<Worker | undefined>(undefined);
    const [profile, setProfile] = useState<Profile>({ ...DEFAULT_PROFILE });
    const [chatEmotes] = useState<ChatEmotes>(DEFAULT_CHAT_EMOTES);
    const [messages, setMessages] = useState<HeheMessage[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);
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
                setProfile(p);
                (p.config.channels || []).forEach((channel: string) => {
                    chatEmotes.updateChannel(channel);
                });
            }

            if (data.type === 'sharedata') {
                const p: Profile = data.profile;
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
                if (isSystemMessageType(msg) && !showSystem) return;
                setMessages((prev) => {
                    const next = [...prev, msg];
                    return next.length > maxMessages ? next.slice(next.length - maxMessages) : next;
                });
            }

            if (data.type === 'ytchat') {
                const msg = parseMessage(data.data.message);
                setMessages((prev) => {
                    const next = [...prev, msg];
                    return next.length > maxMessages ? next.slice(next.length - maxMessages) : next;
                });
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

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <ProfileContext.Provider value={profile}>
            <ChatEmotesContext.Provider value={chatEmotes}>
                <ConfigContext.Provider value={{ ...DEFAULT_CONFIG, ...profile.config, fontSize }}>
                    <div style={{
                        width,
                        height,
                        background: 'transparent',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        padding,
                        boxSizing: 'border-box',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
                        fontSize,
                    }}>
                        <div style={{ overflowY: 'scroll', display: 'flex', flexDirection: 'column', scrollbarWidth: 'none', flex: 1, minHeight: 0 }}>
                            <div style={{ flex: 1 }} />
                            {messages.map((msg) => {
                                if (isSystemMessageType(msg)) {
                                    return (
                                        <div key={'system-' + msg.id} style={{ flexShrink: 0 }}>
                                            <SystemMessageComp
                                                msg={msg as SystemMessage}
                                                modActions={NOOP_MOD_ACTIONS}
                                                moderatedChannel={{}}
                                            />
                                        </div>
                                    );
                                }
                                if (isYTChatMessageType(msg)) {
                                    return (
                                        <div key={'ytchat-' + msg.id} style={{ flexShrink: 0 }}>
                                            <YTChatMessageComp msg={msg as YTChatMessage} />
                                        </div>
                                    );
                                }
                                return (
                                    <div key={msg.id} style={{ flexShrink: 0 }}>
                                        <ChatMessageComp
                                            msg={msg as HeheChatMessage}
                                            deletedMessages={{}}
                                            moderatedChannel={{}}
                                            setReplyMsg={() => {}}
                                            openModView={() => {}}
                                            modActions={NOOP_MOD_ACTIONS}
                                        />
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>
                    </div>
                </ConfigContext.Provider>
            </ChatEmotesContext.Provider>
        </ProfileContext.Provider>
    );
}
