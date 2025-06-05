import { LoginContext, getUserdata } from '@/commons/login';
import { HelixCheermoteList } from '@twurple/api';
import { toMap } from '@/commons/helper';
import { EmoteComponent } from '@/components/emote/emote';
import PubSub from 'pubsub-js';
import { EmoteStore, EmotePrefix } from '@/components/chat/emotestorage';
import { EmoteApiClient } from '@/api/emotes';

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
    // Try to get from EmoteStore first
    const cachedEmotes = await EmoteStore.getEmotes(EmotePrefix.SEVENTV, userId);
    if (cachedEmotes) {
        // Convert array back to Map
        const emoteMap = new Map();
        cachedEmotes.emotes.forEach(emote => {
            emoteMap.set(emote.name, emote);
        });
        return emoteMap;
    }

    // If not in store, fetch from backend API
    try {
        const data = await EmoteApiClient.get7TVEmotes(userId, username);
        
        if (data.emoteSetId) {
            emoteSetUserNameMap[data.emoteSetId] = username;
        }
        
        const emotes = toMap(data.emotes, (e: any) => e.name);
        
        // Store in EmoteStore for future use
        await EmoteStore.storeEmotes(EmotePrefix.SEVENTV, userId, Array.from(emotes.values()));
        
        return emotes;
    } catch (error) {
        console.error('Error fetching 7TV emotes:', error);
        return new Map();
    }
}

export async function getBadgesAndEmotes(context: LoginContext, userId: string) {
    // Try to get from EmoteStore first
    const cachedEmotes = await EmoteStore.getEmotes(EmotePrefix.CHANNEL, userId);
    if (cachedEmotes && cachedEmotes.emotes.length > 0) {
        return {
            channelBadges: cachedEmotes.emotes[0],
            channelEmotes: cachedEmotes.emotes[1]
        };
    }

    // If not in store, fetch from backend API
    try {
        const data = await EmoteApiClient.getChannelBadgesAndEmotes(userId);
        const { channelBadges, channelEmotes } = data;

        // Store in EmoteStore for future use
        await EmoteStore.storeEmotes(EmotePrefix.CHANNEL, userId, [channelBadges, channelEmotes]);

        return {
            channelBadges,
            channelEmotes
        };
    } catch (error) {
        console.error('Error fetching channel badges and emotes:', error);
        return {
            channelBadges: [],
            channelEmotes: []
        };
    }
}

export async function getGlobalBadgesAndEmotes(context: LoginContext) {
    // Try to get from EmoteStore first
    const cachedEmotes = await EmoteStore.getEmotes(EmotePrefix.GLOBAL, 'global');
    if (cachedEmotes && cachedEmotes.emotes.length > 0) {
        return {
            channelBadges: cachedEmotes.emotes[0],
            channelEmotes: cachedEmotes.emotes[1]
        };
    }

    // If not in store, fetch from backend API
    try {
        const data = await EmoteApiClient.getGlobalBadgesAndEmotes();
        const { channelBadges, channelEmotes } = data;

        // Store in EmoteStore for future use
        await EmoteStore.storeEmotes(EmotePrefix.GLOBAL, 'global', [channelBadges, channelEmotes]);

        return {
            channelBadges,
            channelEmotes
        };
    } catch (error) {
        console.error('Error fetching global badges and emotes:', error);
        return {
            channelBadges: [],
            channelEmotes: []
        };
    }
}

// Interface for CheermoteDisplayInfo returned by getCheermoteDisplayInfo
interface CheermoteDisplayInfo {
    url: string;
    color: string;
    backgroundColor?: string;
    isAnimated: boolean;
}

// Interface for CheerEmoteTier
interface CheerEmoteTier {
    id: string;
    minBits: number;
    color: string;
    images: {
        dark: {
            animated: string;
            static: string;
        };
        light: {
            animated: string;
            static: string;
        };
    };
}

