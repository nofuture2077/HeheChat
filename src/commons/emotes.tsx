import { getUserdata, LoginContext } from '@/commons/login';
import { toMap } from '@/commons/helper';
import { EmoteComponentSimple, EmoteComponent } from '@/components/emote/emote';
import PubSub from 'pubsub-js';
import { EmoteStore, EmotePrefix } from '@/components/chat/emotestorage';
import { EmoteApiClient } from '@/api/emotes';
import { buildEmoteImageUrl } from '../commons/twitch';

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

type CheermoteImageSet = {
    [scale: string]: string;
};

type CheermoteImages = {
    dark: {
        animated: CheermoteImageSet;
        static: CheermoteImageSet;
    };
    light: {
        animated: CheermoteImageSet;
        static: CheermoteImageSet;
    };
};

interface CheermoteTier {
    min_bits: number;
    id: string;
    color: string;
    images: CheermoteImages;
}

interface Cheermote {
    prefix: string;
    tiers: CheermoteTier[];
    can_cheer: boolean;
    show_in_bits_card: boolean;
}

interface CheermoteData {
    [prefix: string]: Cheermote;
}

type DisplayOptions = {
    background: 'dark' | 'light';
    scale: 1 | 1.5 | 2 | 3 | 4;
    state: 'animated' | 'static';
};

type CheermoteDisplayInfo = {
    url?: string;
    color?: string;
} | null;

function getCheermoteDisplayInfo(
    name: string,
    bits: number,
    options: DisplayOptions,
    data: CheermoteData
): CheermoteDisplayInfo {
    const cheer = data[name];
    if (!cheer) return {};

    const { background, scale, state } = options;

    // Find the correct tier
    const tier = [...cheer.tiers].reverse().find(t => bits >= t.min_bits);
    if (!tier) return {};

    const imageSet = tier.images?.[background]?.[state];
    const url = imageSet?.[scale.toString()];
    if (!url) return {};

    return {
        url,
        color: tier.color,
    };
}

type BadgeVersion = {
  id: string;
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
  title: string;
  description: string;
  click_action: string;
  click_url: string;
};

type BadgeSet = {
  set_id: string;
  versions: BadgeVersion[];
};

function getBadgeImageHtml(badges: Map<string, BadgeSet>, setId: string, versionId: string) {
  const badgeSet = badges.values().find(b => b.set_id === setId);
  if (!badgeSet) return null;

  const version = badgeSet.versions.find(v => v.id === versionId);
  if (!version) return null;

  return <img alt={version.title} src={version.image_url_2x}/>;
}

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

/**
 * Get channel badges for a user
 * @param userId The Twitch user ID
 * @returns The channel badges
 */
export async function getChannelBadges(userId: string) {
    // Try to get from EmoteStore first
    const cachedBadges = await EmoteStore.getChannelBadges(userId);
    if (cachedBadges?.emotes) {
        return cachedBadges.emotes;
    }
    
    // If not in store, fetch from backend API
    try {
        const badgesData = await EmoteApiClient.getChannelBadges(userId);
        
        // Store in EmoteStore
        await EmoteStore.storeChannelBadges(userId, badgesData);
        
        return badgesData;
    } catch (error) {
        console.error('Error fetching channel badges:', error);
        return [];
    }
}

/**
 * Get channel emotes for a user
 * @param userId The Twitch user ID
 * @returns The channel emotes
 */
export async function getChannelEmotes(userId: string) {
    // Try to get from EmoteStore first
    const cachedEmotes = await EmoteStore.getChannelEmotes(userId);
    if (cachedEmotes?.emotes) {
        return cachedEmotes.emotes;
    }

    // If not in store, fetch from backend API
    try {
        const emotesData = await EmoteApiClient.getChannelEmotes(userId);
        
        // Store in EmoteStore
        await EmoteStore.storeChannelEmotes(userId, emotesData);
        
        return emotesData;
    } catch (error) {
        console.error('Error fetching channel emotes:', error);
        return [];
    }
}

