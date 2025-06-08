import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { ChatEmotesContext, ConfigContext, LoginContextContext, ProfileContext } from '../ApplicationContext';
import { useViewportSize, useDisclosure, useForceUpdate, useThrottledState, useDocumentVisibility, useNetwork, useDidUpdate } from '@mantine/hooks';
import { ScrollArea, Affix, Drawer, Button, Space, Badge, Stack } from '@mantine/core';
import { IconAlertTriangle, IconDeviceDesktop, IconRepeat } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Chat } from '../components/chat/Chat';
import { MobileAppPrompt } from '../components/chat/MobileAppPrompt';
import { ShortcutView } from '../components/shortcuts/ShortcutView';
import { IconMessagePause } from '@tabler/icons-react';
import { AppShell } from '@mantine/core';
import { Header } from '../components/header/Header';
import { EventDrawer } from '../components/events/eventdrawer';
import { ChatInput } from '../components/chat/ChatInput';
import { HelixModeratedChannel } from '@twurple/api';
import { SettingsDrawer, SettingsTab } from '../components/settings/settings';
import { ReactComponentLike } from 'prop-types';
import { ModDrawer } from '../components/chat/mod/modview';
import { HeheMessage, parseMessage, HeheChatMessage } from '../commons/message';
import { TwitchDrawer } from '../components/twitch/twitchview';
import { ModActions, deleteMessage, timeoutUser, banUser, unbanUser, raidUser, shoutoutUser, modUser, unmodUser, vipUser, unvipUser, unraid } from '../components/chat/mod/modactions';
import { ProfileBarDrawer } from '../components/profile/profilebar';
import { Storage } from '../components/chat/chatstorage';
import { AlertSystem } from '../components/alerts/alertplayer';
import { ReloadAlertsButton } from '../components/alerts/ReloadAlertsButton';
import { toMap } from '../commons/helper';
import { Event } from '../commons/events';
import { UserCardDrawer } from '../components/login/usercard';
import { PinManager } from '../components/pinned/pinmanager';
import { useViewportWidthCallback } from '../commons/helper';
import { getDimension } from '../components/twitch/twitchplayer';
import { EmoteStore } from '../components/chat/emotestorage';
import { getRawData } from '@twurple/common';
import classes from './chat.module.css'

export type OverlayDrawer = {
    name: string;
    component: ReactComponentLike;
    position: 'bottom' | 'left' | 'right' | 'top';
    size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
    props?: any;
}

interface ChatPageProps {
    connectionStatus?: {
        status: string;
        reconnectAttempts: number;
        lastHeartbeat: string | null;
    };
}

