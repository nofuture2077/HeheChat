import _ from "underscore"

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

export const EventTypeMapping: Record<EventType, EventMainType> = {
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
    'subgiftb_3000': 'subgiftb'
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
    voiceType: 'ai' | 'system';
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

export type Base64ImageFile = {
    image: Base64File
}

export type Base64AudioFile = {
    audio: Base64File
}

export type Base64VideoFile = {
    video: Base64File
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

export function getAlert(event: Event, alertConfig: EventAlertConfig): EventAlert | undefined {
    const eventMainType = EventTypeMapping[event.eventtype];
    const alerts = alertConfig.data?.alerts[eventMainType];
    if (!alerts) {
        return undefined;
    }
    const exactAlerts: Record<number, EventAlert[]> = {};
    const minAlerts: Record<number, EventAlert[]> = {};
    alerts.forEach(alert => {
        if (alert.specifier.type === "exact") {
            if (exactAlerts[alert.specifier.amount]) {
                exactAlerts[alert.specifier.amount].push(alert)
            } else {
                exactAlerts[alert.specifier.amount] = [alert];
            }
        }
        if (alert.specifier.type === "min") {
            if (minAlerts[alert.specifier.amount]) {
                minAlerts[alert.specifier.amount].push(alert)
            } else {
                minAlerts[alert.specifier.amount] = [alert];
            }
        }
    });
    const exactAlertMatches = exactAlerts[event.amount || 0];
    if (exactAlertMatches && exactAlertMatches.length) {
        return _.sample(exactAlertMatches);
    }
    const minKeys = Object.keys(minAlerts).map(x => Number(x)).sort((a, b) => a - b);
    const step = minKeys.findLast(x => x <= (event.amount || 0));
    if (!step) {
        return undefined;
    }
    return _.sample(minAlerts[step]);
}