/**
 * Get global badges
 * @returns The global badges
 */
export async function getGlobalBadges() {
    // Try to get from EmoteStore first
    const cachedBadges = await EmoteStore.getGlobalBadges();
    if (cachedBadges?.emotes) {
        return cachedBadges.emotes;
    }

    // If not in store, fetch from backend API
    try {
        const badgesData = await EmoteApiClient.getGlobalBadges();
        
        // Store in EmoteStore
        await EmoteStore.storeGlobalBadges(badgesData);
        
        return badgesData;
    } catch (error) {
        console.error('Error fetching global badges:', error);
        return [];
    }
}

/**
 * Get global emotes
 * @returns The global emotes
 */
export async function getGlobalEmotes() {
    // Try to get from EmoteStore first
    const cachedEmotes = await EmoteStore.getGlobalEmotes();
    if (cachedEmotes?.emotes) {
        return cachedEmotes.emotes;
    }

    // If not in store, fetch from backend API
    try {
        const emotesData = await EmoteApiClient.getGlobalEmotes();
        
        // Store in EmoteStore
        await EmoteStore.storeGlobalEmotes(emotesData);
        
        return emotesData;
    } catch (error) {
        console.error('Error fetching global emotes:', error);
        return [];
    }
}

export interface ChatEmotes {
    emotes: Map<string, any>,
    updateChannel: (channel: string) => Promise<void>;
    updateUserInfo: (context: LoginContext, channel: string) => Promise<void>;
    getBadge: (channel: string, badge: string, key: string) => any;
    getEmote: (channel: string, word: string, key: string) => any;
    checkEmote: (channel: string, word: string, key: string, large: boolean) => any;
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
    updateUserEmote: async (userid: string) => {
        try {
            // Validate input
            if (!userid || typeof userid !== 'string') {
                console.warn(`Invalid user ID: ${userid}`);
                return;
            }
            
            // Try to get user emotes from EmoteStore
            try {
                const userEmotesData = await EmoteStore.getEmotes(EmotePrefix.USER, userid);
                
                // Validate user emotes data
                if (!userEmotesData || !Array.isArray(userEmotesData.emotes)) {
                    console.warn(`No user emotes found for user ID: ${userid}`);
                    return;
                }
                
                // Create a map of user emotes
                try {
                    const userEmotesMap = new Map(userEmotesData.emotes.map(emote => {
                        // Validate emote structure
                        if (!emote || !emote.name) {
                            console.warn(`Invalid emote structure:`, emote);
                            return null;
                        }
                        return [emote.name, emote];
                    }).filter(Boolean) as [string, any][]);
                    
                    // Update the emotes map
                    if (userEmotesMap.size > 0) {
                        DEFAULT_CHAT_EMOTES.emotes.set("user", userEmotesMap);
                    } else {
                        console.warn(`No valid user emotes found for user ID: ${userid}`);
                    }
                } catch (mapError) {
                    console.error(`Error creating user emotes map for user ID ${userid}:`, mapError);
                }
            } catch (storeError) {
                console.error(`Error getting user emotes from store for user ID ${userid}:`, storeError);
            }
        } catch (error) {
            console.error(`Error updating user emotes for user ID ${userid}:`, error);
        }
    },
    updateChannel: async (channel) => {
        if ((DEFAULT_CHAT_EMOTES.emotes.has(channel) && DEFAULT_CHAT_EMOTES.emotes.get(channel)?.emotes) || LOADING_CHAT_EMOTES[channel]) {
            return;
        }
        LOADING_CHAT_EMOTES[channel] = true;
        
        // Initialize channel with default empty structures
        if (!DEFAULT_CHAT_EMOTES.emotes.has(channel)) {
            DEFAULT_CHAT_EMOTES.emotes.set(channel, {
                user: { name: channel },
                channelBadges: new Map(),
                channelEmotes: new Map(),
                cheerEmotes: new Map(),
                sevenTVEmotes: new Map()
            });
        }
        
        try {
            // Try to load global emotes if this is the first channel being loaded
            if (Object.keys(LOADING_CHAT_EMOTES).length === 1) {
                try {
                    const globalBadgesData = await getGlobalBadges();
                    const globalEmoteData = await getGlobalEmotes();
                    if (globalEmoteData) {
                        DEFAULT_CHAT_EMOTES.emotes.set('global', {
                            user: { name: 'global' },
                            channelEmotes: toMap(globalEmoteData, (ba: any) => ba.name),
                            channelBadges: toMap(globalBadgesData, (ba: any) => ba.set_id),
                        });
                    }
                } catch (error) {
                    console.error('Error loading global emotes:', error);
                    // Continue with empty global emotes
                    if (!DEFAULT_CHAT_EMOTES.emotes.has('global')) {
                        DEFAULT_CHAT_EMOTES.emotes.set('global', {
                            channelBadges: new Map(),
                            channelEmotes: new Map()
                        });
                    }
                }
            }
            
            // Get users by names - this is required for the rest of the emote loading
            let users;
            try {
                users = await EmoteApiClient.getUsersByNames([channel]);
                if (!Array.isArray(users) || users.length === 0) {
                    throw new Error(`No user data found for ${channel}`);
                }
            } catch (error) {
                console.error(`Error getting user data for ${channel}:`, error);
                // Create a minimal user object to continue
                users = [{ id: channel, name: channel }];
            }
            
            const user = users[0];
            const channelData = DEFAULT_CHAT_EMOTES.emotes.get(channel);
            
            // Update user info
            channelData.user = user;
            
            // Load each type of emote independently
            
            // 1. Channel badges and emotes
            try {
                const channelBadges = await getChannelBadges(user.id);
                const channelEmotes = await getChannelEmotes(user.id);
                
                channelData.channelBadges = Array.isArray(channelBadges) 
                    ? toMap(channelBadges as any[], (ba: any) => ba.set_id) 
                    : new Map();
                channelData.channelEmotes = Array.isArray(channelEmotes) 
                    ? toMap(channelEmotes as any[], (em: any) => em.name) 
                    : new Map();
            } catch (error) {
                console.error(`Error loading channel badges and emotes for ${channel}:`, error);
                // Keep the default empty Maps
            }
            
            // 2. 7TV emotes
            try {
                const sevenTVEmotes = await get7TVEmotes(user.id, user.name);
                channelData.sevenTVEmotes = sevenTVEmotes;
            } catch (error) {
                console.error(`Error loading 7TV emotes for ${channel}:`, error);
                // Keep the default empty Map
            }
            
            // 3. Cheer emotes
            try {
                const cheerEmotesData = await EmoteApiClient.getCheerEmotes(user.id);
                channelData.cheerEmotes =  cheerEmotesData;
            } catch (error) {
                console.error(`Error loading cheer emotes for ${channel}:`, error);
                // Keep the default empty HelixCheermoteList
            }
            
            // Update the channel data with all the emotes we were able to load
            DEFAULT_CHAT_EMOTES.emotes.set(channel, channelData);
            
        } catch (error) {
            console.error(`Error updating channel ${channel}:`, error);
            // The channel already has default empty structures, so we don't need to set them again
        } finally {
            LOADING_CHAT_EMOTES[channel] = false;
        }
    },
    updateUserInfo: async (context, channel) => {
        if ((DEFAULT_CHAT_EMOTES.emotes.has(channel) && DEFAULT_CHAT_EMOTES.emotes.get(channel)?.user) || LOADING_PROFILES[channel]) {
            return;
        }
        LOADING_PROFILES[channel] = true;
        
        // Initialize channel with default empty structures if it doesn't exist
        if (!DEFAULT_CHAT_EMOTES.emotes.has(channel)) {
            DEFAULT_CHAT_EMOTES.emotes.set(channel, {
                user: { name: channel },
                channelBadges: new Map(),
                channelEmotes: new Map(),
                cheerEmotes: new Map(),
                sevenTVEmotes: new Map()
            });
        }
        
        // Get the current channel data
        const channelData = DEFAULT_CHAT_EMOTES.emotes.get(channel);
        
        try {
            // Try to fetch user data
            try {
                const userData = await getUserdata(context, [channel]);
                
                // Update the user data if available
                if (userData && userData instanceof Map && userData.has(channel) && userData.get(channel)?.user) {
                    channelData.user = userData.get(channel).user;
                } else {
                    // Keep the default user object if no data is available
                    console.warn(`No user data found for ${channel}`);
                }
            } catch (error) {
                console.error(`Error fetching user data for ${channel}:`, error);
                // Keep the default user object
            }
            
            // Update the channel data
            DEFAULT_CHAT_EMOTES.emotes.set(channel, channelData);
        } catch (error) {
            console.error(`Error updating user info for ${channel}:`, error);
            // The channel already has a default user object, so we don't need to set it again
        } finally {
            LOADING_PROFILES[channel] = false;
        }
    },
    getBadge: (channel: string, badgeData: string, key: string) => {
        try {
            // Validate input
            if (!badgeData || typeof badgeData !== 'string') {
                console.warn(`Invalid badge data: ${badgeData}`);
                return "";
            }
            
            // Split badge data into badge and version
            const parts = badgeData.split(',');
            if (parts.length !== 2) {
                console.warn(`Invalid badge data format: ${badgeData}`);
                return "";
            }
            
            const [badge, version] = parts;
            
            // Check if channel exists in emotes map
            if (!DEFAULT_CHAT_EMOTES.emotes.has(channel)) {
                return "";
            }
            
            const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);
            
            // Try to get badge from channel badges first
            if (channelEmotes?.channelBadges) {
                const channelBadge = getBadgeImageHtml(channelEmotes.channelBadges, badge, version);
                if (channelBadge) {
                    return channelBadge;
                }
            }
            
            // If not found in channel badges, try global badges
            if (DEFAULT_CHAT_EMOTES.emotes.has('global')) {
                const globalEmotes = DEFAULT_CHAT_EMOTES.emotes.get('global');
                
                if (globalEmotes?.channelBadges) {
                    const globalBadge = getBadgeImageHtml(globalEmotes.channelBadges, badge, version);
                    if (globalBadge) {
                        return globalBadge;
                    }
                }
            }
            
            return "";
        } catch (error) {
            console.error(`Error getting badge for ${badgeData}:`, error);
            return "";
        }
    },
    checkEmote: (channel: string, text: string, key: string, large: boolean) => {
        if (!DEFAULT_CHAT_EMOTES.emotes.has(channel)) {
            return text;
        }
        
        const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);

        if (channelEmotes?.channelEmotes?.get(text)) {
            const emote = channelEmotes?.channelEmotes.get(text);
            // return image node with emote
            return <EmoteComponentSimple key={key} imageUrl={buildEmoteImageUrl(emote?.id! || '', {size: large ? '3.0' : '1.0'})} largeImageUrl={buildEmoteImageUrl(emote?.id! || '', {size: large ? '3.0' : '2.0'})} name={text} large={large} type='Twitch'/>;
        }

         const globalEmotes = DEFAULT_CHAT_EMOTES.emotes.get('global');

        if (globalEmotes?.globalEmotes?.get(text)) {
            const emote = globalEmotes?.globalEmotes.get(text);
            // return image node with emote
            return <EmoteComponentSimple key={key} imageUrl={buildEmoteImageUrl(emote?.id! || '', {size: large ? '3.0' : '1.0'})} largeImageUrl={buildEmoteImageUrl(emote?.id! || '', {size: large ? '3.0' : '2.0'})} name={text} large={large} type='Twitch'/>;
        }

        if (channelEmotes?.sevenTVEmotes) {
            const emote = channelEmotes.sevenTVEmotes.get(text);
            if (!emote || !emote.data) {
                return text;
            }

            const emoteData = emote.data;

            // Validate emote data structure
            if (!emoteData.host || !emoteData.host.url || !emoteData.host.files || 
                !Array.isArray(emoteData.host.files) || emoteData.host.files.length < 4) {
                console.warn(`Invalid emote data structure for ${text}:`, emoteData);
                return text;
            }
            
            // Create the emote component
            return <EmoteComponentSimple 
                key={key} 
                imageUrl={`${emoteData.host.url}/${emoteData.host.files[1].name}`} 
                largeImageUrl={`${emoteData.host.url}/${emoteData.host.files[3].name}`} 
                name={text} 
                marginL={emoteData.flags ? '-1.5em' : undefined} 
                type='7 TV'
            />;
        }

        return text;
    },

    getEmote: (channel: string, text: string, key: string) => {
        try {
            // Check if channel exists in emotes map
            if (!DEFAULT_CHAT_EMOTES.emotes.has(channel)) {
                return text;
            }

            const large = true;
            
            const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);

            if (channelEmotes?.channelEmotes?.get(text)) {
                const emote = channelEmotes?.channelEmotes?.get(text);
                // return image node with emote
                return <EmoteComponent key={key} imageUrl={buildEmoteImageUrl(emote?.id! || '', {size: large ? '3.0' : '1.0'})} largeImageUrl={buildEmoteImageUrl(emote?.id! || '', {size: large ? '3.0' : '2.0'})} name={text} large={large} type='Twitch'/>;
            }

            const globalEmotes = DEFAULT_CHAT_EMOTES.emotes.get('global');

            if (globalEmotes?.emotes?.get(text)) {
                const emote = globalEmotes?.emotes?.get(text);
                // return image node with emote
                return <EmoteComponent key={key} imageUrl={buildEmoteImageUrl(emote?.id! || '', {size: large ? '3.0' : '1.0'})} largeImageUrl={buildEmoteImageUrl(emote?.id! || '', {size: large ? '3.0' : '2.0'})} name={text} large={large} type='Twitch'/>;
            }
            
            // Check if sevenTVEmotes exists
            if (!channelEmotes?.sevenTVEmotes) {
                return text;
            }
            
            // Try to get the emote data
            const emote = channelEmotes.sevenTVEmotes.get(text);
            if (!emote || !emote.data) {
                return text;
            }
            
            const emoteData = emote.data;
            
            // Validate emote data structure
            if (!emoteData.host || !emoteData.host.url || !emoteData.host.files || 
                !Array.isArray(emoteData.host.files) || emoteData.host.files.length < 4) {
                console.warn(`Invalid emote data structure for ${text}:`, emoteData);
                return text;
            }
            
            // Create the emote component
            return <EmoteComponent 
                key={key} 
                imageUrl={`${emoteData.host.url}/${emoteData.host.files[1].name}`} 
                largeImageUrl={`${emoteData.host.url}/${emoteData.host.files[3].name}`} 
                name={text} 
                marginL={emoteData.flags ? '-1.5em' : undefined} 
                type='7 TV'
            />;
        } catch (error) {
            console.error(`Error getting emote for ${text}:`, error);
            return text;
        }
    },

    getCheerEmotes: (channel: string) => {
        try {
            // Validate input
            if (!channel || typeof channel !== 'string') {
                console.warn(`Invalid channel: ${channel}`);
                return [];
            }
            
            // Check if channel exists in emotes map
            if (!DEFAULT_CHAT_EMOTES.emotes.has(channel)) {
                return [];
            }
            
            const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);
            
            // Check if cheerEmotes exists
            if (!channelEmotes?.cheerEmotes) {
                return [];
            }
            
            // Try to get the cheer emote names
            try {
                const names = Object.keys(channelEmotes.cheerEmotes);         
                
                return names;
            } catch (namesError) {
                console.error(`Error getting cheer emote names for ${channel}:`, namesError);
                return [];
            }
        } catch (error) {
            console.error(`Error getting cheer emotes for ${channel}:`, error);
            return [];
        }
    },

    getCheerEmote: (channel: string, name: string, bits: number) => {
        try {
            // Validate input
            if (!channel || typeof channel !== 'string') {
                console.warn(`Invalid channel: ${channel}`);
                return `${name}${bits}`;
            }
            
            if (!name || typeof name !== 'string') {
                console.warn(`Invalid emote name: ${name}`);
                return `${name}${bits}`;
            }
            
            if (typeof bits !== 'number' || isNaN(bits) || bits < 0) {
                console.warn(`Invalid bits value: ${bits}`);
                return `${name}${bits}`;
            }
            
            // Check if channel exists in emotes map
            if (!DEFAULT_CHAT_EMOTES.emotes.has(channel)) {
                return `${name}${bits}`;
            }
            
            const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);
            
            // Check if cheerEmotes exists
            if (!channelEmotes?.cheerEmotes) {
                return `${name}${bits}`;
            }

            return getCheermoteDisplayInfo(name, bits, { 
                    background: 'dark', 
                    scale: 2, 
                    state: 'animated' 
            }, channelEmotes.cheerEmotes);
            
        } catch (error) {
            console.error(`Error getting cheer emote for ${channel}, ${name}, ${bits}:`, error);
            return `${name}${bits}`;
        }
    },

    getLogo: (channel: string) => {
        try {
            // Check if channel exists in emotes map
            if (!DEFAULT_CHAT_EMOTES.emotes.has(channel)) {
                return null;
            }
            
            const channelData = DEFAULT_CHAT_EMOTES.emotes.get(channel);
            
            // Check if user exists
            if (!channelData?.user) {
                return null;
            }
            
            const channelUser = channelData.user;
            
            // Check if profilePictureUrl exists
            if (!channelUser.profilePictureUrl) {
                return null;
            }
            
            // Create the image element
            return <img src={channelUser.profilePictureUrl} alt={`${channel}'s profile`} />;
        } catch (error) {
            console.error(`Error getting logo for ${channel}:`, error);
            return null;
        }
    },

    getChannelId: (channel: string) => {
        try {
            // Check if channel exists in emotes map
            if (!channel || typeof channel !== 'string') {
                console.warn(`Invalid channel: ${channel}`);
                return '';
            }
            
            if (!DEFAULT_CHAT_EMOTES.emotes.has(channel)) {
                return channel; // Return the channel name as a fallback ID
            }
            
            const channelData = DEFAULT_CHAT_EMOTES.emotes.get(channel);
            
            // Check if user exists
            if (!channelData?.user) {
                return channel; // Return the channel name as a fallback ID
            }
            
            // Return the user ID if it exists, otherwise return the channel name
            return channelData.user.id || channel;
        } catch (error) {
            console.error(`Error getting channel ID for ${channel}:`, error);
            return channel || ''; // Return the channel name as a fallback ID, or empty string if channel is undefined
        }
    },

    getEmoteList: (channel: string, filter: string) => {
        try {
            // Validate input
            if (!channel || typeof channel !== 'string') {
                console.warn(`Invalid channel: ${channel}`);
                return new Map<string, any[]>();
            }
            
            if (!filter || typeof filter !== 'string') {
                console.warn(`Invalid filter: ${filter}`);
                filter = ''; // Use empty string as default
            }
            
            const emoteList = new Map<string, any[]>();
            const lowerFilter = filter.toLowerCase();
            
            // Try to add user-specific Twitch emotes
            try {
                const userEmotes = DEFAULT_CHAT_EMOTES.emotes.get('user');
                if (userEmotes && userEmotes.size > 0) {
                    try {
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
                    } catch (userError) {
                        console.error('Error processing user emotes:', userError);
                    }
                }
            } catch (userEmotesError) {
                console.error('Error getting user emotes:', userEmotesError);
            }
            
            // Try to add channel-specific 7TV emotes
            try {
                const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);
                if (channelEmotes?.sevenTVEmotes) {
                    try {
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
                    } catch (sevenTVError) {
                        console.error('Error processing 7TV emotes:', sevenTVError);
                    }
                }
            } catch (channelEmotesError) {
                console.error('Error getting channel emotes:', channelEmotesError);
            }
            
            // Try to add channel-specific Twitch emotes
            try {
                const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);
                if (channelEmotes?.channelEmotes) {
                    try {
                        const entries = Array.from(channelEmotes.channelEmotes.entries()) as [string, any][];
                        const channelTwitchEmotes = entries
                            .filter(entry => entry[0].toLowerCase().includes(lowerFilter))
                            .map(entry => ({
                                name: entry[0],
                                data: {
                                    ...entry[1],
                                    getImageUrl(scale: number) {
                                        return `https://static-cdn.jtvnw.net/emoticons/v2/${entry[1].id}/default/dark/${scale}.0`;
                                    }
                                },
                                type: 'Twitch'
                            }));
                        if (channelTwitchEmotes.length > 0) {
                            emoteList.set('Channel Emotes', channelTwitchEmotes);
                        }
                    } catch (channelTwitchError) {
                        console.error('Error processing channel Twitch emotes:', channelTwitchError);
                    }
                }
            } catch (channelTwitchEmotesError) {
                console.error('Error getting channel Twitch emotes:', channelTwitchEmotesError);
            }

            // Try to add global emotes
            try {
                const globalEmotes = DEFAULT_CHAT_EMOTES.emotes.get('global');
                if (globalEmotes?.channelEmotes) {
                    try {
                        const entries = Array.from(globalEmotes.channelEmotes.entries()) as [string, any][];
                        const globals = entries
                            .filter(entry => entry[0].toLowerCase().includes(lowerFilter))
                            .map(entry => ({
                                name: entry[0],
                                data: {
                                    ...entry[1],
                                    getImageUrl(scale: number) {
                                        return `https://static-cdn.jtvnw.net/emoticons/v2/${entry[1].id}/default/dark/${scale}.0`;
                                    }
                                },
                                type: 'Twitch'
                            }));
                        if (globals.length > 0) {
                            emoteList.set('Global Emotes', globals);
                        }
                    } catch (globalError) {
                        console.error('Error processing global emotes:', globalError);
                    }
                }
            } catch (globalEmotesError) {
                console.error('Error getting global emotes:', globalEmotesError);
            }
            
            return emoteList;
        } catch (error) {
            console.error(`Error getting emote list for ${channel} with filter ${filter}:`, error);
            return new Map<string, any[]>();
        }
    }
}

