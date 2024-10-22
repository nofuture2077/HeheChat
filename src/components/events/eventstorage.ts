import { EventType } from "@/commons/events"

export interface EventStorage {
    store: (event: EventData) => Promise<void>;
    load: (channels: string[], ignored: string[]) => Promise<EventData[]>;
}

export interface EventData {
    id: number;
    date: number;
    eventtype: EventType;
    channel: string;
    username: string;
    usernameTo?: string;
    text?: string;
    amount?: number;
    amount2?: number;
}

class RemoteEventStorage implements EventStorage {
    private baseUrl: string;
    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    store(event: EventData): Promise<void> {
        return Promise.resolve();
    }

    async load(channels: string[], ignored: string[]): Promise<EventData[]> {
        return fetch(this.baseUrl + '/event/history?' + [['channels', channels.join(',')].join('='), ['ignored', ignored.join(',')].join('=')].join('&')).then(res => res.json());
    }
}


export const EventStorage = import.meta.env.VITE_BACKEND_URL ? new RemoteEventStorage(import.meta.env.VITE_BACKEND_URL) : null;