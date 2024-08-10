import { LoginContext, getUserdata } from '@/commons/login';
import { toMap } from '@/commons/helper';

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

export async function get7TVEmotes(userId: string) {
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

export async function getBadgesAndEmotesByNames(context: LoginContext, usernames: string[]) {
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
            cheerEmotes: cheerEmotes,
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

    return toMap(data, d => d.user.name);
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

export const DEFAULT_CHAT_EMOTES: ChatEmotes = {
    emotes: new Map(),
    update: async (context, channels) => {
        DEFAULT_CHAT_EMOTES.emotes = await getBadgesAndEmotesByNames(context, channels);
    },
    updateChannel: async (context, channel) => {
        const emoteData = await getBadgesAndEmotesByNames(context, [channel]);
        DEFAULT_CHAT_EMOTES.emotes.set(channel, emoteData.get(channel));
        DEFAULT_CHAT_EMOTES.emotes.set('global', emoteData.get('global'));
    },
    updateUserInfo: async (context, channel) => {
        if (!channel) {
            return;
        }
        const userData = await getUserdata(context, [channel]);
        if (DEFAULT_CHAT_EMOTES.emotes.has(channel)) {
            DEFAULT_CHAT_EMOTES.emotes.get(channel).user = userData.get(channel).user;
        } else {
            DEFAULT_CHAT_EMOTES.emotes.set(channel, userData.get(channel));
        }
    },
    getBadge: (channel: string, badgeData: string, key: string) => {
        const [badge, version] = badgeData.split(',');

        const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);
        const globalEmotes = DEFAULT_CHAT_EMOTES.emotes.get('global');

        const badgeInfo = channelEmotes?.channelBadges?.get(badge)?.getVersion(version) 
                        || globalEmotes?.channelBadges?.get(badge)?.getVersion(version);

        if (badgeInfo) {
            return <img alt={badge} src={badgeInfo.getImageUrl(1)} key={key} />;
        }
        return "";
    },

    getEmote: (channel: string, text: string, key: string) => {
        const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);
        const emoteData = channelEmotes?.sevenTVEmotes?.get(text)?.data;

        if (emoteData) {
            return <img alt={text} key={key} src={`${emoteData.host.url}/${emoteData.host.files[1].name}`} />;
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