PubSub.subscribe('Update-seventTV', async (m, data) => {
    try {
        // Validate data structure before processing
        if (!data || typeof data !== 'object') {
            console.error('Invalid 7TV update data:', data);
            return;
        }

        if (!data.type || !data.data) {
            console.error('Missing required fields in 7TV update data:', data);
            return;
        }

        // Handle 'add' type updates
        if (data.type === 'add') {
            try {
                // Validate required fields for 'add' type
                if (!data.data.emoteSetId || !data.data.emote || !data.data.emoteData) {
                    console.error('Missing required fields for 7TV add update:', data.data);
                    return;
                }

                const channel = emoteSetUserNameMap[data.data.emoteSetId];
                if (!channel) {
                    console.warn(`No channel found for emote set ID: ${data.data.emoteSetId}`);
                    return;
                }

                if (!DEFAULT_CHAT_EMOTES.emotes.has(channel)) {
                    console.warn(`Channel ${channel} not found in emotes map`);
                    return;
                }

                const channelData = DEFAULT_CHAT_EMOTES.emotes.get(channel);
                
                // Initialize sevenTVEmotes if it doesn't exist
                if (!channelData.sevenTVEmotes) {
                    channelData.sevenTVEmotes = new Map();
                }
                
                // Add the new emote
                channelData.sevenTVEmotes.set(data.data.emote, data.data.emoteData);
                DEFAULT_CHAT_EMOTES.emotes.set(channel, channelData);
                
                console.log(`Added 7TV emote ${data.data.emote} to channel ${channel}`);

                // Persist to EmoteStore
                try {
                    const userId = channelData.user?.id;
                    if (userId) {
                        // Get current stored emotes
                        const storedEmotes = await EmoteStore.getEmotes(EmotePrefix.SEVENTV, userId);
                        const currentEmotes = storedEmotes?.emotes || [];
                        
                        // Check if emote already exists to avoid duplicates
                        const existingEmoteIndex = currentEmotes.findIndex(emote => emote.name === data.data.emote);
                        
                        let updatedEmotes;
                        if (existingEmoteIndex >= 0) {
                            // Update existing emote
                            updatedEmotes = [...currentEmotes];
                            updatedEmotes[existingEmoteIndex] = {
                                name: data.data.emote,
                                data: data.data.emoteData
                            };
                        } else {
                            // Add new emote
                            updatedEmotes = [...currentEmotes, {
                                name: data.data.emote,
                                data: data.data.emoteData
                            }];
                        }
                        
                        // Persist updated emotes
                        await EmoteStore.storeEmotes(EmotePrefix.SEVENTV, userId, updatedEmotes);
                        console.log(`Persisted 7TV emote add for ${data.data.emote} to EmoteStore`);
                    }
                } catch (persistError) {
                    console.error('Error persisting 7TV emote add to store:', persistError);
                }
            } catch (addError) {
                console.error('Error processing 7TV add update:', addError);
                // Continue execution to handle other updates
            }
        }
        
        // Handle 'remove' type updates
        if (data.type === 'remove') {
            try {
                // Validate required fields for 'remove' type
                if (!data.data.emoteSetId || !data.data.emote) {
                    console.error('Missing required fields for 7TV remove update:', data.data);
                    return;
                }

                const channel = emoteSetUserNameMap[data.data.emoteSetId];
                if (!channel) {
                    console.warn(`No channel found for emote set ID: ${data.data.emoteSetId}`);
                    return;
                }

                if (!DEFAULT_CHAT_EMOTES.emotes.has(channel)) {
                    console.warn(`Channel ${channel} not found in emotes map`);
                    return;
                }

                const channelData = DEFAULT_CHAT_EMOTES.emotes.get(channel);
                
                if (!channelData.sevenTVEmotes) {
                    console.warn(`No 7TV emotes found for channel ${channel}`);
                    return;
                }
                
                // Remove the emote
                channelData.sevenTVEmotes.delete(data.data.emote);
                console.log(`Removed 7TV emote ${data.data.emote} from channel ${channel}`);

                // Persist to EmoteStore
                try {
                    const userId = channelData.user?.id;
                    if (userId) {
                        // Get current stored emotes
                        const storedEmotes = await EmoteStore.getEmotes(EmotePrefix.SEVENTV, userId);
                        const currentEmotes = storedEmotes?.emotes || [];
                        
                        // Remove the emote from stored emotes
                        const updatedEmotes = currentEmotes.filter(emote => emote.name !== data.data.emote);
                        
                        // Persist updated emotes
                        await EmoteStore.storeEmotes(EmotePrefix.SEVENTV, userId, updatedEmotes);
                        console.log(`Persisted 7TV emote remove for ${data.data.emote} to EmoteStore`);
                    }
                } catch (persistError) {
                    console.error('Error persisting 7TV emote remove to store:', persistError);
                }
            } catch (removeError) {
                console.error('Error processing 7TV remove update:', removeError);
                // Continue execution to handle other updates
            }
        }
    } catch (error) {
        console.error('Error handling 7TV update:', error);
    }
});
