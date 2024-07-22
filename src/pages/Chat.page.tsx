import { useState, useEffect, useRef, useContext } from 'react';
import { ChatEmotes, CHAT_EMOTES, ChatConfigContext, LoginContext } from '../ApplicationContext';
import { useShallowEffect, useViewportSize, useDisclosure } from '@mantine/hooks';
import { ScrollArea, Affix, Drawer, Button, Stack, Space, ActionIcon } from '@mantine/core';
import { Chat } from '../components/chat/Chat';
import { IconMessagePause, IconPlus } from '@tabler/icons-react';
import { AppShell } from '@mantine/core';
import { Header } from '../components/header/Header';
import { Alerts } from '../components/alerts/Alerts';
import { ChatInput } from '@/components/chat/ChatInput';
import { WorkerMessage, WorkerResponse } from '../components/chat/workerTypes';
import { ChatMessage, parseTwitchMessage } from '@twurple/chat';
import { ApiClient, HelixModeratedChannel } from '@twurple/api';
import { Settings } from '../components/settings/settings'
import { ReactComponentLike } from 'prop-types';
import { ModDrawer } from '@/components/chat/mod/modview';

export type OverlayDrawer = {
    name: string;
    component: ReactComponentLike;
    position: 'bottom' | 'left' | 'right' | 'top';
    size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    props?: any;
}

const SettingsDrawer: OverlayDrawer = {
    name: 'settings',
    component: Settings,
    size: 'xl',
    position: 'left',
}

const AlertDrawer: OverlayDrawer = {
    name: 'alerts',
    component: Alerts,
    size: 'xl',
    position: 'right'
}

