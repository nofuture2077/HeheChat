import { useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react';
import { ChatEmotesContext, ConfigContext, LoginContextContext, ProfileContext, PremiumContext } from '../ApplicationContext';
import { useViewportSize, useDisclosure, useForceUpdate, useThrottledState, useDocumentVisibility, useNetwork } from '@mantine/hooks';
import { ScrollArea, Affix, Drawer, Button, Space, Badge, Stack, ActionIcon, Text, useComputedColorScheme } from '@mantine/core';
import { IconAlertTriangle, IconDeviceDesktop, IconRepeat, IconMessagePause, IconSettings, IconKeyboard, IconBell, IconBrandTwitch, IconPlayerPlay } from '@tabler/icons-react';
import PubSub from 'pubsub-js';
import { notifications } from '@mantine/notifications';
import { Chat } from '../components/chat/Chat';
import { MobileAppPrompt } from '../components/chat/MobileAppPrompt';
import { ShortcutView } from '../components/shortcuts/ShortcutView';
import { AppShell } from '@mantine/core';
import { Header } from '../components/header/Header';
import { ConnectionStatusBanner } from '../components/header/ConnectionStatusBanner';
import { HeaderLogo } from '../components/header/HeaderLogo';
import { EventDrawer } from '../components/events/eventdrawer';
import { RecentEventsPanel } from '../components/events/recenteventspanel';
import { ChatInput } from '../components/chat/ChatInput';
import { StreamStatusBar } from '../components/switcher/StreamStatusBar';
import { HelixModeratedChannel } from '@twurple/api';
import { SettingsDrawer, SettingsTab } from '../components/settings/settings';
import { PremiumDrawer } from '../components/premium/DonationPremium';
import { ReactComponentLike } from 'prop-types';
import { ModDrawer } from '../components/chat/mod/modview';
import { MassBanDrawer } from '../components/chat/mod/massban';
import { HeheMessage, parseMessage, HeheChatMessage, SystemMessage, SystemMessageMainType, shouldReadMessage, ttsSpamTracker } from '../commons/message';
import { EventType, EventTypeMapping } from '../commons/events';
import { TwitchDrawer } from '../components/twitch/twitchview';
import { TwitchPlayer } from '../components/twitch/twitchplayer';
import { TwitchClipsPlayer } from '../components/twitch/twitchclipsplayer';
import { ModActions, deleteMessage, timeoutUser, banUser, unbanUser, raidUser, shoutoutUser, modUser, unmodUser, vipUser, unvipUser, unraid } from '../components/chat/mod/modactions';
import { Storage } from '../components/chat/chatstorage';
import { EventStorage, EventData } from '../components/events/eventstorage';
import { AlertSystem } from '../components/alerts/alertplayer';
import { AlertStatusIndicator } from '../components/alerts/AlertStatusIndicator';
import { ReloadAlertsButton } from '../components/alerts/ReloadAlertsButton';
import { toMap } from '../commons/helper';
import { Event } from '../commons/events';
import { UserCardDrawer } from '../components/login/usercard';
import { PinManager } from '../components/pinned/pinmanager';
import { useViewportWidthCallback } from '../commons/helper';
import { getDimension } from '../components/twitch/twitchplayer';
import { EmoteStore } from '../components/chat/emotestorage';
import { getRawData } from '@twurple/common';
import { NewsDisplay } from '../components/news/NewsDisplay';
import classes from './chat.module.css'
import { version } from '../../package.json';

export type OverlayDrawer = {
    name: string;
    component: ReactComponentLike;
    position: 'bottom' | 'left' | 'right' | 'top';
    size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
    props?: any;
}

interface ChatPageProps {
}

export function ChatPage() {
    const viewport = useRef<HTMLDivElement>(null);
    const footer = useRef<HTMLDivElement>(null);
    const { width, height } = useViewportSize();
    const colorScheme = useComputedColorScheme('dark');
    const isDark = colorScheme === 'dark';
    const headerGradient = isDark
        ? 'linear-gradient(to bottom, #1f1720 0%, #171317 100%)'
        : 'linear-gradient(to bottom, rgba(180,80,160,0.10) 0%, rgba(180,80,160,0.04) 100%), var(--mantine-color-gray-0)';
    const footerGradient = isDark
        ? 'linear-gradient(to bottom, #171317 0%, #1f1720 100%)'
        : 'linear-gradient(to bottom, rgba(180,80,160,0.04) 0%, rgba(180,80,160,0.10) 100%), var(--mantine-color-gray-0)';
    const barBorderTop = isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)';
    const config = useContext(ConfigContext);
    const profile = useContext(ProfileContext);
    const premium = useContext(PremiumContext);
    const [chatMessages, setChatMessages] = useThrottledState<HeheMessage[]>([], 500);
    const [usernames, setUsernames] = useState<Set<string>>(new Set());
    const [shouldScroll, setShouldScroll] = useState(true);
    const shouldScrollRef = useRef(true);
    useEffect(() => { shouldScrollRef.current = shouldScroll; }, [shouldScroll]);
    const [drawer, setDrawer] = useState<OverlayDrawer | undefined>(undefined);
    const [drawerOpen, drawerHandler] = useDisclosure(false);
    const [emoteGridOpen, setEmoteGridOpen] = useState(false);
    
    // Custom drawer close handler that also updates the URL
    const closeDrawerAndUpdateURL = useCallback(() => {
        // Close the drawer
        drawerHandler.close();
        
        // Check if we're on a special path like /massban or any other special route
        if (window.location.pathname !== '/') {
            // Update URL to root without refreshing the page
            window.history.pushState({}, '', '/');
        }
    }, [drawerHandler]);
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
    const prevDocumentVisible = useRef(true); // Start with true to detect first hide->show transition
    const [videoHeight, setVideoHeight] = useState(0);
    const [recentEventsHeight, setRecentEventsHeight] = useState(0);
    const recentEventsRef = useRef<HTMLDivElement>(null);
    // Load shortcuts visible state from localStorage with profile.guid based key
    const [shortcutsVisible, setShortcutsVisible] = useState(() => {
        const key = `hehe-shortcuts-visible-${profile.guid}`;
        const saved = localStorage.getItem(key);
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [currentClipId, setCurrentClipId] = useState<string | null>(null);
    const notificationIdsRef = useRef<string[]>([]);
    const [unplayedEvents, setUnplayedEvents] = useState<EventData[]>([]);
    const [showUnplayedBanner, setShowUnplayedBanner] = useState(false);
    const unplayedBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Chat width state with localStorage persistence
    const [chatWidth, setChatWidth] = useState(() => {
        const saved = localStorage.getItem('hehe-chat-width');
        return saved ? parseInt(saved, 10) : 480;
    });
    const [isResizing, setIsResizing] = useState(false);

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

    const filteredMessages = useMemo(() =>
        chatMessages.filter(msg => {
            if (!(msg instanceof SystemMessage)) return true;
            const eventMainType = EventTypeMapping[msg.data.type as EventType] as SystemMessageMainType;
            return msg.data.type === 'announcement' || !!config.systemMessageInChat[eventMainType];
        }),
        [chatMessages, config.systemMessageInChat]
    );

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
            if (!(msg instanceof SystemMessage) || messageIndex.get(msg.id) instanceof SystemMessage) {
                return;
            }
            const eventMainType = EventTypeMapping[msg.data.type as EventType] as SystemMessageMainType;
            if (msg.data.type !== 'announcement' && !config.systemMessageInChat[eventMainType]) {
                return;
            }
            // System message replaces existing non-system message
            messageIndex.set(msg.id, msg);
            setChatMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
            return;
        }
        messageIndex.set(msg.id, msg);

        // Track username from new messages
        if (msg.type === 'chat') {
            setUsernames(prev => new Set([...prev, msg.userInfo.userName.toLowerCase()]));
        }

        setChatMessages((prevMessages) => prevMessages.concat(msg).slice((prevMessages.length % 2) ? 0 : (-1 * maxMessages + 1)));
    };

    const setMessages = (msgs: HeheMessage[], maxMessages: number) => {
        messageIndex.clear();
        const newMessages: HeheMessage[] = [];
        const usernames: string[] = [];

        for (const msg of msgs) {
            if (msg instanceof HeheChatMessage && config.ignoredUsers.indexOf(msg.userInfo.userName.toLowerCase()) !== -1) {
                continue;
            }

            if (msg instanceof SystemMessage) {
                const eventType = msg.data.type as EventType;
                const eventMainType = EventTypeMapping[eventType] as SystemMessageMainType;
                if (msg.data.type !== 'announcement' && !config.systemMessageInChat[eventMainType]) {
                    continue;
                }
            }

            if (msg.id && messageIndex.has(msg.id)) {
                if (!(msg instanceof SystemMessage) || messageIndex.get(msg.id) instanceof SystemMessage) {
                    continue;
                }
                // System message replaces existing non-system message
                const idx = newMessages.findIndex(m => m.id === msg.id);
                if (idx !== -1) newMessages[idx] = msg;
                messageIndex.set(msg.id, msg);
                continue;
            }

            // Track username from new messages
            if (msg.type === 'chat') {
                usernames.push(msg.userInfo.userName.toLowerCase());

            }
            messageIndex.set(msg.id, msg);
            newMessages.push(msg);
        }

        setUsernames(new Set(usernames));

        setChatMessages(newMessages);
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

    const handleForceSevenTVReload = useCallback(async () => {
        try {
            await emotes.forceReloadSevenTV(config.channels || []);
            notifications.show({
                title: '7TV refreshed',
                message: 'Reloaded 7TV emotes for your configured channels.',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: '7TV reload failed',
                message: error instanceof Error ? error.message : 'Unable to reload 7TV emotes right now.',
                color: 'red',
            });
        } finally {
            forceUpdate();
        }
    }, [config.channels, emotes, forceUpdate]);

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
            if (!config.checkBrowsersourceConnection || !config.browserSourceAudio) {
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
    }, [config, profile]);

    useEffect(() => {
        if (!config.channels || !config.channels.length || !loginContext.user) {
            return;
        }
        const chatHandler = config.onMessage({
            handle: async (channel, text, replyTo) => {
                PubSub.publish('WSSEND', {type: 'sendMessage', channel, text, replyTo});
            }
        });

        // Subscribe to the OPEN_MASSBAN event
        const massBanSub = PubSub.subscribe("OPEN_MASSBAN", (msg, data) => {
            MassBanDrawer.props = { channelId: data.channelId, channelName: data.channelName };
            setDrawer(MassBanDrawer);
            drawerHandler.open();
        });

        const premiumSub = PubSub.subscribe("OPEN_PREMIUM", (msg, data) => {
            setDrawer(PremiumDrawer);
            drawerHandler.open();
        });

        const msgSub = PubSub.subscribe("WS-msg", (msg, data) => {
            const message = parseMessage(data.message);
            if (config.readAllMessages && premium.isPremium && message.type === 'chat') {
                // Check if the user is not in the ignoreTTS list
                const username = data.username.toLowerCase();
                const passesSmartFilter = !config.smartFilter.enabled || shouldReadMessage(message, config.smartFilter);
                if ((!config.ignoreTTS || !config.ignoreTTS.includes(username)) && passesSmartFilter) {
                    const date = Date.now();

                    if (config.smartFilter.enabled && config.smartFilter.skipSpam &&
                        (ttsSpamTracker.isRepeatFromUser(username, message.text, date) || ttsSpamTracker.isCopypasta(username, message.text, date))) {
                        addMessage(message, data.username, config.maxMessages);
                        return;
                    }

                    const tts: Event = {
                        id: -1,
                        channel: message.target.slice(1),
                        username: data.username,
                        eventtype: 'tts',
                        date: date,
                        text: JSON.stringify({ 
                            text: {
                                parts: message.parts
                            }
                        })
                    }
                    AlertSystem.addEvent(tts);
                }
            }
            addMessage(message, data.username, config.maxMessages);
        });

        const ytChatSub = PubSub.subscribe("WS-ytchat", (msg, data) => {
            const message = parseMessage(data.message);
            addMessage(message, data.username, config.maxMessages);
        });

        const eventSub = PubSub.subscribe("WS-event", (msg, data: Event) => {
            if (AlertSystem.shouldBePlayedInApp(data)) {
                AlertSystem.addEvent(data);
            }
        });
        const modEventSub = PubSub.subscribe("WS-modevent", onModEvent);

        const gapSub = PubSub.subscribe("WS-gapDetected", (_msg, data: { since: number }) => {
            const since = data?.since ?? (Date.now() - 60000);
            // Recover missed chat messages
            Storage.loadSince(config.channels, config.ignoredUsers, since).then(missed => {
                missed.forEach(m => addMessage(parseMessage(m.message), m.username, config.maxMessages));
            });
            // Recover missed events (de-dupe against queue — items stay in array after playing)
            if (config.missedAlertsWindow !== 'none') {
                const windowMs: Record<string, number> = { '15m': 15 * 60 * 1000, '1h': 60 * 60 * 1000, '1d': 24 * 60 * 60 * 1000 };
                const cutoff = Date.now() - (windowMs[config.missedAlertsWindow] ?? 15 * 60 * 1000);
                EventStorage.load(config.channels, config.ignoredUsers, since).then(events => {
                    const knownIds = new Set(AlertSystem.queue.map((e: Event) => e.id));
                    events
                        .filter(e => !e.played
                            && !knownIds.has(e.id)
                            && AlertSystem.shouldBePlayedInApp(e as unknown as Event)
                            && e.date >= cutoff)
                        .sort((a, b) => a.date - b.date)
                        .forEach(e => AlertSystem.addEvent(e as unknown as Event));
                });
            }
        });

        Storage.load(config.channels, config.ignoredUsers, config.maxMessages).then(rawMessages => {
            const msgs = rawMessages.map(parseMessage);
            setMessages(msgs, config.maxMessages);
        });

        if (loginContext.user) {
            const userId = loginContext.user.id;
            EmoteStore.getUserEmotes(userId).then(async (userEmotes) => {
                if (!userEmotes || Date.now() - userEmotes.timestamp > 24 * 60 * 60 * 1000) { // Refresh if older than 24h
                    const api = loginContext.getApiClient();
                    
                    const userEmotesResult = (await api.chat.getUserEmotesPaginated(userId).getAll()).map(getRawData);

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
            version,
            state, 
            channels: Object.fromEntries(config.channels.map(key => [key, true])) 
        });

        return () => {
            PubSub.unsubscribe(msgSub);
            PubSub.unsubscribe(ytChatSub);
            PubSub.unsubscribe(eventSub);
            PubSub.unsubscribe(modEventSub);
            PubSub.unsubscribe(massBanSub);
            PubSub.unsubscribe(gapSub);
            config.off(chatHandler);
        };
    }, [config.channels, config.ignoredUsers, config.raidTargets, profile.guid, config.maxMessages, config.freeTTS, config.ignoreTTS, config.readAllMessages, config.smartFilter, config.systemMessageInChat, loginContext.user]);

    // Track document visibility changes for reload functionality
    useEffect(() => {
        const isVisible = documentVisible === 'visible';
        
        // Check if document became visible (was hidden, now visible) and reload if enabled
        if (isVisible && !prevDocumentVisible.current && networkStatus.online && config.reloadOnReturnToApp && !drawerOpen && !config.showVideo) {
            console.log('Reloading page due to return to app');
            window.location.reload();
            return;
        }
        
        // Update the previous visibility state
        prevDocumentVisible.current = isVisible;

        setOnline(networkStatus.online);
        setShouldScroll(true);
        if (networkStatus.online && isVisible) {
            Storage.load(config.channels, config.ignoredUsers, config.maxMessages).then(rawMessages => {
                const msgs = rawMessages.map(parseMessage);
                setMessages(msgs, config.maxMessages);
            });
        }
        if (!AlertSystem.status()) {
            AlertSystem.initialize();
        }

        // Check connections when component mounts
        checkConnections();
    }, [documentVisible, networkStatus.online, config.reloadOnReturnToApp]);

    // Save shortcuts visible state to localStorage when it changes
    useEffect(() => {
        const key = `hehe-shortcuts-visible-${profile.guid}`;
        localStorage.setItem(key, JSON.stringify(shortcutsVisible));
    }, [shortcutsVisible, profile.guid]);

    // Load shortcuts visible state when profile changes
    useEffect(() => {
        const key = `hehe-shortcuts-visible-${profile.guid}`;
        const saved = localStorage.getItem(key);
        const newState = saved !== null ? JSON.parse(saved) : true;
        setShortcutsVisible(newState);
    }, [profile.guid]);

    // Fetch missed alerts on load and on re-entry, filtered to the configured window
    useEffect(() => {
        const isVisible = documentVisible === 'visible';
        if (!networkStatus.online || !isVisible || config.channels.length === 0 || config.missedAlertsWindow === 'none') return;
        const windowMs: Record<string, number> = { '15m': 15 * 60 * 1000, '1h': 60 * 60 * 1000, '1d': 24 * 60 * 60 * 1000 };
        const cutoff = Date.now() - (windowMs[config.missedAlertsWindow] ?? 15 * 60 * 1000);
        EventStorage.load(config.channels, config.ignoredUsers).then(events => {
            const unplayed = events
                .filter(e => !e.played
                    && AlertSystem.shouldBePlayedInApp(e as unknown as Event)
                    && e.date >= cutoff)
                .sort((a, b) => a.date - b.date);
            if (unplayed.length > 0) {
                setUnplayedEvents(unplayed);
                setShowUnplayedBanner(true);
                if (unplayedBannerTimerRef.current) clearTimeout(unplayedBannerTimerRef.current);
                unplayedBannerTimerRef.current = setTimeout(() => setShowUnplayedBanner(false), 15000);
            }
        });
    }, [documentVisible, networkStatus.online, config.channels, config.ignoredUsers, config.missedAlertsWindow]);

    // Cleanup unplayed events banner timer on unmount
    useEffect(() => {
        return () => { if (unplayedBannerTimerRef.current) clearTimeout(unplayedBannerTimerRef.current); };
    }, []);

    const handleUnplayedBannerClick = useCallback(() => {
        setShowUnplayedBanner(false);
        if (unplayedBannerTimerRef.current) {
            clearTimeout(unplayedBannerTimerRef.current);
            unplayedBannerTimerRef.current = null;
        }
        unplayedEvents.forEach(event => AlertSystem.addEvent(event as unknown as Event));
        setUnplayedEvents([]);
    }, [unplayedEvents]);

    // Check connections when profile changes or browserSourceAudio setting changes
    useEffect(() => {
        checkConnections();
    }, [profile.guid, config.browserSourceAudio]);

    useEffect(() => {
        if (shouldScroll) {
            scrollToBottom();
        }
    }, [chatMessages, shouldScroll]);

    useEffect(() => {
        const viewportEl = viewport.current;
        const contentEl = viewportEl?.firstElementChild as HTMLElement | null;
        if (!viewportEl || !contentEl) return;
        const obs = new ResizeObserver(() => {
            if (shouldScrollRef.current) scrollToBottom();
        });
        obs.observe(contentEl);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        const wrapper = recentEventsRef.current;
        if (!wrapper) return;
        // ponytail: RecentEventsPanel renders position:absolute (mounts/unmounts with its
        // content), so the wrapper's own offsetHeight stays 0 — track the child directly
        // and re-bind whenever it mounts/unmounts.
        const resizeObs = new ResizeObserver(entries => setRecentEventsHeight(entries[0].target.getBoundingClientRect().height));
        const bindChild = () => {
            resizeObs.disconnect();
            const el = wrapper.firstElementChild;
            if (el) resizeObs.observe(el);
            else setRecentEventsHeight(0);
        };
        bindChild();
        const mutationObs = new MutationObserver(bindChild);
        mutationObs.observe(wrapper, { childList: true });
        return () => { resizeObs.disconnect(); mutationObs.disconnect(); };
    }, []);

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

    // Resize handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;
        
        const newWidth = width - e.clientX;
        const clampedWidth = Math.max(300, Math.min(800, newWidth));
        setChatWidth(clampedWidth);
    }, [isResizing, width]);

    const handleMouseUp = useCallback(() => {
        if (isResizing) {
            setIsResizing(false);
            localStorage.setItem('hehe-chat-width', chatWidth.toString());
        }
    }, [isResizing, chatWidth]);

    // Add event listeners for resize
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    const headerHeight = 36 + ((config.showVideo || currentClipId) ? videoHeight : 0);
    const affixOffset = headerHeight + (config.showBitrateIndicator ? 0 : 8) + recentEventsHeight + 8;
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const isDesktopVideoMode = config.desktopVideoMode && (config.showVideo || currentClipId) && !isMobile;

    // Desktop video layout with side-by-side video and chat
    if (isDesktopVideoMode) {
        return (
            <div className={classes.desktopVideoLayout}>
                <Drawer className={classes.dialog} zIndex={300} opened={drawerOpen} onClose={closeDrawerAndUpdateURL} withCloseButton={false} padding={0} size={drawer?.size} position={drawer?.position} trapFocus={false}>
                    {drawer ? <drawer.component
                        style={{overflow: 'visible'}}
                        height="100dvh"
                        modActions={modActions}
                        close={closeDrawerAndUpdateURL}
                        openSettings={(tab?: SettingsTab) => { setDrawer({...SettingsDrawer, props: {tab}}); drawerHandler.open() }}
                        openDrawer={(drawer: OverlayDrawer) => { setDrawer(drawer); drawerHandler.open() }}
                        {...drawer.props}
                        openUserProfile={() => { setDrawer({...UserCardDrawer}); drawerHandler.open() }}
                    ></drawer.component> : null}
                </Drawer>

                {/* Video Section */}
                <div className={classes.videoSection}>
                    {currentClipId ? (
                        <TwitchClipsPlayer clipId={currentClipId} onClose={() => setCurrentClipId(null)}/>
                    ) : config.showVideo ? (
                        <TwitchPlayer 
                            fullSize={true} 
                            customWidth={width - chatWidth} 
                            customHeight={height} 
                            muted={false}
                            hideViewer={
                                loginContext.user && config.getChatChannel() === loginContext.user.name 
                                    ? config.hideOwnViewers 
                                    : config.hideViewers
                            }
                        />
                    ) : null}
                </div>

                {/* Chat Section */}
                <div className={classes.chatSection} style={{ width: chatWidth }}>
                    {/* Resize Handle */}
                    <div className={classes.resizeHandle} onMouseDown={handleMouseDown} />
                    {/* Chat Header */}
                    <div className={classes.chatHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'visible' }}>
                            <HeaderLogo height={20}/>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Text fw={700} size="sm" c='primary'>HEHE</Text>
                                <Text fw={300} size="sm" c='primary'>Chat{premium.isPremium ? ' Pro' : ''}</Text>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <ActionIcon variant='transparent' color='primary' size='sm' onClick={() => { setDrawer({...SettingsDrawer}); drawerHandler.open() }}>
                                <IconSettings size={16} />
                            </ActionIcon>
                            
                            {!!(config.shortcuts && config.shortcuts.length) && (
                                <ActionIcon variant='transparent' color='primary' onClick={() => setShortcutsVisible(!shortcutsVisible)} size='sm'>
                                    <IconKeyboard size={16}/>
                                </ActionIcon>
                            )}

                            <ActionIcon variant='transparent' color='primary' size='sm' onClick={() => { setDrawer(EventDrawer); drawerHandler.open() }}>
                                <AlertStatusIndicator>
                                    <IconBell size={16} />
                                </AlertStatusIndicator>
                            </ActionIcon>
                            <ActionIcon variant='transparent' color='primary' size='sm' onClick={() => { setDrawer(TwitchDrawer); drawerHandler.open() }}>
                                <IconBrandTwitch size={16}/>
                            </ActionIcon>
                        </div>

                        
                    </div>

                    {/* Chat Content */}
                    <div className={classes.chatContent}>
                        <MobileAppPrompt />
                        
                        {/* Status indicators */}
                        <Stack align='stretch' gap="xs" p="xs">
                            {!online ? <Badge color="red" size="sm">No internet connection...</Badge> : null}
                            <NewsDisplay />
                            {shortcutsVisible && !!(config.shortcuts && config.shortcuts.length) && <ShortcutView />}
                            <PinManager/>
                            
                            {showUnplayedBanner && config.missedAlertsWindow !== 'none' && (
                                <Button size="xl" radius="xl" leftSection={<IconPlayerPlay size={24} />} onClick={handleUnplayedBannerClick} className={`glass-pink-button ${classes.missedAlertsButton}`}>
                                    Play {unplayedEvents.length} missed alert{unplayedEvents.length !== 1 ? 's' : ''}
                                </Button>
                            )}
                            <ReloadAlertsButton onActivate={() => setShowUnplayedBanner(false)} />
                        </Stack>

                        {/* Chat Messages */}
                        <div className={classes.chatMessages} style={{ position: 'relative' }}>
                            {!shouldScroll && !config.rainMode && !emoteGridOpen && (
                                <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                                    <Button size="xs" onClick={scrollToBottom} leftSection={<IconMessagePause size={14} />} variant="gradient" radius={"lg"} className="glass-pink-button">New Messages</Button>
                                </div>
                            )}
                            <ScrollArea viewportRef={viewport} h="100%" type="never" onScrollPositionChange={onScrollPositionChange} style={{ fontSize: config.fontSize }}>
                                <Space h={8}></Space>
                                <Chat messages={filteredMessages} openModView={config.rainMode ? () => {} : openModView} moderatedChannel={moderatedChannel} modActions={modActions} deletedMessages={deletedMessagesIndex} setReplyMsg={config.rainMode ? () => {} : (msg) => { if (msg) { setReplyMsg(msg); config.setChatChannel(msg.target.substring(1)); chatInputHandler.open(); } }} />
                                <Space h={8}></Space>
                            </ScrollArea>
                        </div>

                        {/* Chat Input */}
                        {config.chatEnabled && (
                            <div className={classes.chatInput}>
                                <ChatInput close={chatInputHandler.close} replyToMsg={replyMsg} setReplyMsg={setReplyMsg} modActions={modActions} openModView={openModView} usernames={Array.from(usernames)} onEmoteGridChange={setEmoteGridOpen}/>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Original layout for mobile or when video is not shown
    return (
        <AppShell>
            <AppShell.Header withBorder={false} style={{ background: headerGradient, boxShadow: isDark ? '0 1px 0 rgba(255,255,255,0.07)' : '0 1px 0 rgba(0,0,0,0.07)' }}>
                <Header
                    openSettings={(tab?: SettingsTab) => { setDrawer({...SettingsDrawer, props: {tab} }); drawerHandler.open() }}
                    openEvents={() => { setDrawer(EventDrawer); drawerHandler.open() }}
                    openTwitch={() => { setDrawer(TwitchDrawer); drawerHandler.open() }}
                    forceSevenTVReload={handleForceSevenTVReload}
                    toggleShortcuts={() => setShortcutsVisible(!shortcutsVisible)}
                    showShortcutsToggle={!!(config.shortcuts && config.shortcuts.length)}
                    currentClipId={currentClipId}
                    setCurrentClipId={setCurrentClipId}
                />
                <ConnectionStatusBanner />
                <div ref={recentEventsRef}><RecentEventsPanel/></div>
            </AppShell.Header>

            <AppShell.Main>
                <MobileAppPrompt />

                <Affix position={{top: affixOffset}} w="100%">
                    <Stack align='stretch' gap="md">
                        {(config.showBitrateIndicator || config.showSceneName || (premium.isPremium && config.showMoblinZoom)) && <div style={{ position: 'absolute', top: -recentEventsHeight - 8, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}><StreamStatusBar /></div>}
                        <div style={{marginTop: recentEventsHeight ? -16 : 17}}></div>
                        <NewsDisplay />
                        {showUnplayedBanner && (
                            <Button size="xl" radius="xl" leftSection={<IconPlayerPlay size={24} />} onClick={handleUnplayedBannerClick} className="glass-pink-button" style={{ padding: '16px 24px', fontSize: '18px', width: '95%', maxWidth: '400px', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
                                Play {unplayedEvents.length} missed alert{unplayedEvents.length !== 1 ? 's' : ''}
                            </Button>
                        )}
                        {shortcutsVisible && !!(config.shortcuts && config.shortcuts.length) && <ShortcutView />}
                        <PinManager/>
                        
                        <ReloadAlertsButton onActivate={() => setShowUnplayedBanner(false)} />
                    </Stack>
                </Affix>

                <Drawer className={classes.dialog} zIndex={300} opened={drawerOpen} onClose={closeDrawerAndUpdateURL} withCloseButton={false} padding={0} size={drawer?.size} position={drawer?.position} trapFocus={false}>
                    {drawer ? <drawer.component
                        style={{overflow: 'visible'}}
                        height="100dvh"
                        modActions={modActions}
                        close={closeDrawerAndUpdateURL}
                        openSettings={(tab?: SettingsTab) => { setDrawer({...SettingsDrawer, props: {tab}}); drawerHandler.open() }}
                        openDrawer={(drawer: OverlayDrawer) => { setDrawer(drawer); drawerHandler.open() }}
                        {...drawer.props}
                        openUserProfile={() => { setDrawer({...UserCardDrawer}); drawerHandler.open() }}
                    ></drawer.component> : null}
                </Drawer>
                {(drawerOpen || shouldScroll || config.rainMode || emoteGridOpen) ? null : (
                    <Affix position={{ bottom: 10 + (footer.current ? footer.current.scrollHeight : 0), left: 0 }}>
                        <Button ml={(width - 166) / 2} onClick={scrollToBottom} leftSection={<IconMessagePause />} variant="gradient" radius={"lg"} className="glass-pink-button">New Messages</Button>
                    </Affix>
                )}
                <div style={{ position: 'relative', height: height - (footer.current ? footer.current.scrollHeight : 0) }}>
                    <ScrollArea viewportRef={viewport} pos='absolute' top={0} w={width} h="100%" style={{ fontSize: config.fontSize }} type="never" onScrollPositionChange={onScrollPositionChange}>
                        <Chat messages={filteredMessages} openModView={config.rainMode ? () => {} : openModView} moderatedChannel={moderatedChannel} modActions={modActions} deletedMessages={deletedMessagesIndex} setReplyMsg={config.rainMode ? () => {} : (msg) => { if (msg) { setReplyMsg(msg); config.setChatChannel(msg.target.substring(1)); chatInputHandler.open(); } }} />
                    </ScrollArea>
                </div>
                <Space h={footer.current ? footer.current.scrollHeight + 5 : 20}></Space>
            </AppShell.Main>
            <AppShell.Footer withBorder={false} style={{ background: footerGradient, borderTop: barBorderTop, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)' }}>
                {config.chatEnabled ? <div ref={footer}><ChatInput close={chatInputHandler.close} replyToMsg={replyMsg} setReplyMsg={setReplyMsg} modActions={modActions} openModView={openModView} usernames={Array.from(usernames)} onEmoteGridChange={setEmoteGridOpen}/></div> : null}
            </AppShell.Footer>
        </AppShell>
    );
}
