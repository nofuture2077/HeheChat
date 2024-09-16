import { SystemMessageType, SystemMessageMainType } from "@/commons/message";

export type EventType = 'raid' | 'follow' | 'cheer'| 'donation' |
'sub_1000' | 'sub_2000' | 'sub_3000' | 'sub_Prime' | 
'subgift_1000' | 'subgift_2000' | 'subgift_3000' | 
'subgiftb_1000' | 'subgiftb_2000' | 'subgiftb_3000';

export type EventMainType = 'sub' | 'subgift' | 'subgiftb' | 'raid' | 'follow' | 'donation' | 'cheer';

export type EventAlertRestriction = 'none' | 'mod' | 'system';

export type EventAlertSpecifier = {
    type: 'min' | 'exact',
    amount: number,
}

export const EventTypeMapping: Record<SystemMessageType, SystemMessageMainType> = {
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
    'channelPointRedemption': 'channelPointRedemption'
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
}

export type EventAlert = {
    name: string;
    id: string;
    type: EventType;
    specifier: EventAlertSpecifier;
    restriction: EventAlertRestriction;
    audio?: EventAlertAudioData;
    visual?: EventAlertVisualData;
}

export type EventAlertAudioData = {
    jingle?: Base64FileReference;
    tts?: EventAlertTTS;
}

export type EventAlertTTS = {
    text?: string;
    voiceType: 'ai' | 'google' | 'system';
    voiceSpecifier: string;
    voiceParams: Record<string, string | number>;
}

export type EventAlertVisualData = {
    element: Base64FileReference;
    text?: string;
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
}