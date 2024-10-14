import { LoginContext, getUserdata } from '@/commons/login';
import { toMap } from '@/commons/helper';
import { EmoteComponent } from '@/components/emote/emote';
import PubSub from 'pubsub-js';
import { SystemMessage } from './message';

interface sevenTVEmote {
    name: string;
    data: {
        id: string;
        animated: boolean;
        host: {
            files: {
                name: string;
                static_name: string;
                format: string;
                width: number;
                height: number;
            }[];
            url: string;
        }
    };
}

interface sevenTVEmoteSet {
    emotes: sevenTVEmote[];
    id: string;
}

interface sevenTVUser {
    displayname: string;
    id: string;
    emote_set: sevenTVEmoteSet;
}

const emoteSetUserNameMap: Record<string, string> = {};

export async function get7TVEmotes(userId: string, username: string) {
    const user: sevenTVUser = await fetch('https://7tv.io/v3/users/twitch/' + userId)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
        }).catch(err => ({
            emote_set: {
                emotes: []
            }
        }));

    emoteSetUserNameMap[user.emote_set.id] = username;
    PubSub.publish("WSSEND", { type: "sevenTVSubscribe", objectId: user.emote_set.id, userId: user.id });
    const emotes = toMap(user.emote_set.emotes, e => e.name);
    return emotes;
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

export async function getProfilesByNames(context: LoginContext, usernames: string[]) {
    const api = context.getApiClient();

    const users = await api.users.getUsersByNames(usernames);

    return toMap(users, user => user.name);
}

export async function getBadgesAndEmotesByNames(context: LoginContext, usernames: string[]) {
    const api = context.getApiClient();

    const users = await api.users.getUsersByNames(usernames);

    const data = await Promise.all(users.map(async (user) => {
        const { channelBadges, channelEmotes } = await getBadgesAndEmotes(context, user.id);
        const sevenTVEmotes = await get7TVEmotes(user.id, user.name);
        const cheerEmotes = await api.bits.getCheermotes(user.id);
        return {
            user,
            channelBadges: toMap(channelBadges, ba => ba.id),
            channelEmotes: toMap(channelEmotes, em => em.name),
            cheerEmotes: cheerEmotes,
            sevenTVEmotes
        }
    }));

    return toMap(data, d => d.user.name);
}

export async function getGlobalBadgesAndEmotesByNames(context: LoginContext) {
    const api = context.getApiClient();

    const { channelBadges, channelEmotes } = await getGlobalBadgesAndEmotes(context);

    return {
        //@ts-ignore
        user: {
            name: "global",
        },
        //@ts-ignore
        channelBadges: toMap(channelBadges, ba => ba.id),
        //@ts-ignore
        channelEmotes: toMap(channelEmotes, em => em.name)
    };
}

export interface ChatEmotes {
    emotes: Map<string, any>,
    update: (context: LoginContext, channels: string[]) => Promise<void>;
    updateChannel: (context: LoginContext, channel: string) => Promise<void>;
    updateUserInfo: (context: LoginContext, channel: string) => Promise<void>;
    getBadge: (channel: string, badge: string, key: string) => any;
    getEmote: (channel: string, word: string, key: string) => any;
    getCheerEmotes: (channel: string) => string[];
    getCheerEmote: (channel: string, name: string, bits: number) => any;
    getLogo: (channel: string) => any;
    getChannelId: (channel: string) => string;
}
const LOADING_CHAT_EMOTES: {[key: string]: boolean} = {};
const LOADING_PROFILES: {[key: string]: boolean} = {};

