
import { useState, useEffect, useRef, useContext } from 'react';
import { ChatEmotesContext, ConfigContext, LoginContextContext, ProfileContext } from '@/ApplicationContext';
import { useViewportSize, useDisclosure, useForceUpdate, useThrottledState, useDocumentVisibility, useNetwork, useDidUpdate } from '@mantine/hooks';
import { ScrollArea, Affix, Drawer, Button, Space, ActionIcon, Badge } from '@mantine/core';
import { Chat } from '@/components/chat/Chat';
import { IconMessagePause, IconMessage } from '@tabler/icons-react';
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
    const [chatInputOpened, chatInputHandler] = useDisclosure(false);
    const loginContext = useContext(LoginContextContext);
    const [deletedMessages, setDeletedMessages] = useState<string[]>([]);
    const forceUpdate = useForceUpdate();
    const emotes = useContext(ChatEmotesContext);
    const [online, setOnline] = useState(true);
    const documentVisible = useDocumentVisibility();
    const networkStatus = useNetwork();

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
        viewport.current!.scrollTo({ top: viewport.current!.scrollHeight + 60 });
    }

    const deletedMessagesIndex = deletedMessages.reduce((obj: any, key: string) => { obj[key] = true; return obj }, {});
    const moderatedChannel = loginContext.moderatedChannels.reduce((obj: any, c: HelixModeratedChannel) => { obj[c.name] = true; return obj }, {});

    const addMessage = (msg: HeheMessage, user: string) => {
        Storage.store(msg.target.substring(1), user, msg.date, msg.rawLine);
        if (config.ignoredUsers.indexOf(user) !== -1) {
            return;
        }
        if (msg.id && messageIndex.has(msg.id)) {
            return;
        }
        setChatMessages((prevMessages) => [...prevMessages, msg].slice(shouldScroll ? (-1 * config.maxMessages) : 0));
    }

    useEffect(() => {
        if (profile.name === 'default' && !config.channels.length) {
            setTimeout(() => {
                if (loginContext.user) {
                    config.setChannels([loginContext.user!.name]);
                }
                setDrawer({...SettingsDrawer, props: {tab: 'Chat'} });
                drawerHandler.open();
            }, 1000);
        }
        config.loadShares();

        const msgSub = PubSub.subscribe("WS-msg", (msg, data) => {
            addMessage(parseMessage(data.message), data.username);
        });
        const eventSub = PubSub.subscribe("WS-event", (msg, data: Event) => {
            if (config.playAlerts && config.receivedShares.includes(data.channel) && config.activatedShares.includes(data.channel)) {
                AlertSystem.addEvent(data);
            }
        });
        const modEventSub = PubSub.subscribe("WS-modevent", (msg, data) => {
            console.log("modEvent", data);
        });

        return () => {
            PubSub.unsubscribe(msgSub);
            PubSub.unsubscribe(eventSub);
            PubSub.unsubscribe(modEventSub);
        }
    }, []);

    useEffect(() => {
        const chatHandler = config.onMessage({
            handle: async (channel, text, replyTo) => {
                PubSub.publish('WSSEND', {type: 'sendMessage', channel, text, replyTo});
            }
        });

        Storage.load(config.channels, config.ignoredUsers).then(rawMessages => {
            const msgs = rawMessages.map(parseMessage);
            setChatMessages(msgs);
        });

        loginContext.moderatedChannels.forEach(mC => {
            emotes.updateUserInfo(loginContext, mC.name);
        });

        config.raidTargets.forEach(mC => {
            emotes.updateUserInfo(loginContext, mC);
        });

        profile.listProfiles().forEach(profile => {
            profile.config.channels.forEach(channel => {
                emotes.updateUserInfo(loginContext, channel);
            });
        });

        setShouldScroll(true);

        setTimeout(() => {
            scrollToBottom();
        }, 1000);

        config.channels.forEach(channel => {
            emotes.updateChannel(loginContext, channel).then(forceUpdate);
            forceUpdate();
        });
        const state = localStorage.getItem('hehe-token_state') || '';
        AlertSystem.addNewChannels(config.channels);
        PubSub.publish("WSSEND", { type: "subscribe", state, channels: Object.fromEntries(config.channels.map(key => [key, true])) });

        return () => {
            config.off(chatHandler);
        };
    }, [config.channels, profile.guid]);

    useEffect(() => {
        forceUpdate();
    }, [chatInputOpened]);

    useDidUpdate(() => {
        setOnline(networkStatus.online);

        if (networkStatus.online && documentVisible) {
            Storage.load(config.channels, config.ignoredUsers).then(rawMessages => {
                const msgs = rawMessages.map(parseMessage);
                setChatMessages(msgs);
            });
        }
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

    return (
        <AppShell>
            <AppShell.Header>
                <Header openSettings={(tab?: SettingsTab) => { setDrawer({...SettingsDrawer, props: {tab} }); drawerHandler.open() }}
                    openEvents={() => { setDrawer(EventDrawer); drawerHandler.open() }}
                    openTwitch={() => { setDrawer(TwitchDrawer); drawerHandler.open() }}
                    openProfileBar={() => { setDrawer(ProfileBarDrawer); drawerHandler.open() }} />
            </AppShell.Header>

            {!online ? <Affix position={{top: 65}} w="100%" ta="center">
                <Badge color="red" size="lg">No internet connection...</Badge>
            </Affix> : null}

            <AppShell.Main>
                <Drawer zIndex={300} opened={drawerOpen} onClose={drawerHandler.close} withCloseButton={false} padding={0} size={drawer?.size} position={drawer?.position}>
                    {drawer ? <drawer.component height="100vh" modActions={modActions} close={drawerHandler.close} openProfileBar={() => { setDrawer(ProfileBarDrawer); drawerHandler.open() }} openSettings={(tab?: SettingsTab) => { setDrawer({...SettingsDrawer, props: {tab}}); drawerHandler.open() }} {...drawer.props} openUserProfile={() => { setDrawer({...UserCardDrawer}); drawerHandler.open() }} ></drawer.component> : null}
                </Drawer>
                {(drawerOpen || shouldScroll) ? null : (
                    <Affix position={{ bottom: 20 + (footer.current ? footer.current.scrollHeight : 0), left: 0 }}>
                        <Button ml={(width - 166) / 2} onClick={scrollToBottom} leftSection={<IconMessagePause />} variant="gradient" gradient={{ from: 'grape', to: 'violet', deg: 90 }} style={{ borderRadius: 16 }}>New Messages</Button>
                    </Affix>
                )}
                <ScrollArea viewportRef={viewport} pos='absolute' w={width} h={height - (footer.current ? footer.current.scrollHeight : 0)} type="never" onScrollPositionChange={onScrollPositionChange} style={{ fontSize: config.fontSize }}>
                    <Space h={48}></Space>
                    <Chat messages={chatMessages} openModView={openModView} moderatedChannel={moderatedChannel} modActions={modActions} deletedMessages={deletedMessagesIndex} setReplyMsg={(msg) => { if (msg) { setReplyMsg(msg); config.setChatChannel(msg.target.substring(1)); chatInputHandler.open(); } }} />
                </ScrollArea>
                <Space h={footer.current ? footer.current.scrollHeight + 5 : 20}></Space>
            </AppShell.Main>
            <AppShell.Footer >
                {(config.chatEnabled && !drawerOpen && config.channels.length) ?
                    (chatInputOpened ? <div ref={footer}><ChatInput close={chatInputHandler.close} replyToMsg={replyMsg} setReplyMsg={setReplyMsg} /></div> : <Affix position={{ bottom: 30, right: 20 }}><ActionIcon variant='gradient' gradient={{ from: 'violet', to: 'grape', deg: 125 }} size='48' radius='xl' onClick={() => {chatInputHandler.open(); setTimeout(scrollToBottom, 500)}}><IconMessage /></ActionIcon></Affix>) : null}
            </AppShell.Footer>
        </AppShell>
    );
}