export type EventType = 'raid' | 'follow' | 'cheer'| 'donation' | 'blerp' |
'sub_1000' | 'sub_2000' | 'sub_3000' | 'sub_Prime' | 
'subgift_1000' | 'subgift_2000' | 'subgift_3000' | 
'subgiftb_1000' | 'subgiftb_2000' | 'subgiftb_3000' | 'channelPointRedemption' | 'kofisub' | 'kofidono' | 'kofishop' | 'tts' | 'hypetrain';

export type EventMainType = 'sub' | 'subgift' | 'subgiftb' | 'raid' | 'follow' | 'donation' | 'cheer' | 'channelPointRedemption' | 'blerp' | 'kofi' | 'tts' | 'hypetrain';

export type EventAlertRestriction = 'none' | 'mod' | 'system';

export type EventAlertSpecifier = {
    type: 'min' | 'exact' | 'matches';
    amount?: number;
    attribute?: string;
    text?: string;
}

export const EventTypeMapping: Record<string, string> = {
    'raid': 'raid',
    'follow': 'follow',
    'cheer': 'cheer',
    'donation': 'donation',
    'sub_1000': 'sub',
    'sub_2000': 'sub',
    'sub_3000': 'sub',
    'sub_Prime': 'sub',
    'subgift_1000': 'subgift',
    'subgift_2000': 'subgift',
    'subgift_3000': 'subgift',
    'subgiftb_1000': 'subgiftb',
    'subgiftb_2000': 'subgiftb',
    'subgiftb_3000': 'subgiftb',
    'timeout': 'timeout',
    'ban': 'ban',
    'delete': 'delete',
    'streamOnline': 'streamOnline',
    'streamOffline': 'streamOffline',
    'channelPointRedemption': 'channelPointRedemption',
    'blerp': 'blerp',
    'seventv_emote_add': 'sevenTVAdded',
    'seventv_emote_remove': 'sevenTVRemoved',
    'kofishop': 'kofi',
    'kofisub': 'kofi',
    'kofidono': 'kofi',
    'hypetrain': 'hypetrain',
    'tts': 'tts'
};

export type EventAlertMeta = {
    channel: string;
    name: string;
    guid: string;
    hash: string;
    lastUpdate: string;
}

export type EventAlertData = {
    alerts: Record<EventMainType, EventAlert[]>;
    files: Record<Base64FileReference, Base64File>;
    config?: {
        ttsReplacements?: Record<string, string>;
        defaultVoice?: {
            voiceType: 'ai' | 'google';
            voiceSpecifier: string;
            voiceParams: Record<string, string | number>;
        };
    }
}

export type EventAlert = {
    name: string;
    id: string;
    type: EventType;
    specifier: EventAlertSpecifier;
    restriction: EventAlertRestriction;
    audio?: EventAlertAudioData;
    visual?: EventAlertVisualData;
    minDuration?: number;
}

export type EventAlertAudioData = {
    jingle?: Base64FileReference;
    tts?: EventAlertTTS;
}

export type EventAlertTTS = {
    text?: string;
    voiceType: 'ai' | 'google' | 'none' | 'default';
    voiceSpecifier: string;
    voiceParams: Record<string, string | number>;
}

export type EventAlertVisualData = {
    element?: Base64FileReference;
    headline: string;
    text?: string;
    position?: string;
    layout?: string;
}

export type Base64FileReference = string;

export type Base64File = {
    id: string;
    type: 'audio' | 'image' | 'video';
    name: string;
    mime: string;
    data: string;
}

export type EventAlertConfig = {
    meta: EventAlertMeta;
    data?: EventAlertData;
}

export type Event = {
    id: number;
    channel: string; 
    username: string; 
    eventtype: EventType;
    date: number;
    usernameTo?: string;
    text?: string;
    amount?: number;
    amount2?: number;
    eventAlert?: EventAlert;
    userSeed?: string; // Added for deterministic sprite selection
    rerollPending?: boolean; // Flag indicating a reroll is pending for this user
}

// User sprite assignment interface
export interface UserSpriteAssignment {
    username: string;
    channel: string;
    selectedFilename: string;
    rerollPending: boolean;
}

export interface VisualAlert {
    text: string;
    headline: string;
    image?: string;
    duration: number;
    channel: string;
    position?: string;
    layout?: string;
}

export interface ExtractedImage {
    name: string;
    data: string; // base64 data URL
    mime: string;
}

export interface ZipCache {
    zipHash: string;
    images: ExtractedImage[];
    timestamp: number;
}