export async function getBadgesAndEmotesByNames(context: LoginContext, usernames: string[]) {
    try {
        const users = await EmoteApiClient.getUsersByNames(usernames);
        
        // Ensure users is an array
        if (!Array.isArray(users)) {
            console.error('Expected users to be an array but got:', typeof users);
            return new Map();
        }

        const data = await Promise.all(users.map(async (user: any) => {
            const { channelBadges, channelEmotes } = await getBadgesAndEmotes(context, user.id);
            const sevenTVEmotes = await get7TVEmotes(user.id, user.name);
            
            // Safely handle cheerEmotes
            let cheerEmotes;
            try {
                const cheerEmotesData = await EmoteApiClient.getCheerEmotes(user.id);
                // Ensure cheerEmotesData is valid before creating HelixCheermoteList
                cheerEmotes = cheerEmotesData ? new HelixCheermoteList(cheerEmotesData) : new HelixCheermoteList({});
            } catch (error) {
                console.error(`Error fetching cheer emotes for ${user.name}:`, error);
                cheerEmotes = new HelixCheermoteList({});
            }
            
            return {
                user,
                channelBadges: Array.isArray(channelBadges) ? toMap(channelBadges as any[], (ba: any) => ba.id) : new Map(),
                channelEmotes: Array.isArray(channelEmotes) ? toMap(channelEmotes as any[], (em: any) => em.name) : new Map(),
                cheerEmotes,
                sevenTVEmotes
            }
        }));

        return Array.isArray(data) ? toMap(data, d => d.user.name) : new Map();
    } catch (error) {
        console.error('Error fetching badges and emotes by names:', error);
        return new Map();
    }
}

