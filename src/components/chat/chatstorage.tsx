export interface ChatStorage {
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

    async load(channels: string[], ignoredUsers: string[]): Promise<string[]> {
        return fetch(this.baseUrl + '/chat/history?' + [['channels', (channels || []).join(',')].join('='), ['ignored', (ignoredUsers || []).join(',')].join('=')].join('&')).then(res => res.json()).then(arr => arr.map((x:any) => x.message));
    }
}


export const Storage = new RemoteChatStorage(import.meta.env.VITE_BACKEND_URL);