export const DEFAULT_CHAT_EMOTES: ChatEmotes = {
    emotes: new Map(),
    update: async (context, channels) => {
        DEFAULT_CHAT_EMOTES.emotes = await getBadgesAndEmotesByNames(context, channels);
    },
    updateChannel: async (context, channel) => {
        if ((DEFAULT_CHAT_EMOTES.emotes.has(channel) && DEFAULT_CHAT_EMOTES.emotes.get(channel).emotes) || LOADING_CHAT_EMOTES[channel]) {
            return;
        }
        LOADING_CHAT_EMOTES[channel] = true;
        if (Object.keys(LOADING_CHAT_EMOTES).length === 1) {
            const globalEmoteData = await getGlobalBadgesAndEmotesByNames(context);
            DEFAULT_CHAT_EMOTES.emotes.set('global', globalEmoteData);
        }
        const emoteData = await getBadgesAndEmotesByNames(context, [channel]);
        DEFAULT_CHAT_EMOTES.emotes.set(channel, emoteData.get(channel));
    },
    updateUserInfo: async (context, channel) => {
        if ((DEFAULT_CHAT_EMOTES.emotes.has(channel) && DEFAULT_CHAT_EMOTES.emotes.get(channel).user) || LOADING_PROFILES[channel]) {
            return;
        }
        LOADING_PROFILES[channel] = true;
        const userData = await getUserdata(context, [channel]);
        if (DEFAULT_CHAT_EMOTES.emotes.has(channel) && userData.get(channel) && userData.get(channel).user) {
            DEFAULT_CHAT_EMOTES.emotes.get(channel).user = userData.get(channel).user;
        } else {
            DEFAULT_CHAT_EMOTES.emotes.set(channel, {user: userData.get(channel) ? userData.get(channel).user : undefined});
        }
    },
    getBadge: (channel: string, badgeData: string, key: string) => {
        const [badge, version] = badgeData.split(',');

        const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);
        const globalEmotes = DEFAULT_CHAT_EMOTES.emotes.get('global');

        const badgeInfo = channelEmotes?.channelBadges?.get(badge)?.getVersion(version) 
                        || globalEmotes?.channelBadges?.get(badge)?.getVersion(version);

        if (badgeInfo) {
            return <img alt={badge} src={badgeInfo.getImageUrl(2)} key={key} />;
        }
        return "";
    },

    getEmote: (channel: string, text: string, key: string) => {
        const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);
        const emoteData = channelEmotes?.sevenTVEmotes?.get(text)?.data;
        
        if (emoteData) {
            return <EmoteComponent key={key} imageUrl={`${emoteData.host.url}/${emoteData.host.files[1].name}`} largeImageUrl={`${emoteData.host.url}/${emoteData.host.files[3].name}`} name={text} type='7 TV'/>;
        }
        return text;
    },

    getCheerEmotes: (channel: string) => {
        const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);
        return channelEmotes?.cheerEmotes?.getPossibleNames() || [];
    },

    getCheerEmote: (channel: string, name: string, bits: number) => {
        const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);
        if (channelEmotes?.cheerEmotes) {
            return channelEmotes.cheerEmotes.getCheermoteDisplayInfo(name, bits, { background: 'dark', scale: 1, state: 'animated' });
        }
        return `${name}${bits}`;
    },

    getLogo: (channel: string) => {
        const channelUser = DEFAULT_CHAT_EMOTES.emotes.get(channel)?.user;
        if (channelUser) {
            return <img src={channelUser.profilePictureUrl} />;
        }
        return null;
    },

    getChannelId: (channel: string) => {
        return DEFAULT_CHAT_EMOTES.emotes.get(channel)?.user?.id || '';
    }
}

PubSub.subscribe('WS-seventTV', (m, data) => {
    if (data.type === 'add') {
        const username = data.user;
        const channel = emoteSetUserNameMap[data.emoteSetId];
        DEFAULT_CHAT_EMOTES.emotes.get(channel).sevenTVEmotes.set(data.emote.name, data.emote);
        const text = ['sevenTVAdded', channel, username, data.emote.name].join('***');
        const message = new SystemMessage(channel, text, new Date(), "sevenTVAdded", "", "").rawLine;
        PubSub.publish("WS-msg", {message, username});
    }
    if (data.type === 'remove') {
        const username = data.user;
        const channel = emoteSetUserNameMap[data.emoteSetId];
        DEFAULT_CHAT_EMOTES.emotes.get(channel).sevenTVEmotes.delete(data.emote.name);
        const text = ['sevenTVRemoved', channel, username, data.emote.name].join('***');
        const message = new SystemMessage(channel, text, new Date(), "sevenTVRemoved", "", "").rawLine;
        PubSub.publish("WS-msg", {message, username});
    }
})