export function ChatPage() {
    const viewport = useRef<HTMLDivElement>(null);
    const footer = useRef<HTMLDivElement>(null);
    const { width, height } = useViewportSize();
    const chatConfig = useContext(ChatConfigContext);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [shouldScroll, setShouldScroll] = useState(true);
    const [drawer, setDrawer] = useState<OverlayDrawer | undefined>(undefined);
    const [drawerOpen, drawerHandler] = useDisclosure(false);
    const [replyMsg, setReplyMsg] = useState<ChatMessage>();
    const [chatInputOpened, chatInputHandler] = useDisclosure(false);
    const loginContext = useContext(LoginContext);
    const workerRef = useRef<Worker>();
    const [deletedMessages, setDeletedMessages] = useState<string[]>([]);

    const authProvider = loginContext.getAuthProvider();
    const api = new ApiClient({ authProvider });

    const onScrollPositionChange = (position: { x: number, y: number }) => {
        const shouldScroll = (viewport.current!.scrollHeight > viewport.current!.clientHeight) && (viewport.current!.scrollHeight - viewport.current!.clientHeight - position.y < 100);
        setShouldScroll(shouldScroll);
    }

    const scrollToBottom = () => {
        viewport.current!.scrollTo({ top: viewport.current!.scrollHeight});
    }

    useEffect(() => {
        if (shouldScroll) {
            scrollToBottom();
        }
    }, [shouldScroll, chatInputOpened, chatMessages, replyMsg]);

    const channelIndex = chatConfig.channels.reduce((obj: any, key: string) => { obj[key] = true; return obj }, {});
    const deletedMessagesIndex = deletedMessages.reduce((obj: any, key: string) => { obj[key] = true; return obj }, {});
    const moderatedChannel = loginContext.moderatedChannels.reduce((obj: any, c: HelixModeratedChannel) => { obj[c.name] = true; return obj }, {});

    useEffect(() => {
        workerRef.current = new Worker(new URL('../components/chat/chatWorker.ts', import.meta.url), { type: 'module' });

        const channelFilter = (msg: ChatMessage) => channelIndex[msg.target.substring(1)];

        workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
            const { type, data } = e.data;
            switch (type) {
                case 'NEW_MESSAGE':
                    setChatMessages((prevMessages) => [...prevMessages, parseTwitchMessage(data) as ChatMessage].filter(channelFilter).slice(shouldScroll ? 0 : (-1 * chatConfig.maxMessages)));
                    break;
                case 'ALL_MESSAGES':
                    setChatMessages((data.map(parseTwitchMessage) as ChatMessage[]).filter(channelFilter));
                    break;
                case 'DELETED_MESSAGE':
                    setDeletedMessages(deletedMessages => {
                        deletedMessages.push(data);
                        const dM: string[] = deletedMessages.slice(-100);
                        localStorage.setItem("chat-messages-deleted", JSON.stringify(dM))
                        return dM
                    })
                    break;
                case 'CHANNELS': {
                    const currentChannels = data.currentChannels;
                    currentChannels.forEach(cc => {
                        if (chatConfig.channels.indexOf(cc) === -1) {
                            const leaveChannelMessage: WorkerMessage = { type: 'LEAVE_CHANNEL', data: { channel: cc } };
                            workerRef.current?.postMessage(leaveChannelMessage);
                        }
                    });
                    chatConfig.channels.forEach(nc => {
                        if (currentChannels.indexOf(nc) === -1) {
                            const joinChannelMessage: WorkerMessage = { type: 'JOIN_CHANNEL', data: { channel: nc } };
                            workerRef.current?.postMessage(joinChannelMessage);
                            CHAT_EMOTES.updateChannel(loginContext, nc);
                        }
                    });
                }
                    break;
                default:
                    break;
            }
        };

        const initMessage: WorkerMessage = {
            type: 'INIT',
            data: {
                channels: chatConfig.channels,
                ignoredUsers: chatConfig.ignoredUsers,
                clientId: loginContext.clientId,
                accessToken: loginContext.accessToken!
            }
        };

        workerRef.current.postMessage(initMessage);

        const chatHandler = chatConfig.onMessage({
            handle: async (channel, text, replyTo) => {
                const token = await api.getTokenInfo();

                api.asUser({ id: token.userId || '' }, async (ctx) => {
                    ctx.chat.sendChatMessage(channel, text, { replyParentMessageId: replyTo });
                });
            }
        });

        const rawMessages: string[] = JSON.parse(localStorage.getItem("chat-messages") || '[]');
        const msgs = rawMessages.map(raw => parseTwitchMessage(raw) as ChatMessage);
        setChatMessages(msgs);

        const deletedMessages: string[] = JSON.parse(localStorage.getItem("chat-messages-deleted") || '[]');
        setDeletedMessages(deletedMessages);

        return () => {
            const stopMessage: WorkerMessage = { type: 'STOP' };
            workerRef.current?.postMessage(stopMessage);
            chatConfig.off(chatHandler);
        };
    }, [chatConfig]);

    useEffect(() => {
        if (chatMessages.length) {
            const rawMessages = chatMessages.map(msg => msg.rawLine);
            localStorage.setItem("chat-messages", JSON.stringify(rawMessages));
        }
    }, [chatMessages]);

    useShallowEffect(() => {
        if (workerRef.current) {
            const getChannelMessage: WorkerMessage = { type: 'GET_CHANNELS', data: { targetChannels: chatConfig.channels } };
            workerRef.current?.postMessage(getChannelMessage);
        }
    }, [chatConfig.channels]);

    const openModView = (msg: ChatMessage) => {
        ModDrawer.props = { msg };
        setDrawer(ModDrawer);
        drawerHandler.open()
    }

    const deleteMessage = (channelId: string, messageId: string) => {
        api.asUser(loginContext.user?.id || '', async (ctx) => {
            ctx.moderation.deleteChatMessages({id: channelId}, messageId);
        });
    }

    const timeoutUser = (channelId: string, userId: string, duration: number, reason: string) => {
        api.asUser(loginContext.user?.id || '', async (ctx) => {
            const data = {duration, reason, user: {id: userId}};
            ctx.moderation.banUser({id: channelId}, data);
        });
    }

    const banUser = (channelId: string, userId: string, reason: string) => {
        api.asUser(loginContext.user?.id || '', async (ctx) => {
            const data = {reason, user: {id: userId}};
            ctx.moderation.banUser({id: channelId}, data);
        });
    }

    return (
        <AppShell header={{ height: 48, offset: true, collapsed: false }}>
            <AppShell.Header>
                <Header openSettings={() => { setDrawer(SettingsDrawer); drawerHandler.open() }} openAlerts={() => { setDrawer(AlertDrawer); drawerHandler.open() }} />
            </AppShell.Header>
            <AppShell.Main>
                <ChatEmotes.Provider value={CHAT_EMOTES}>
                    <Drawer opened={drawerOpen} onClose={drawerHandler.close} withCloseButton={false} padding={0} size={drawer?.size} position={drawer?.position}>
                        {drawer ? <drawer.component close={drawerHandler.close} {...drawer.props}></drawer.component> : null}
                    </Drawer>
                    {(drawerOpen || shouldScroll) ? null : (
                        <Affix position={{ bottom: 15 + (footer.current ? footer.current.scrollHeight : 0), left: 0 }} style={{ width: "100%" }}>
                            <Stack align="center">
                                <Button onClick={scrollToBottom} leftSection={<IconMessagePause />} variant="gradient" gradient={{ from: 'grape', to: 'orange', deg: 90 }} style={{ borderRadius: 16 }}>New Messages</Button>
                            </Stack>
                        </Affix>
                    )}
                    <ScrollArea viewportRef={viewport} w={width} h={height - (footer.current ? footer.current.scrollHeight : 0)} type="never" onScrollPositionChange={onScrollPositionChange} style={{ fontSize: chatConfig.fontSize }}>
                        <Chat messages={chatMessages} openModView={openModView} moderatedChannel={moderatedChannel} timeoutUser={timeoutUser} banUser={banUser} deletedMessages={deletedMessagesIndex} deleteMessage={deleteMessage} setReplyMsg={(msg) => { if (msg) { setReplyMsg(msg); chatConfig.setChatChannel(msg.target.substring(1)); chatInputHandler.open(); } }} />
                    </ScrollArea>
                    <Space h={footer.current ? footer.current.scrollHeight : 0}></Space>
                </ChatEmotes.Provider>
            </AppShell.Main>
            <AppShell.Footer >
                {(!drawerOpen) ?
                    chatInputOpened ? <div ref={footer}><ChatInput close={chatInputHandler.close} replyToMsg={replyMsg} setReplyMsg={setReplyMsg} /></div> : <Affix position={{ bottom: 10, right: 10 }}><ActionIcon color='primary' onClick={chatInputHandler.open}><IconPlus /></ActionIcon></Affix> : null}
            </AppShell.Footer>
        </AppShell>
    );
}