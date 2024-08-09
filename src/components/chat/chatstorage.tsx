export interface ChatStorage {
    store: (channel: string, user: string, date: Date, msg: string) => void;
    load: (channels: string[], ignoredUsers: string[]) => string[];
}

interface ChatMessageData {
    date: number,
    user: string | undefined,
    msg: string | undefined
}

export class LSChatStorage implements ChatStorage {
    private data: Map<string, ChatMessageData[]>;

    constructor() {
        this.data = new Map<string, ChatMessageData[]>();
        this.loadFromLS();
    }

    store(channel: string, user: string | undefined, date: Date, msg: string | undefined): void {
        if (this.data.has(channel)) {
            this.data.get(channel)!.push({date: date.getDate(), user: user, msg: msg});
        } else {
            this.data.set(channel, [{date: date.getDate(), user: user, msg: msg}]);
        }
        this.saveToLS(channel);
    }

    load(channels: string[], ignoredUsers: string[]): string[] {
        const messages: ChatMessageData[] = channels.map((channel): ChatMessageData[] => {
            return this.data.has(channel) ? this.data.get(channel)!.slice(-100) : []
        }).reduce((accumulator, value) => accumulator!.concat(value!), []);
        return messages.filter(m => !m.user || ignoredUsers.indexOf(m.user) === -1).sort((a, b) => a.date - b.date).map(msg => msg.msg!);
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

export const Storage = new LSChatStorage();

