export interface EventStorage {
    store: (event: EventData) => Promise<void>;
    load: (channels: string[]) => Promise<EventData[]>;
}

export interface EventData {
    id: number;
    date: number;
    eventtype: string;
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

    load(channels: string[]): Promise<EventData[]> {
        return fetch(this.baseUrl + '/event/history?' + [['channels', channels.join(',')].join('=')].join('&')).then(res => res.json());
    }
}


export const EventStorage = import.meta.env.VITE_BACKEND_URL ? new RemoteEventStorage(import.meta.env.VITE_BACKEND_URL) : null;