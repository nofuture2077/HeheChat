export interface ChatStorage {
    load: (channels: string[], ignoredUsers: string[], maxMessages?: number) => Promise<string[]>;
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

    async load(channels: string[], ignoredUsers: string[], maxMessages?: number): Promise<string[]> {
        const params = [
            ['channels', (channels || []).join(',')].join('='),
            ['ignored', (ignoredUsers || []).join(',')].join('=')
        ];
        
        if (maxMessages !== undefined) {
            params.push(['max', maxMessages.toString()].join('='));
        }
        
        return fetch(this.baseUrl + '/chat/history?' + params.join('&')).then(res => res.json()).then(arr => arr.map((x:any) => x.message));
    }
}


export const Storage = new RemoteChatStorage(import.meta.env.VITE_BACKEND_URL);
