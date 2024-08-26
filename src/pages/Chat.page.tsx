
import { useState, useEffect, useRef, useContext } from 'react';
import { ChatEmotesContext, ConfigContext, LoginContextContext, ProfileContext } from '@/ApplicationContext';
import { useShallowEffect, useViewportSize, useDisclosure, useForceUpdate, useThrottledState } from '@mantine/hooks';
import { ScrollArea, Affix, Drawer, Button, Space, ActionIcon } from '@mantine/core';
import { Chat } from '@/components/chat/Chat';
import { IconMessagePause, IconSend } from '@tabler/icons-react';
import { AppShell } from '@mantine/core';
import { Header } from '@/components/header/Header';
import { EventDrawer } from '@/components/events/eventdrawer';
import { ChatInput } from '@/components/chat/ChatInput';
import { WorkerMessage, WorkerResponse } from '@/components/chat/chatWorkerTypes';
import { ChatMessage } from '@twurple/chat';
import { ApiClient, HelixModeratedChannel } from '@twurple/api';
import { SettingsDrawer, SettingsTab } from '@/components/settings/settings'
import { ReactComponentLike } from 'prop-types';
import { ModDrawer } from '@/components/chat/mod/modview';
import { formatDuration } from '@/commons/helper';
import { HeheMessage, parseMessage, SystemMessage } from '@/commons/message'
import { TwitchDrawer } from '@/components/twitch/twitchview';
import { ModActions, deleteMessage, timeoutUser, banUser, raidUser, shoutoutUser } from '@/components/chat/mod/modactions';
import { ProfileBarDrawer } from '@/components/profile/profilebar';
import { Storage } from '@/components/chat/chatstorage';
import { AlertSystem } from '@/components/alerts/alertplayer';

export type OverlayDrawer = {
    name: string;
    component: ReactComponentLike;
    position: 'bottom' | 'left' | 'right' | 'top';
    size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
    props?: any;
}

