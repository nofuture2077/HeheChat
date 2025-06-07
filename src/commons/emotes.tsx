import { getUserdata, LoginContext } from '@/commons/login';
import { HelixCheermoteList } from '@twurple/api';
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

export async function getBadgesAndEmotes(userId: string) {
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

export async function getGlobalBadgesAndEmotes() {
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

export async function getBadgesAndEmotesByNames(usernames: string[]) {
    try {
        const users = await EmoteApiClient.getUsersByNames(usernames);
        
        // Ensure users is an array
        if (!Array.isArray(users)) {
            console.error('Expected users to be an array but got:', typeof users);
            return new Map();
        }

        // Process each user individually, so errors in one user don't affect others
        const data = await Promise.all(users.map(async (user: any) => {
            try {
                // Create default empty structures for each emote type
                let channelBadges: any[] = [];
                let channelEmotes: any[] = [];
                let sevenTVEmotes = new Map();
                let cheerEmotes;
                
                // Create a safe empty HelixCheermoteList with a valid structure
                // Create a safe empty HelixCheermoteList
                // Use type assertion to satisfy TypeScript while still passing an empty array
                cheerEmotes = new HelixCheermoteList([] as any);
                
                // Try to fetch channel badges and emotes
                try {
                    const result = await getBadgesAndEmotes(user.id);
                    channelBadges = result.channelBadges || [];
                    channelEmotes = result.channelEmotes || [];
                } catch (error) {
                    console.error(`Error fetching badges and emotes for ${user.name}:`, error);
                    // Continue with empty arrays for badges and emotes
                }
                
                // Try to fetch 7TV emotes
                try {
                    sevenTVEmotes = await get7TVEmotes(user.id, user.name);
                } catch (error) {
                    console.error(`Error fetching 7TV emotes for ${user.name}:`, error);
                    // Continue with empty Map for 7TV emotes
                }
                
                // Try to fetch cheer emotes
                try {
                    const cheerEmotesData = await EmoteApiClient.getCheerEmotes(user.id);
                    
                    cheerEmotes = new HelixCheermoteList(Object.values(cheerEmotesData) as any);
                } catch (error) {
                    console.error(`Error fetching cheer emotes for ${user.name}:`, error);
                    // Continue with empty HelixCheermoteList
                }
                
                return {
                    user,
                    channelBadges: Array.isArray(channelBadges) ? toMap(channelBadges as any[], (ba: any) => ba.id) : new Map(),
                    channelEmotes: Array.isArray(channelEmotes) ? toMap(channelEmotes as any[], (em: any) => em.name) : new Map(),
                    cheerEmotes,
                    sevenTVEmotes
                };
            } catch (error) {
                console.error(`Error processing emotes for user ${user.name}:`, error);
                // Return a minimal valid object for this user to prevent the entire Promise.all from failing
                return {
                    user,
                    channelBadges: new Map(),
                    channelEmotes: new Map(),
                    cheerEmotes: new HelixCheermoteList([] as any),
                    sevenTVEmotes: new Map()
                };
            }
        }));

        return Array.isArray(data) ? toMap(data, d => d.user.name) : new Map();
    } catch (error) {
        console.error('Error fetching badges and emotes by names:', error);
        return new Map();
    }
}

export async function getGlobalBadgesAndEmotesByNames() {
    const { channelBadges, channelEmotes } = await getGlobalBadgesAndEmotes();

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
                cheerEmotes: new HelixCheermoteList([] as any),
                sevenTVEmotes: new Map()
            });
        }
        
        try {
            // Try to load global emotes if this is the first channel being loaded
            if (Object.keys(LOADING_CHAT_EMOTES).length === 1) {
                try {
                    const globalEmoteData = await getGlobalBadgesAndEmotesByNames();
                    if (globalEmoteData) {
                        DEFAULT_CHAT_EMOTES.emotes.set('global', globalEmoteData);
                    }
                } catch (error) {
                    console.error('Error loading global emotes:', error);
                    // Continue with empty global emotes
                    if (!DEFAULT_CHAT_EMOTES.emotes.has('global')) {
                        DEFAULT_CHAT_EMOTES.emotes.set('global', {
                            user: { name: 'global' },
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
                const { channelBadges, channelEmotes } = await getBadgesAndEmotes(user.id);
                channelData.channelBadges = Array.isArray(channelBadges) 
                    ? toMap(channelBadges as any[], (ba: any) => ba.id) 
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
                channelData.cheerEmotes = new HelixCheermoteList(Object.values(cheerEmotesData) as any);
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
                cheerEmotes: new HelixCheermoteList([] as any),
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
            let badgeInfo = null;
            
            // Check if channel badges exist and try to get the badge
            if (channelEmotes?.channelBadges) {
                try {
                    const channelBadge = channelEmotes.channelBadges.get(badge);
                    if (channelBadge && typeof channelBadge.getVersion === 'function') {
                        badgeInfo = channelBadge.getVersion(version);
                    }
                } catch (channelError) {
                    console.error(`Error getting channel badge ${badge} version ${version}:`, channelError);
                }
            }
            
            // If not found in channel badges, try global badges
            if (!badgeInfo && DEFAULT_CHAT_EMOTES.emotes.has('global')) {
                const globalEmotes = DEFAULT_CHAT_EMOTES.emotes.get('global');
                
                if (globalEmotes?.channelBadges) {
                    try {
                        const globalBadge = globalEmotes.channelBadges.get(badge);
                        if (globalBadge && typeof globalBadge.getVersion === 'function') {
                            badgeInfo = globalBadge.getVersion(version);
                        }
                    } catch (globalError) {
                        console.error(`Error getting global badge ${badge} version ${version}:`, globalError);
                    }
                }
            }
            
            // If badge info is found, create the image element
            if (badgeInfo && typeof badgeInfo.getImageUrl === 'function') {
                try {
                    const imageUrl = badgeInfo.getImageUrl(2);
                    return <img alt={badge} src={imageUrl} key={key} />;
                } catch (imageError) {
                    console.error(`Error getting image URL for badge ${badge} version ${version}:`, imageError);
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

        if (channelEmotes?.emotes?.get(text)) {
            const emote = channelEmotes?.emotes?.get(text);
            // return image node with emote
            return <EmoteComponentSimple key={key} imageUrl={buildEmoteImageUrl(emote?.id! || '', {size: large ? '3.0' : '1.0'})} largeImageUrl={buildEmoteImageUrl(emote?.id! || '', {size: large ? '3.0' : '2.0'})} name={text} large={large} type='Twitch'/>;
        }

         const globalEmotes = DEFAULT_CHAT_EMOTES.emotes.get('global');

        if (globalEmotes?.emotes?.get(text)) {
            const emote = globalEmotes?.emotes?.get(text);
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
            
            const channelEmotes = DEFAULT_CHAT_EMOTES.emotes.get(channel);
            
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
            
            // Check if getPossibleNames method exists
            if (typeof channelEmotes.cheerEmotes.getPossibleNames !== 'function') {
                console.warn(`getPossibleNames is not a function for ${channel}`);
                return [];
            }
            
            // Try to get the cheer emote names
            try {
                const names = channelEmotes.cheerEmotes.getPossibleNames();
                
                // Validate names
                if (!Array.isArray(names)) {
                    console.warn(`Invalid cheer emote names for ${channel}: not an array`);
                    return [];
                }
                
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
            
            // Check if getCheermoteDisplayInfo method exists
            if (typeof channelEmotes.cheerEmotes.getCheermoteDisplayInfo !== 'function') {
                console.warn(`getCheermoteDisplayInfo is not a function for ${channel}`);
                return `${name}${bits}`;
            }
            
            // Try to get the cheer emote display info
            try {
                const displayInfo = channelEmotes.cheerEmotes.getCheermoteDisplayInfo(name, bits, { 
                    background: 'dark', 
                    scale: 2, 
                    state: 'animated' 
                });
                
                // Validate display info
                if (!displayInfo || typeof displayInfo !== 'object') {
                    console.warn(`Invalid display info for ${name}${bits}`);
                    return `${name}${bits}`;
                }
                
                return displayInfo;
            } catch (cheerError) {
                console.error(`Error getting cheer emote display info for ${channel}, ${name}, ${bits}:`, cheerError);
                return `${name}${bits}`;
            }
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
                                data: entry[1],
                                type: 'Global'
                            }));
                        if (globals.length > 0) {
                            emoteList.set('Global', globals);
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

PubSub.subscribe('Update-seventTV', (m, data) => {
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
            } catch (removeError) {
                console.error('Error processing 7TV remove update:', removeError);
                // Continue execution to handle other updates
            }
        }
    } catch (error) {
        console.error('Error handling 7TV update:', error);
    }
});