export async function getGlobalBadgesAndEmotesByNames(context: LoginContext) {
    const { channelBadges, channelEmotes } = await getGlobalBadgesAndEmotes(context);

    return {
        //@ts-ignore
        user: {
            name: "global",
        },
        //@ts-ignore
        channelBadges: toMap(channelBadges as any[], (ba: any) => ba.id),
        //@ts-ignore
        channelEmotes: toMap(channelEmotes as any[], (em: any) => em.name)
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
    getEmoteList: (channel: string, filter: string) => Map<string, any[]>;
    updateUserEmote: (userid: string) => Promise<void>;
}
const LOADING_CHAT_EMOTES: {[key: string]: boolean} = {};
const LOADING_PROFILES: {[key: string]: boolean} = {};

export const DEFAULT_CHAT_EMOTES: ChatEmotes = {
    emotes: new Map(),
    update: async (context, channels) => {
        DEFAULT_CHAT_EMOTES.emotes = await getBadgesAndEmotesByNames(context, channels);
    },
    updateUserEmote: async (userid: string) => {
        // Use the new EmotePrefix.USER prefix
        const userEmotesData = await EmoteStore.getEmotes(EmotePrefix.USER, userid);
        if (userEmotesData) {
            const userEmotesMap = new Map(userEmotesData.emotes.map(emote => [emote.name, emote]));
            DEFAULT_CHAT_EMOTES.emotes.set("user", userEmotesMap);
        }
    },
    updateChannel: async (context, channel) => {
        if ((DEFAULT_CHAT_EMOTES.emotes.has(channel) && DEFAULT_CHAT_EMOTES.emotes.get(channel)?.emotes) || LOADING_CHAT_EMOTES[channel]) {
            return;
        }
        LOADING_CHAT_EMOTES[channel] = true;
        try {
            if (Object.keys(LOADING_CHAT_EMOTES).length === 1) {
                const globalEmoteData = await getGlobalBadgesAndEmotesByNames(context);
                if (globalEmoteData) {
                    DEFAULT_CHAT_EMOTES.emotes.set('global', globalEmoteData);
                }
            }
            
            // Safely handle emote data
            try {
                const emoteData = await getBadgesAndEmotesByNames(context, [channel]);
                if (emoteData && emoteData instanceof Map && emoteData.has(channel)) {
                    DEFAULT_CHAT_EMOTES.emotes.set(channel, emoteData.get(channel));
                } else {
                    // Set a default empty object if no data is available
                    DEFAULT_CHAT_EMOTES.emotes.set(channel, {
                        user: { name: channel },
                        channelBadges: new Map(),
                        channelEmotes: new Map(),
                        cheerEmotes: new HelixCheermoteList({}),
                        sevenTVEmotes: new Map()
                    });
                }
            } catch (error) {
                console.error(`Error getting badges and emotes for ${channel}:`, error);
                // Set a default empty object if an error occurs
                DEFAULT_CHAT_EMOTES.emotes.set(channel, {
                    user: { name: channel },
                    channelBadges: new Map(),
                    channelEmotes: new Map(),
                    cheerEmotes: new HelixCheermoteList({}),
                    sevenTVEmotes: new Map()
                });
            }
        } catch (error) {
            console.error(`Error updating channel ${channel}:`, error);
            // Set a default empty object if an error occurs
            DEFAULT_CHAT_EMOTES.emotes.set(channel, {
                user: { name: channel },
                channelBadges: new Map(),
                channelEmotes: new Map(),
                cheerEmotes: new HelixCheermoteList({}),
                sevenTVEmotes: new Map()
            });
        } finally {
            LOADING_CHAT_EMOTES[channel] = false;
        }
    },
    updateUserInfo: async (context, channel) => {
        if ((DEFAULT_CHAT_EMOTES.emotes.has(channel) && DEFAULT_CHAT_EMOTES.emotes.get(channel)?.user) || LOADING_PROFILES[channel]) {
            return;
        }
        LOADING_PROFILES[channel] = true;
        try {
            const userData = await getUserdata(context, [channel]);
            
            // Initialize the channel entry if it doesn't exist
            if (!DEFAULT_CHAT_EMOTES.emotes.has(channel)) {
                DEFAULT_CHAT_EMOTES.emotes.set(channel, {
                    channelBadges: new Map(),
                    channelEmotes: new Map(),
                    cheerEmotes: new HelixCheermoteList({}),
                    sevenTVEmotes: new Map()
                });
            }
            
            // Get the current channel data
            const channelData = DEFAULT_CHAT_EMOTES.emotes.get(channel);
            
            // Update the user data if available
            if (userData && userData.has(channel) && userData.get(channel)?.user) {
                channelData.user = userData.get(channel).user;
            } else {
                // Set a default user object if no data is available
                channelData.user = { name: channel };
            }
            
            // Update the channel data
            DEFAULT_CHAT_EMOTES.emotes.set(channel, channelData);
        } catch (error) {
            console.error(`Error updating user info for ${channel}:`, error);
            // Ensure the channel has at least a basic user object
            if (DEFAULT_CHAT_EMOTES.emotes.has(channel)) {
                const channelData = DEFAULT_CHAT_EMOTES.emotes.get(channel);
                channelData.user = { name: channel };
                DEFAULT_CHAT_EMOTES.emotes.set(channel, channelData);
            } else {
                DEFAULT_CHAT_EMOTES.emotes.set(channel, {
                    user: { name: channel },
                    channelBadges: new Map(),
                    channelEmotes: new Map(),
                    cheerEmotes: new HelixCheermoteList({}),
                    sevenTVEmotes: new Map()
                });
            }
        } finally {
            LOADING_PROFILES[channel] = false;
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
            return <EmoteComponent key={key} imageUrl={`${emoteData.host.url}/${emoteData.host.files[1].name}`} largeImageUrl={`${emoteData.host.url}/${emoteData.host.files[3].name}`} name={text} marginL={emoteData.flags ? '-1.5em' : undefined} type='7 TV'/>;
        }
        return text;
    },

    getCheerEmotes: (channel: string) => {
        const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);
        try {
            return channelEmotes?.cheerEmotes?.getPossibleNames() || [];
        } catch (error) {
            console.error(`Error getting cheer emote names for ${channel}:`, error);
            return [];
        }
    },

    getCheerEmote: (channel: string, name: string, bits: number) => {
        const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);
        try {
            if (channelEmotes?.cheerEmotes) {
                return channelEmotes.cheerEmotes.getCheermoteDisplayInfo(name, bits, { background: 'dark', scale: 2, state: 'animated' });
            }
        } catch (error) {
            console.error(`Error getting cheer emote for ${channel}, ${name}, ${bits}:`, error);
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
    },

    getEmoteList: (channel: string, filter: string) => {
        const emoteList = new Map<string, any[]>();
        const lowerFilter = filter.toLowerCase();

        // Get channel emotes
        const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);
        const globalEmotes = DEFAULT_CHAT_EMOTES.emotes.get('global');
        const userEmotes = DEFAULT_CHAT_EMOTES.emotes.get('user');
        // Add user-specific Twitch emotes first
        if (userEmotes && userEmotes.size > 0) {
            
            const entries = Array.from(userEmotes.entries()) as [string, any][];
            const userEmotesData = entries
                .filter(entry => entry[0].toLowerCase().includes(lowerFilter))
                .map(entry => ({
                    name: entry[0],
                    data: {
                        ...entry[1],
                        getImageUrl(scale: number) {
                            return `https://static-cdn.jtvnw.net/emoticons/v2/${entry[1].id}/default/dark/2.0`;
                        }
                    },
                    type: 'Twitch'
                }));
            if (userEmotesData.length > 0) {
                emoteList.set("User Emotes", userEmotesData);
            }
        }

        // Add sevenTV emotes
        if (channelEmotes?.sevenTVEmotes) {
            const entries = Array.from(channelEmotes.sevenTVEmotes.entries()) as [string, sevenTVEmote][];
            const sevenTVEmotes = entries
                .filter(entry => entry[0].toLowerCase().includes(lowerFilter))
                .map(entry => ({
                    name: entry[0],
                    data: entry[1].data,
                    type: '7TV'
                }));
            if (sevenTVEmotes.length > 0) {
                emoteList.set('sevenTV', sevenTVEmotes);
            }
        }

        // Add global emotes
        if (globalEmotes?.channelEmotes) {
            const entries = Array.from(globalEmotes.channelEmotes.entries()) as [string, any][];
            const globals = entries
                .filter(entry => entry[0].toLowerCase().includes(lowerFilter))
                .map(entry => ({
                    name: entry[0],
                    data: entry[1],
                    type: 'Global'
                }));
            if (globals.length > 0) {
                emoteList.set('Global', globals);
            }
        }

        return emoteList;
    }
}

PubSub.subscribe('Update-seventTV', (m, data) => {
    try {
        if (data.type === 'add') {
            const channel = emoteSetUserNameMap[data.data.emoteSetId];
            if (channel && DEFAULT_CHAT_EMOTES.emotes.has(channel)) {
                const channelData = DEFAULT_CHAT_EMOTES.emotes.get(channel);
                // Initialize sevenTVEmotes if it doesn't exist
                if (!channelData.sevenTVEmotes) {
                    channelData.sevenTVEmotes = new Map();
                }
                channelData.sevenTVEmotes.set(data.data.emote, data.data.emoteData);
                DEFAULT_CHAT_EMOTES.emotes.set(channel, channelData);
            }
        }
        if (data.type === 'remove') {
            const channel = emoteSetUserNameMap[data.data.emoteSetId];
            if (channel && DEFAULT_CHAT_EMOTES.emotes.has(channel) && DEFAULT_CHAT_EMOTES.emotes.get(channel)?.sevenTVEmotes) {
                DEFAULT_CHAT_EMOTES.emotes.get(channel).sevenTVEmotes.delete(data.data.emote);
            }
        }
    } catch (error) {
        console.error('Error handling 7TV update:', error);
    }
})
