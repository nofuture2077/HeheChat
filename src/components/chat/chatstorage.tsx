export interface ChatStorage {
    store: (channel: string, user: string, date: Date, msg: string) => Promise<void>;
    load: (channels: string[], ignoredUsers: string[]) => Promise<string[]>;
}

interface ChatMessageData {
    channel: string,
    date: number,
    user: string | undefined,
    msg: string | undefined
}

class RemoteChatStorage implements ChatStorage {
    private baseUrl: string;
    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    store(channel: string, user: string | undefined, date: Date, msg: string | undefined): Promise<void> {
        return Promise.resolve();
    }

    load(channels: string[], ignoredUsers: string[]): Promise<string[]> {
        return fetch(this.baseUrl + '/chat/history?' + [['channels', channels.join(',')].join('='), ['ignored', ignoredUsers.join(',')].join('=')].join('&')).then(res => res.json()).then(arr => arr.map((x:any) => x.message));
    }
}


export const Storage = new RemoteChatStorage(import.meta.env.VITE_BACKEND_URL);