export function ChatPage({ connectionStatus }: ChatPageProps) {
    const viewport = useRef<HTMLDivElement>(null);
    const footer = useRef<HTMLDivElement>(null);
    const { width, height } = useViewportSize();
    const config = useContext(ConfigContext);
    const profile = useContext(ProfileContext);
    const [chatMessages, setChatMessages] = useThrottledState<HeheMessage[]>([], 500);
    const [usernames, setUsernames] = useState<Set<string>>(new Set());
    const [shouldScroll, setShouldScroll] = useState(true);
    const [drawer, setDrawer] = useState<OverlayDrawer | undefined>(undefined);
    const [drawerOpen, drawerHandler] = useDisclosure(false);
    const [replyMsg, setReplyMsg] = useState<HeheChatMessage>();
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
    const [connectionWarning, setConnectionWarning] = useState<string | null>(null);
    const notificationIdsRef = useRef<string[]>([]);

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
        
        // Track username from new messages
        if (msg.type === 'chat') {
            setUsernames(prev => new Set([...prev, msg.userInfo.userName.toLowerCase()]));
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
        console.log(eventname, data);
        if (data.eventtype === "seventv_emote_add") {
            const d = JSON.parse(data.text);
            PubSub.publish('Update-seventTV', {type: "add", data: d})
        }
        if (data.eventtype === "seventv_emote_remove") {
            const d = JSON.parse(data.text);
            PubSub.publish('Update-seventTV', {type: "remove", data: d})
        }
    }, [chatMessages]);

    useViewportWidthCallback(() => {
        const [w, h] = getDimension();
        setVideoHeight(h);
    });

    useEffect(() => {
        forceUpdate();
    }, [replyMsg]);

    // Define interfaces for the new connection data structure
    interface ConnectionSource {
        userId: string;
        userName: string;
        channels: string[];
        guid: string;
        connectionStatus: any;
    }
    
    interface ProfileSources {
        [sourceName: string]: ConnectionSource;
    }
    
    interface ProfileConnection {
        profileName: string;
        sources: ProfileSources;
    }
    
    interface UserConnections {
        [connectionId: string]: ProfileConnection;
    }
    
    interface ConnectionsData {
        [username: string]: UserConnections;
    }
    
    interface ConnectionsResponse {
        connection_count: number;
        connections: ConnectionsData;
    }

    // Function to check connections and show warnings if needed
    const checkConnections = useCallback(async () => {
        try {
            if (!config.checkBrowsersourceConnection) {
                return;
            }
            const token = localStorage.getItem('hehe-token_state') || '';
            if (!token) return;
            
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/connection?token=${token}`);
            const data: ConnectionsResponse = await response.json();
            
            // Clear previous notifications
            notificationIdsRef.current.forEach((id: string) => notifications.hide(id));
            const newNotificationIds: string[] = [];
            
            if (!data || !data.connections || Object.keys(data.connections).length === 0) {
                return;
            }
            
            // Check for Browsersource connections across all users and profiles
            let hasBrowserSourceForCurrentProfile = false;
            let browserSourceForDifferentProfileName = '';
            let browserSourceConnectionsCount = 0;
            let replayAppConnectionsCount = 0;
            
            // Iterate through all users and their connections
            Object.values(data.connections).forEach(userConnections => {
                // Check each connection (profile)
                Object.entries(userConnections).forEach(([connectionId, profileConnection]) => {
                    // Check if this profile has Browsersource connections
                    if (profileConnection.sources && profileConnection.sources['Browsersource']) {
                        if (connectionId === profile.guid) {
                            hasBrowserSourceForCurrentProfile = true;
                            browserSourceConnectionsCount = 1; // Each connection represents one browsersource
                        } else {
                            browserSourceForDifferentProfileName = profileConnection.profileName;
                        }
                    }
                    
                    // Check if this profile has ReplayApp connections
                    if (connectionId === profile.guid && 
                        profileConnection.sources && 
                        profileConnection.sources['ReplayApp']) {
                        replayAppConnectionsCount = 1; // Each connection represents one replayapp
                    }
                });
            });
            
            // Check if user has set Alert Audio to Browsersource
            if (config.browserSourceAudio && !hasBrowserSourceForCurrentProfile) {
                const id = `browsersource-warning-${Date.now()}`;
                notifications.show({
                    id,
                    title: 'Connection Warning',
                    message: 'You have set Alert Audio to Browsersource, but there is no Browsersource connected for this profile. Your alerts may not play correctly.',
                    color: 'yellow',
                    icon: <IconAlertTriangle size="1rem" />,
                    autoClose: 10000,
                });
                newNotificationIds.push(id);
            }
            
            // Check if there's a Browsersource for a different profile
            if (browserSourceForDifferentProfileName) {
                const id = `browsersource-different-profile-${Date.now()}`;
                notifications.show({
                    id,
                    title: 'Connection Warning',
                    message: `There is a Browsersource connected for profile "${browserSourceForDifferentProfileName}". Make sure this is intended.`,
                    color: 'yellow',
                    icon: <IconAlertTriangle size="1rem" />,
                    autoClose: 10000,
                });
                newNotificationIds.push(id);
            }
            
            // Show notifications for Browsersource connections
            if (browserSourceConnectionsCount > 0) {
                const id = `browsersource-connected-${Date.now()}`;
                notifications.show({
                    id,
                    title: 'Browsersource Connected',
                    message: `${browserSourceConnectionsCount} Browsersource connection(s) found for profile "${profile.name}"`,
                    color: 'green',
                    icon: <IconDeviceDesktop size="1rem" />,
                    autoClose: 3000,
                });
                newNotificationIds.push(id);
            }
            
            // Show notifications for ReplayApp connections
            if (replayAppConnectionsCount > 0) {
                const id = `replayapp-connected-${Date.now()}`;
                notifications.show({
                    id,
                    title: 'ReplayApp Connected',
                    message: `${replayAppConnectionsCount} ReplayApp connection(s) found for profile "${profile.name}"`,
                    color: 'green',
                    icon: <IconRepeat size="1rem" />,
                    autoClose: 3000,
                });
                newNotificationIds.push(id);
            }
            
            notificationIdsRef.current = newNotificationIds;
        } catch (error) {
            console.error('Error checking connections:', error);
        }
    }, [config.checkBrowsersourceConnection, config.browserSourceAudio, profile.guid]);

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
            if (AlertSystem.shouldBePlayedInApp(data)) {
                AlertSystem.addEvent(data);
            }
        });
        const modEventSub = PubSub.subscribe("WS-modevent", onModEvent);

        Storage.load(config.channels, config.ignoredUsers).then(rawMessages => {
            const msgs = rawMessages.map(parseMessage);
            setUsernames(new Set(msgs.filter(msg => msg.type === 'chat').map(msg => msg.userInfo.userName.toLowerCase())));
            setChatMessages(msgs);
        });

        if (loginContext.user) {
            const userId = loginContext.user.id;
            EmoteStore.getUserEmotes(userId).then(async (userEmotes) => {
                if (!userEmotes || Date.now() - userEmotes.timestamp > 24 * 60 * 60 * 1000) { // Refresh if older than 24h
                    console.log("load useremote");
                    const api = loginContext.getApiClient();
                    
                    const userEmotesResult = (await api.chat.getUserEmotesPaginated(userId).getAll()).map(getRawData);
                    console.log("userEmotesResult", userEmotesResult);

                    await EmoteStore.storeUserEmotes(userId, userEmotesResult);
                }
            });
        }

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
        }, 5000);

        (config.channels || []).forEach(channel => {
            emotes.updateChannel(channel).then(forceUpdate);
        });
        const state = localStorage.getItem('hehe-token_state') || '';
        AlertSystem.addNewChannels(config.channels);
        PubSub.publish("WSSEND", { 
            type: "subscribe", 
            source: "HeheChat App", 
            profile: profile.guid,
            profileName: profile.name,
            state, 
            channels: Object.fromEntries(config.channels.map(key => [key, true])) 
        });

        return () => {
            PubSub.unsubscribe(msgSub);
            PubSub.unsubscribe(eventSub);
            PubSub.unsubscribe(modEventSub);
            config.off(chatHandler);
        };
    }, [config.channels, config.ignoredUsers, config.raidTargets, profile.guid, config.maxMessages, config.freeTTS, loginContext.user]);

    useDidUpdate(() => {
        setOnline(networkStatus.online);
        setShouldScroll(true);
        if (networkStatus.online && documentVisible) {
            Storage.load(config.channels, config.ignoredUsers).then(rawMessages => {
                const msgs = rawMessages.map(parseMessage);
                setUsernames(new Set(msgs.filter(msg => msg.type === 'chat').map(msg => msg.userInfo.userName.toLowerCase())));
                setChatMessages(msgs);
            });
        }
        if (!AlertSystem.status()) {
            AlertSystem.initialize();
        } 
        setTimeout(() => {
            scrollToBottom();
        }, 2000);

        // Check connections when component mounts
        checkConnections();
    }, [documentVisible, networkStatus.online]);

    // Check connections when profile changes or browserSourceAudio setting changes
    useEffect(() => {
        checkConnections();
    }, [profile.guid, config.browserSourceAudio]);

    useEffect(() => {
        if (shouldScroll) {
            scrollToBottom();
        }
    }, [chatMessages, shouldScroll]);

    const openModView = (channel: string, channelId: string, username: string) => {
        ModDrawer.props = { channel, channelId, username };
        setDrawer(ModDrawer);
        drawerHandler.open()
    }

    const modActions: ModActions = {
        deleteMessage,
        timeoutUser,
        banUser,
        unbanUser,
        shoutoutUser,
        raidUser,
        modUser,
        unmodUser,
        vipUser,
        unvipUser,
        unraid
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
                    connectionStatus={connectionStatus}
                />
            </AppShell.Header>

            <AppShell.Main>
                <MobileAppPrompt />
                <Affix position={{top: affixOffset}} w="100%">
                    <Stack align='stretch' gap="md">
                        {!online ? <Badge color="red" size="lg" m="0 auto">No internet connection...</Badge> : null}
                        
                        
                        {shortcutsVisible && !!(config.shortcuts && config.shortcuts.length) && <ShortcutView />}
                        <PinManager/>
                        <ReloadAlertsButton />
                    </Stack>
                </Affix>

                <Drawer className={classes.dialog} zIndex={300} opened={drawerOpen} onClose={drawerHandler.close} withCloseButton={false} padding={0} size={drawer?.size} position={drawer?.position}>
                    {drawer ? <drawer.component 
                        style={{overflow: 'visible'}} 
                        height="100dvh" 
                        modActions={modActions} 
                        close={drawerHandler.close} 
                        openProfileBar={() => { setDrawer(ProfileBarDrawer); drawerHandler.open() }} 
                        openSettings={(tab?: SettingsTab) => { setDrawer({...SettingsDrawer, props: {tab}}); drawerHandler.open() }}
                        openDrawer={(drawer: OverlayDrawer) => { setDrawer(drawer); drawerHandler.open() }}
                        {...drawer.props} 
                        openUserProfile={() => { setDrawer({...UserCardDrawer}); drawerHandler.open() }}
                    ></drawer.component> : null}
                </Drawer>
                {(drawerOpen || shouldScroll) ? null : (
                    <Affix position={{ bottom: 10 + (footer.current ? footer.current.scrollHeight : 0), left: 0 }}>
                        <Button ml={(width - 166) / 2} onClick={scrollToBottom} leftSection={<IconMessagePause />} variant="gradient" radius={"lg"}>New Messages</Button>
                    </Affix>
                )}
                <ScrollArea viewportRef={viewport} pos='absolute' w={width} h={height - (footer.current ? footer.current.scrollHeight : 0)} type="never" onScrollPositionChange={onScrollPositionChange} style={{ fontSize: config.fontSize }}>
                    <Space h={48}></Space>
                    <Chat messages={chatMessages} openModView={openModView} moderatedChannel={moderatedChannel} modActions={modActions} deletedMessages={deletedMessagesIndex} setReplyMsg={(msg) => { if (msg) { setReplyMsg(msg); config.setChatChannel(msg.target.substring(1)); chatInputHandler.open(); } }} />
                </ScrollArea>
                <Space h={footer.current ? footer.current.scrollHeight + 5 : 20}></Space>
            </AppShell.Main>
            <AppShell.Footer >
                {config.chatEnabled ? <div ref={footer}><ChatInput close={chatInputHandler.close} replyToMsg={replyMsg} setReplyMsg={setReplyMsg} modActions={modActions} openModView={openModView} usernames={Array.from(usernames)}/></div> : null}
            </AppShell.Footer>
        </AppShell>
    );
}