export function ChatPage() {
    const viewport = useRef<HTMLDivElement>(null);
    const footer = useRef<HTMLDivElement>(null);
    const websocket = useRef<WebSocket | null>(null);
    const [websocketOpen, setWebsocketOpen] = useState(false);
    const { width, height } = useViewportSize();
    const config = useContext(ConfigContext);
    const profile = useContext(ProfileContext);
    const [chatMessages, setChatMessages] = useThrottledState<HeheMessage[]>([], 500);
    const [shouldScroll, setShouldScroll] = useState(true);
    const [drawer, setDrawer] = useState<OverlayDrawer | undefined>(undefined);
    const [drawerOpen, drawerHandler] = useDisclosure(false);
    const [replyMsg, setReplyMsg] = useState<ChatMessage>();
    const [chatInputOpened, chatInputHandler] = useDisclosure(false);
    const loginContext = useContext(LoginContextContext);
    const workerRef = useRef<Worker>();
    const [deletedMessages, setDeletedMessages] = useState<string[]>([]);
    const forceUpdate = useForceUpdate();
    const emotes = useContext(ChatEmotesContext);

    const authProvider = loginContext.getAuthProvider();
    const api = new ApiClient({ authProvider });

    const onScrollPositionChange = (position: { x: number, y: number }) => {
        const shouldScroll = (viewport.current!.scrollHeight > viewport.current!.clientHeight) && (viewport.current!.scrollHeight - viewport.current!.clientHeight - viewport.current!.scrollTop < 10);
        setShouldScroll(shouldScroll);
    }

    const scrollToBottom = () => {
        viewport.current!.scrollTo({ top: viewport.current!.scrollHeight });
    }

    useEffect(() => {
        forceUpdate();
    }, [chatInputOpened]);

    useEffect(() => {
        if (shouldScroll) {
            scrollToBottom();
        }
    }, [shouldScroll, chatInputOpened, chatMessages, replyMsg]);

    const deletedMessagesIndex = deletedMessages.reduce((obj: any, key: string) => { obj[key] = true; return obj }, {});
    const moderatedChannel = loginContext.moderatedChannels.reduce((obj: any, c: HelixModeratedChannel) => { obj[c.name] = true; return obj }, {});

    const addMessage = (msg: HeheMessage, user: string) => {
        Storage.store(msg.target.substring(1), user, msg.date, msg.rawLine);
        if (config.ignoredUsers.indexOf(user) !== -1) {
            return;
        }
        setChatMessages((prevMessages) => [...prevMessages, msg].slice(shouldScroll ? (-1 * config.maxMessages) : 0));
    }

    useEffect(() => {
        websocket.current = new WebSocket(import.meta.env.VITE_BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://"));

        const onMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === 'msg') {
                addMessage(parseMessage(data.data.message), data.data.username);
            }
            if (data.type === 'event') {
                if (config.playAlerts) {
                    AlertSystem.addEvent(data.data);
                }
            }
        };

        websocket.current.addEventListener("message", onMessage);
        
        websocket.current.addEventListener("open", event => {
            console.log("websocket open")
            setWebsocketOpen(true);
        });

        return () => {
            websocket.current?.close();
            setWebsocketOpen(false);
        }
    }, []);

    useEffect(() => {
        chatInputHandler.close();

        workerRef.current = new Worker(new URL('../components/chat/chatWorker.ts', import.meta.url), { type: 'module' });

        workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
            const { type, data } = e.data;
            switch (type) {
                case 'DELETED_MESSAGE':
                    setDeletedMessages(deletedMessages => {
                        deletedMessages.push(data.msgId);
                        const dM: string[] = deletedMessages.slice(-100);
                        localStorage.setItem("chat-messages-deleted", JSON.stringify(dM))
                        return dM
                    })
                    break;
                case 'TIMEOUT_MESSAGE':
                    addMessage(new SystemMessage(data.channel, ["timeout", data.channel, data.username, formatDuration(data.duration)].join("***"), data.date, "timeout", data.channelId, data.userId), '#system');
                    break;
                case 'BAN_MESSAGE':
                    addMessage(new SystemMessage(data.channel, ["ban", data.channel, data.username].join("***"), data.date, "ban", data.channelId, data.userId), '#system');
                    break;
                case 'CHANNELS': {
                    const currentChannels = data.currentChannels;
                    currentChannels.forEach(cc => {
                        if (config.channels.indexOf(cc) === -1) {
                            const leaveChannelMessage: WorkerMessage = { type: 'LEAVE_CHANNEL', data: { channel: cc } };
                            workerRef.current?.postMessage(leaveChannelMessage);
                        }
                    });
                    const promises = config.channels.map(nc => {
                        if (currentChannels.indexOf(nc) === -1) {
                            const joinChannelMessage: WorkerMessage = { type: 'JOIN_CHANNEL', data: { channel: nc } };
                            workerRef.current?.postMessage(joinChannelMessage);
                            return emotes.updateChannel(loginContext, nc);
                        }
                        return Promise.resolve();
                    });
                    Promise.all(promises).then(() => forceUpdate());
                }
                    break;
                default:
                    break;
            }
        };

        const initMessage: WorkerMessage = {
            type: 'INIT',
            data: {
                channels: config.channels,
                clientId: loginContext.clientId,
                accessToken: loginContext.accessToken!
            }
        };

        workerRef.current.postMessage(initMessage);

        const chatHandler = config.onMessage({
            handle: async (channel, text, replyTo) => {
                const token = await api.getTokenInfo();

                api.asUser({ id: token.userId || '' }, async (ctx) => {
                    ctx.chat.sendChatMessage(channel, text, { replyParentMessageId: replyTo });
                });
            }
        });

        Storage.load(config.channels, config.ignoredUsers).then(rawMessages => {
            const msgs = rawMessages.map(parseMessage);
            setChatMessages(msgs);
        });


        const deletedMessages: string[] = JSON.parse(localStorage.getItem("chat-messages-deleted") || '[]');
        setDeletedMessages(deletedMessages);

        loginContext.moderatedChannels.forEach(mC => {
            emotes.updateUserInfo(loginContext, mC.name);
        });

        config.raidTargets.forEach(mC => {
            emotes.updateUserInfo(loginContext, mC);
        });

        emotes.updateUserInfo(loginContext, loginContext.user?.name || '');

        return () => {
            const stopMessage: WorkerMessage = { type: 'STOP' };
            workerRef.current?.postMessage(stopMessage);
            config.off(chatHandler);
        };
    }, [config, profile]);

    useShallowEffect(() => {
        if (workerRef.current) {
            const getChannelMessage: WorkerMessage = { type: 'GET_CHANNELS', data: { targetChannels: config.channels } };
            workerRef.current?.postMessage(getChannelMessage);
        }
        if (websocket.current && websocketOpen && websocket.current?.readyState === websocket.current?.OPEN) {
            AlertSystem.addNewChannels(config.channels);
            websocket.current?.send(JSON.stringify({ type: "subscribe", channels: Object.fromEntries(config.channels.map(key => [key, true])) }));
        }
    }, [config.channels, websocketOpen, websocket.current]);

    const openModView = (msg: ChatMessage) => {
        ModDrawer.props = { msg };
        setDrawer(ModDrawer);
        drawerHandler.open()
    }

    const modActions: ModActions = {
        deleteMessage: deleteMessage(api, loginContext),
        timeoutUser: timeoutUser(api, loginContext),
        banUser: banUser(api, loginContext),
        shoutoutUser: shoutoutUser(api, loginContext),
        raidUser: raidUser(api, loginContext, emotes)
    };

    return (
        <AppShell>
            <AppShell.Header>
                <Header openSettings={(tab?: SettingsTab) => { setDrawer({...SettingsDrawer, props: {tab} }); drawerHandler.open() }}
                    openEvents={() => { setDrawer(EventDrawer); drawerHandler.open() }}
                    openTwitch={() => { setDrawer(TwitchDrawer); drawerHandler.open() }}
                    openProfileBar={() => { setDrawer(ProfileBarDrawer); drawerHandler.open() }} />
            </AppShell.Header>

            <AppShell.Main>
                <Drawer opened={drawerOpen} onClose={drawerHandler.close} withCloseButton={false} padding={0} size={drawer?.size} position={drawer?.position}>
                    {drawer ? <drawer.component modActions={modActions} close={drawerHandler.close} openProfileBar={() => { setDrawer(ProfileBarDrawer); drawerHandler.open() }} openSettings={(tab?: SettingsTab) => { setDrawer({...SettingsDrawer, props: {tab}}); drawerHandler.open() }} {...drawer.props}></drawer.component> : null}
                </Drawer>
                {(drawerOpen || shouldScroll) ? null : (
                    <Affix position={{ bottom: 20 + (footer.current ? footer.current.scrollHeight : 0), left: 0 }}>
                        <Button ml={(width - 166) / 2} onClick={scrollToBottom} leftSection={<IconMessagePause />} variant="gradient" gradient={{ from: 'grape', to: 'orange', deg: 90 }} style={{ borderRadius: 16 }}>New Messages</Button>
                    </Affix>
                )}
                <ScrollArea viewportRef={viewport} w={width} h={height - (footer.current ? footer.current.scrollHeight : 0)} type="never" onScrollPositionChange={onScrollPositionChange} style={{ fontSize: config.fontSize, wordWrap: 'break-word' }}>
                    <Space h={48}></Space>
                    <Chat messages={chatMessages} openModView={openModView} moderatedChannel={moderatedChannel} modActions={modActions} deletedMessages={deletedMessagesIndex} setReplyMsg={(msg) => { if (msg) { setReplyMsg(msg); config.setChatChannel(msg.target.substring(1)); chatInputHandler.open(); } }} />
                </ScrollArea>
                <Space h={footer.current ? footer.current.scrollHeight + 5 : 20}></Space>
            </AppShell.Main>
            <AppShell.Footer >
                {(!drawerOpen && config.channels.length) ?
                    (chatInputOpened ? <div ref={footer}><ChatInput close={chatInputHandler.close} replyToMsg={replyMsg} setReplyMsg={setReplyMsg} /></div> : <Affix position={{ bottom: 20, right: 20 }}><ActionIcon color='primary' size='xl' radius='xl' onClick={chatInputHandler.open}><IconSend /></ActionIcon></Affix>) : null}
            </AppShell.Footer>
        </AppShell>
    );
}