import { createContext } from 'react';
import { StaticAuthProvider, AuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';

import { toMap } from './components/commons';
import { get7TVEmotes } from './components/sevenTV'

export interface LoginContext {
    clientId: string;
    accessToken?: string;
    userid?: string;
    isLoggedIn: () => boolean;
    getAuthProvider: () => AuthProvider
    getApiClient: () => ApiClient,
    setAccessToken: (token: string) => void;
}

export const DEFAULT_LOGIN_CONTEXT: LoginContext = {
    clientId: 'bryq3wo8ytvnipgwel5gn7qb8c65zz',
    isLoggedIn: () => {
        return !!DEFAULT_LOGIN_CONTEXT.accessToken;
    },
    getAuthProvider: () => {
        return new StaticAuthProvider(DEFAULT_LOGIN_CONTEXT.clientId, DEFAULT_LOGIN_CONTEXT.accessToken || '');
    },
    getApiClient: () => {
        return new ApiClient({ authProvider: DEFAULT_LOGIN_CONTEXT.getAuthProvider()});
    },
    setAccessToken: () => {}
};

export async function getUserId(context: LoginContext) {
    const api = context.getApiClient();

    return (await api.getTokenInfo()).userId;
}

export async function getBadgesAndEmotes(context: LoginContext, userId: string) {
    const api = context.getApiClient();

    const channelEmotes = await api.chat.getChannelEmotes(userId);
    const channelBadges = await api.chat.getChannelBadges(userId);

    return {
        channelBadges,
        channelEmotes
    }
}

export async function getGlobalBadgesAndEmotes(context: LoginContext) {
    const api = context.getApiClient();

    const channelEmotes = await api.chat.getGlobalEmotes();
    const channelBadges = await api.chat.getGlobalBadges();

    return {
        channelBadges,
        channelEmotes
    }
}

export async function getBadgesAndEmotesByNames(context: LoginContext, usernames: string[]) {
    console.log('loading icons');
    const api = context.getApiClient();

    const users = await api.users.getUsersByNames(usernames);

    const data = await Promise.all(users.map(async (user) => {
        const { channelBadges, channelEmotes } = await getBadgesAndEmotes(context, user.id);
        const sevenTVEmotes = await get7TVEmotes(user.id);
        const cheerEmotes = await api.bits.getCheermotes(user.id);
        return {
            user,
            channelBadges: toMap(channelBadges, ba => ba.id),
            channelEmotes: toMap(channelEmotes, em => em.name),
            cheerEmotes: cheerEmotes.getPossibleNames(),
            sevenTVEmotes
        }
    }));

    const { channelBadges, channelEmotes } = await getGlobalBadgesAndEmotes(context);

    data.push({
        //@ts-ignore
        user: {
            name: "global",
        },
        //@ts-ignore
        channelBadges: toMap(channelBadges, ba => ba.id),
        //@ts-ignore
        channelEmotes: toMap(channelEmotes, em => em.name)
    });

    console.log('everything is loaded');

    return toMap(data, d => d.user.name);
}

export interface ChatEmotes {
    emotes: Map<string, any>,
    update: (context: LoginContext, channels: string[]) => Promise<void>;
    updateChannel: (context: LoginContext, channel: string) => Promise<void>;
    getBadge: (channel: string, badge: string, key: string) => any;
    getEmote: (channel: string, word: string, key: string) => any;
    getCheerEmotes: (channel: string) => string[];
    getLogo: (channel: string) => any;
    getChannelId: (channel: string) => string;
}

export const CHAT_EMOTES: ChatEmotes = {
    emotes: new Map(),
    update: async (context, channels) => {
        CHAT_EMOTES.emotes = await getBadgesAndEmotesByNames(context, channels);
    },
    updateChannel: async (context, channel) => {
        CHAT_EMOTES.emotes.set(channel, (await getBadgesAndEmotesByNames(context, [channel])).get(channel));
    },
    getBadge: (channel: string, badgeData: string, key: string) => {
        const [badge, version] = badgeData.split(',');
        if (CHAT_EMOTES.emotes.get(channel) && CHAT_EMOTES.emotes.get(channel).channelBadges.get(badge) && CHAT_EMOTES.emotes.get(channel).channelBadges.get(badge).getVersion(version)) {
            const b = CHAT_EMOTES.emotes.get(channel).channelBadges.get(badge).getVersion(version);
            return <img src={b.getImageUrl(1)} key={key}/>
        }
        if (CHAT_EMOTES.emotes.get('global') && CHAT_EMOTES.emotes.get('global').channelBadges.get(badge) && CHAT_EMOTES.emotes.get('global').channelBadges.get(badge).getVersion(version)) {
            const b = CHAT_EMOTES.emotes.get('global').channelBadges.get(badge).getVersion(version);
            return <img src={b.getImageUrl(1)} key={key}/>
        }
        return "";
    },
    getEmote: (channel: string, text: string, key: string) => {
        if (CHAT_EMOTES.emotes.get(channel) && CHAT_EMOTES.emotes.get(channel).sevenTVEmotes.get(text)) {
            const data = CHAT_EMOTES.emotes.get(channel).sevenTVEmotes.get(text).data;      
            return <img key={key} src={data.host.url + "/" + data.host.files[1].name}/>
        }
        return text;
    },
    getCheerEmotes: (channel: string) => {
        if(CHAT_EMOTES.emotes.get(channel) && CHAT_EMOTES.emotes.get(channel).cheerEmotes) {
            return CHAT_EMOTES.emotes.get(channel).cheerEmotes;
        }
        return [];
    },
    getLogo: (channel: string) => {
        if (CHAT_EMOTES.emotes.get(channel) && CHAT_EMOTES.emotes.get(channel).user) {
            return <img src={CHAT_EMOTES.emotes.get(channel).user.profilePictureUrl}/>
        }
        return null;
    },
    getChannelId: (channel: string) => {
        if (CHAT_EMOTES.emotes.get(channel) && CHAT_EMOTES.emotes.get(channel).user) {
            return CHAT_EMOTES.emotes.get(channel).user.id;
        }
        return '';
    }
}

export const ChatEmotes = createContext<ChatEmotes>(CHAT_EMOTES);

export type ChatConfigKey = 'channels' | 'chatChannel' | 'ignoredUsers' | 'showTimestamp' | 'showProfilePicture' | 'showImportantBadges' | 'showSubBadges' | 'showPredictions' | 'showOtherBadges';

export interface ChatConfig {
    channels: string[];
    chatChannel?: string;
    ignoredUsers: string[];
    maxMessages: number;
    showTimestamp: boolean;
    showProfilePicture: boolean;
    showImportantBadges: boolean;
    showSubBadges: boolean;
    showPredictions: boolean;
    showOtherBadges: boolean;
    setChannels: (channels: string[]) => void;
    setIgnoredUsers: (users: string[]) => void;
    setShowTimestamp: (value: boolean) => void;
    setShowProfilePicture: (value: boolean) => void;
    setShowImportantBadges: (value: boolean) => void;
    setShowSubBadges: (value: boolean) => void;
    setShowPredictions: (value: boolean) => void;
    setShowOtherBadges: (value: boolean) => void;
    getChatChannel: () => string | undefined;
    setChatChannel: (channel: string) => void;
    onMessage: (handler: MessageHandler) => MessageHandler;
    off: (handler: MessageHandler) => void;
    fireMessage: (channel: string, text: string) => void;
}
type MessageHandler = {id?: number, handle: (channel: string, text: string) => void};
const onMessageHandlers: MessageHandler[] = [];
var onMessageHandlerIndex = 0;
export const DEFAULT_CHAT_CONFIG: ChatConfig = {
    channels: [],
    chatChannel: undefined,
    ignoredUsers: [],
    maxMessages: 500,
    showTimestamp: true,
    showProfilePicture: true,
    showImportantBadges: true,
    showSubBadges: true,
    showPredictions: true,
    showOtherBadges: false,
    setChannels: () => {},
    setIgnoredUsers: () => {},
    setShowTimestamp: (value: boolean) => {},
    setShowProfilePicture: (value: boolean) => {},
    setShowImportantBadges: (value: boolean) => {},
    setShowSubBadges: (value: boolean) => {},
    setShowPredictions: (value: boolean) => {},
    setShowOtherBadges: (value: boolean) => {},
    getChatChannel: () => { return undefined; },
    setChatChannel: (channel: string) => {},
    onMessage: (handler: MessageHandler) => {
        onMessageHandlers.push(handler);
        handler.id = ++onMessageHandlerIndex;
        return handler;
    },
    off: (handler: MessageHandler) => {
        const index = onMessageHandlers.findIndex((h) => h.id === handler.id)
        if (index > -1) {
            onMessageHandlers.splice(index, 1);
        }
    },
    fireMessage: (channel: string, text: string) => {
        onMessageHandlers.forEach(handler => {
            handler.handle(channel, text);
        });
    }
};

export function store(chatConfig: ChatConfig) {
    localStorage.setItem('chatConfig', JSON.stringify(chatConfig));
}

export function load(): ChatConfig {
    return JSON.parse(localStorage.getItem('chatConfig') || JSON.stringify(DEFAULT_CHAT_CONFIG)) as ChatConfig;
}

export const ChatConfigContext = createContext(DEFAULT_CHAT_CONFIG);
export const LoginContext = createContext(DEFAULT_LOGIN_CONTEXT);