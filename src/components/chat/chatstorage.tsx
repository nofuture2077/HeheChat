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

class LSChatStorage implements ChatStorage {
    private data: Map<string, ChatMessageData[]>;

    constructor() {
        this.data = new Map<string, ChatMessageData[]>();
        this.loadFromLS();
    }

    store(channel: string, user: string | undefined, date: Date, msg: string | undefined): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.data.has(channel)) {
                this.data.get(channel)!.push({channel, date: date.getTime(), user: user, msg: msg});
            } else {
                this.data.set(channel, [{channel, date: date.getTime(), user: user, msg: msg}]);
            }
            this.saveToLS(channel);
            resolve();
        });

    }

    load(channels: string[], ignoredUsers: string[]): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const messages: ChatMessageData[] = channels.map((channel): ChatMessageData[] => {
                return this.data.has(channel) ? this.data.get(channel)!.slice(-100) : []
            }).reduce((accumulator, value) => accumulator!.concat(value!), []);
            const data = messages.filter(m => !m.user || ignoredUsers.indexOf(m.user) === -1).sort((a, b) => a.date - b.date).map(msg => msg.msg!);
            resolve(data);
        });
    }

    loadFromLS(): void {
        for (var i = 0; i < localStorage.length;i++) {
            const key = localStorage.key(i)!;
            if (key.startsWith('chat-messages-')) {
                const keyParts = key.split('-');
                const channel = keyParts[2];
                const messages = JSON.parse(localStorage.getItem(key)!) as ChatMessageData[];
                this.data.set(channel, messages);
            }
        }
    }

    saveToLS(channel: string): void {
        localStorage.setItem('chat-messages-' + channel.toLowerCase(), JSON.stringify(this.data.get(channel)));
    }
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


export const Storage = import.meta.env.VITE_BACKEND_URL ? new RemoteChatStorage(import.meta.env.VITE_BACKEND_URL) : new LSChatStorage();

