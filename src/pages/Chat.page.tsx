import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { ChatEmotesContext, ConfigContext, LoginContextContext, ProfileContext } from '@/ApplicationContext';
import { useViewportSize, useDisclosure, useForceUpdate, useThrottledState, useDocumentVisibility, useNetwork, useDidUpdate } from '@mantine/hooks';
import { ScrollArea, Affix, Drawer, Button, Space, ActionIcon, Badge, Stack, Group } from '@mantine/core';
import { Chat } from '@/components/chat/Chat';
import { ShortcutView } from '@/components/shortcuts/ShortcutView';
import { IconMessagePause } from '@tabler/icons-react';
import { AppShell } from '@mantine/core';
import { Header } from '@/components/header/Header';
import { EventDrawer } from '@/components/events/eventdrawer';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage } from '@twurple/chat';
import { HelixModeratedChannel } from '@twurple/api';
import { SettingsDrawer, SettingsTab } from '@/components/settings/settings'
import { ReactComponentLike } from 'prop-types';
import { ModDrawer } from '@/components/chat/mod/modview';
import { HeheMessage, parseMessage } from '@/commons/message'
import { TwitchDrawer } from '@/components/twitch/twitchview';
import { ModActions, deleteMessage, timeoutUser, banUser, raidUser, shoutoutUser } from '@/components/chat/mod/modactions';
import { ProfileBarDrawer } from '@/components/profile/profilebar';
import { Storage } from '@/components/chat/chatstorage';
import { AlertSystem } from '@/components/alerts/alertplayer';
import { toMap } from '@/commons/helper';
import { Event } from '@/commons/events';
import { UserCardDrawer } from '@/components/login/usercard';
import { PinManager } from '@/components/pinned/pinmanager';
import { useViewportWidthCallback } from '@/commons/helper';
import { getDimension } from '@/components/twitch/twitchplayer';

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
    const { width, height } = useViewportSize();
    const config = useContext(ConfigContext);
    const profile = useContext(ProfileContext);
    const [chatMessages, setChatMessages] = useThrottledState<HeheMessage[]>([], 500);
    const [shouldScroll, setShouldScroll] = useState(true);
    const [drawer, setDrawer] = useState<OverlayDrawer | undefined>(undefined);
    const [drawerOpen, drawerHandler] = useDisclosure(false);
    const [replyMsg, setReplyMsg] = useState<ChatMessage>();
    const [chatInputOpened, chatInputHandler] = useDisclosure(true);
    const loginContext = useContext(LoginContextContext);
    const [deletedMessages, setDeletedMessages] = useState<string[]>([]);
    const [bannedUser, setBannedUser] = useState<string[]>([]);
    const forceUpdate = useForceUpdate();
    const emotes = useContext(ChatEmotesContext);
    const [online, setOnline] = useState(true);
    const documentVisible = useDocumentVisibility();
    const networkStatus = useNetwork();
    const [videoHeight, setVideoHeight] = useState(0);
    const [shortcutsVisible, setShortcutsVisible] = useState(true);
    const [currentClipId, setCurrentClipId] = useState<string | null>(null);

    const onScrollPositionChange = (position: { x: number, y: number }) => {
        const viewportElement = viewport.current;
        if (viewportElement) {
            const shouldScroll = 
                (viewportElement.scrollHeight > viewportElement.clientHeight) &&
                (viewportElement.scrollHeight - viewportElement.clientHeight - position.y < 60);
            setShouldScroll(shouldScroll);
        }
    };

    const messageIndex = toMap(chatMessages, m => m.id);

    const scrollToBottom = () => {
        if (viewport.current) {
            viewport.current!.scrollTo({ top: viewport.current!.scrollHeight + 60 });
        }
    }

    const deletedMessagesIndex = deletedMessages.reduce((obj: any, key: string) => { obj[key] = true; return obj }, {});
    const moderatedChannel = loginContext.moderatedChannels.reduce((obj: any, c: HelixModeratedChannel) => { obj[c.name] = true; return obj }, {});

    const addMessage = (msg: HeheMessage, user: string, maxMessages: number) => {
        if (config.ignoredUsers.indexOf(user) !== -1) {
            return;
        }
        if (msg.id && messageIndex.has(msg.id)) {
            return;
        }
        if (msg.text.startsWith("!tts") && (config.freeTTS || []).includes(user)) {
            const message = msg.text.split("!tts")[1];
            AlertSystem.addEvent({
                id: Date.now(),
                channel: msg.channelId || '',
                username: user, 
                eventtype: 'raid',
                date: Date.now(),
                text: message,
                eventAlert: {
                    name: 'defaul',
                    id: Date.now() + "",
                    type: 'raid',
                    specifier: {
                        type: 'matches'
                    },
                    restriction: 'none',
                    audio: {
                        tts: {
                            text: message,
                            voiceType: 'google',
                            voiceSpecifier: 'adam',
                            voiceParams: {}
                        }
                    }
                }
            });
        }
        setChatMessages((prevMessages) => prevMessages.concat(msg).slice((prevMessages.length % 2) ? 0 : (-1 * maxMessages + 1)));
    };

    const onModEvent = useCallback((eventname: string, data: any) => {
        if (data.eventtype === 'delete') {
            const msgId = data.text;
            setDeletedMessages((dM) => dM.concat(msgId));
        }
        if (data.eventtype === 'timeout' || data.eventtype === 'ban') {
            const username = data.username;
            // @ts-ignore
            const messagesToDelete = chatMessages.filter(m => m._prefix?.user === username).map(m => m.id);
            setDeletedMessages((dM) => dM.concat(messagesToDelete));
        }
    }, [chatMessages]);

    useViewportWidthCallback(() => {
        const [w, h] = getDimension();
        setVideoHeight(h);
    });

    useEffect(() => {
        const modEventSub = PubSub.subscribe("WS-modevent", onModEvent);
        return () => {
            PubSub.unsubscribe(modEventSub);
        };
    }, [onModEvent]);

    useEffect(() => {
        if (profile.name === 'default' && !config.channels.length) {
            setTimeout(() => {
                if (loginContext.user) {
                    config.setChannels([loginContext.user!.name]);
                }
                setDrawer({...SettingsDrawer, props: {tab: 'Chat'} });
                drawerHandler.open();
            }, 2500);
        }
        config.loadShares();

        return () => {
        }
    }, []);

    useEffect(() => {
        const chatHandler = config.onMessage({
            handle: async (channel, text, replyTo) => {
                PubSub.publish('WSSEND', {type: 'sendMessage', channel, text, replyTo});
            }
        });

        const msgSub = PubSub.subscribe("WS-msg", (msg, data) => {
            addMessage(parseMessage(data.message), data.username, config.maxMessages);
        });

        const eventSub = PubSub.subscribe("WS-event", (msg, data: Event) => {
            if (AlertSystem.shouldBePlayed(data)) {
                AlertSystem.addEvent(data);
            }
        });
        const modEventSub = PubSub.subscribe("WS-modevent", onModEvent);

        Storage.load(config.channels, config.ignoredUsers).then(rawMessages => {
            const msgs = rawMessages.map(parseMessage);
            setChatMessages(msgs);
        });

        (loginContext.moderatedChannels || []).forEach(mC => {
            emotes.updateUserInfo(loginContext, mC.name);
        });

        (config.raidTargets || []).forEach(mC => {
            emotes.updateUserInfo(loginContext, mC);
        });

        (profile.listProfiles() || []).forEach(p => {
            (p.config.channels || []).forEach(channel => {
                emotes.updateUserInfo(loginContext, channel);
            });
        });

        setShouldScroll(true);

        setTimeout(() => {
            scrollToBottom();
        }, 2000);

        (config.channels || []).forEach(channel => {
            emotes.updateChannel(loginContext, channel).then(forceUpdate);
        });
        const state = localStorage.getItem('hehe-token_state') || '';
        AlertSystem.addNewChannels(config.channels);
        PubSub.publish("WSSEND", { type: "subscribe", state, channels: Object.fromEntries(config.channels.map(key => [key, true])) });

        return () => {
            PubSub.unsubscribe(msgSub);
            PubSub.unsubscribe(eventSub);
            PubSub.unsubscribe(modEventSub);
            config.off(chatHandler);
        };
    }, [config.channels, config.ignoredUsers, config.raidTargets, profile.guid, config.maxMessages, config.freeTTS]);

    useDidUpdate(() => {
        setOnline(networkStatus.online);
        setShouldScroll(true);
        if (networkStatus.online && documentVisible) {
            Storage.load(config.channels, config.ignoredUsers).then(rawMessages => {
                const msgs = rawMessages.map(parseMessage);
                setChatMessages(msgs);
            });
        }
        if (!AlertSystem.status()) {
            AlertSystem.initialize();
        } 
        setTimeout(() => {
            scrollToBottom();
        }, 2000);
    }, [documentVisible, networkStatus.online]);

    useEffect(() => {
        if (shouldScroll) {
            scrollToBottom();
        }
    }, [chatMessages, shouldScroll]);

    const openModView = (msg: ChatMessage) => {
        ModDrawer.props = { msg };
        setDrawer(ModDrawer);
        drawerHandler.open()
    }

    const modActions: ModActions = {
        deleteMessage,
        timeoutUser,
        banUser,
        shoutoutUser,
        raidUser
    };

    const headerHeight = 36 + ((config.showVideo || currentClipId) ? videoHeight : 0);
    const affixOffset = headerHeight + 15;

    return (
        <AppShell>
            <AppShell.Header>
                <Header 
                    openSettings={(tab?: SettingsTab) => { setDrawer({...SettingsDrawer, props: {tab} }); drawerHandler.open() }}
                    openEvents={() => { setDrawer(EventDrawer); drawerHandler.open() }}
                    openTwitch={() => { setDrawer(TwitchDrawer); drawerHandler.open() }}
                    openProfileBar={() => { setDrawer(ProfileBarDrawer); drawerHandler.open() }}
                    toggleShortcuts={() => setShortcutsVisible(!shortcutsVisible)}
                    showShortcutsToggle={!!(config.shortcuts && config.shortcuts.length)}
                    currentClipId={currentClipId}
                    setCurrentClipId={setCurrentClipId}
                />
            </AppShell.Header>

            <AppShell.Main>
                <Affix position={{top: affixOffset}} w="100%">
                    <Stack align='stretch' gap="md">
                        {!online ? <Badge color="red" size="lg" m="0 auto">No internet connection...</Badge> : null}
                        {shortcutsVisible && !!(config.shortcuts && config.shortcuts.length) && <ShortcutView />}
                        <PinManager/>
                    </Stack>
                </Affix>

                <Drawer zIndex={300} opened={drawerOpen} onClose={drawerHandler.close} withCloseButton={false} padding={0} size={drawer?.size} position={drawer?.position}>
                    {drawer ? <drawer.component height="100vh" modActions={modActions} close={drawerHandler.close} openProfileBar={() => { setDrawer(ProfileBarDrawer); drawerHandler.open() }} openSettings={(tab?: SettingsTab) => { setDrawer({...SettingsDrawer, props: {tab}}); drawerHandler.open() }} {...drawer.props} openUserProfile={() => { setDrawer({...UserCardDrawer}); drawerHandler.open() }} ></drawer.component> : null}
                </Drawer>
                {(drawerOpen || shouldScroll) ? null : (
                    <Affix position={{ bottom: 10 + (footer.current ? footer.current.scrollHeight : 0), left: 0 }}>
                        <Button ml={(width - 166) / 2} onClick={scrollToBottom} leftSection={<IconMessagePause />} variant="gradient" gradient={{ from: 'var(--mantine-color-skyblue-8)', to: 'var(--mantine-color-paleviolet-5)', deg: 55 }} style={{ borderRadius: 16 }}>New Messages</Button>
                    </Affix>
                )}
                <ScrollArea viewportRef={viewport} pos='absolute' w={width} h={height - (footer.current ? footer.current.scrollHeight : 0)} type="never" onScrollPositionChange={onScrollPositionChange} style={{ fontSize: config.fontSize }}>
                    <Space h={48}></Space>
                    <Chat messages={chatMessages} openModView={openModView} moderatedChannel={moderatedChannel} modActions={modActions} deletedMessages={deletedMessagesIndex} setReplyMsg={(msg) => { if (msg) { setReplyMsg(msg); config.setChatChannel(msg.target.substring(1)); chatInputHandler.open(); } }} />
                </ScrollArea>
                <Space h={footer.current ? footer.current.scrollHeight + 5 : 20}></Space>
            </AppShell.Main>
            <AppShell.Footer >
                {config.chatEnabled ? <div ref={footer}><ChatInput close={chatInputHandler.close} replyToMsg={replyMsg} setReplyMsg={setReplyMsg} /></div> : null}
            </AppShell.Footer>
        </AppShell>
    );
}
