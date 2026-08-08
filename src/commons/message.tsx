import { generateGUID } from './helper';
import { EventType, EventMainType } from './events';
import { ModActionType } from '../components/chat/mod/modactions';

export type HeheMessage = HeheChatMessage | SystemMessage | YTChatMessage;
export type SevenTVMessage = "sevenTVAdded" | "sevenTVRemoved";
export type StreamEventType = "streamOnline" | "streamOffline";
export type SystemMessageType = ModActionType | EventType | StreamEventType | SevenTVMessage;
export type SystemMessageMainType = ModActionType | EventMainType | StreamEventType | SevenTVMessage;

interface UserInfo {
    displayName: string;
    userId: string;
    userName: string;
    color?: string;
    badges: Record<string, string>;
    isMod: boolean;
    isHehePro: boolean;
    isHeheAdmin: boolean;
}

export interface ParsedMessagePart {
    type: 'text' | 'emote' | 'cheermote' | 'mention';
    text: string;
    id?: string;
    name: string;
    emote?: {
        id: string;
    },
    mention?: {
        user_id: string;
        user_name: string;
    },
    cheermote?: {
        bits: number;
        prefix: string;
    }
}

export class HeheChatMessage {
    type: 'chat' = 'chat';
    id: string;
    text: string;
    parts: ParsedMessagePart[];
    target: string;
    date: Date;
    userInfo: UserInfo;
    channelId: string;
    isFirst?: boolean;
    isHighlight?: boolean;
    msgType?: string;
    replyParentMessageId?: string | null;

    constructor(
        id: string,
        text: string,
        parts: ParsedMessagePart[],
        target: string,
        date: Date,
        userInfo: UserInfo,
        channelId: string,
        isFirst?: boolean,
        isHighlight?: boolean,
        msgType?: string,
        replyParentMessageId?: string | null
    ) {
        this.id = id;
        this.text = text;
        this.target = target.startsWith('#') ? target : '#' + target;
        this.date = date;
        this.userInfo = userInfo;
        this.parts = parts;
        this.channelId = channelId;
        this.isFirst = isFirst;
        this.isHighlight = isHighlight;
        this.msgType = msgType;
        this.replyParentMessageId = replyParentMessageId;
    }

    static deserialize(json: string): HeheChatMessage {
        const data = JSON.parse(json);
        return new HeheChatMessage(
            data.id,
            data.text,
            data.parts,
            data.target,
            new Date(data.date),
            data.userInfo,
            data.channelId,
            data.isFirst,
            data.isHighlight,
            data.msgType,
            data.replyParentMessageId
        );
    }
}

export class SystemMessage {
    type: 'system' = 'system';
    subType: SystemMessageType;
    id: string;
    data: {[key: string]: any};
    target: string;
    channelId: string;
    userId: string;
    date: Date;
    rawLine: string;

    constructor(channel: string, data: {[key: string]: string}, date: Date, subType: SystemMessageType, channelId: string, userId: string, id?: string) {
        this.type = 'system';
        this.target = '#' + channel;
        this.channelId = channelId;
        this.userId = userId;
        this.id = id || generateGUID();
        this.data = data;
        this.subType = subType;
        this.date = date;
        this.rawLine = this.serialize();
    }

    private serialize(): string {
        return JSON.stringify({
            type: this.type,
            subType: this.subType,
            id: this.id,
            data: this.data,
            target: this.target,
            channelId: this.channelId,
            userId: this.userId,
            date: this.date.getTime()
        });
    }

    static deserialize(json: string): SystemMessage {
        const data = JSON.parse(json);
        const channel = data.target.startsWith('#') ? data.target.substring(1) : data.target;
        return new SystemMessage(
            channel,
            data.data,
            new Date(data.date),
            data.subType,
            data.channel,
            data.userId,
            data.id
        );
    }
}

export type YTMessagePart =
    | { type: 'text'; content: string }
    | { type: 'emoji'; url: string; alt: string };

export class YTChatMessage {
    type: 'ytchat' = 'ytchat';
    id: string;
    text: string;
    parts?: YTMessagePart[];
    authorName: string;
    authorColor?: string;
    authorProfileImageUrl?: string;
    channelId: string;
    isMembership?: boolean;
    isVerified?: boolean;
    isModerator?: boolean;
    isOwner?: boolean;
    target: string;
    date: Date;

    constructor(
        id: string,
        text: string,
        authorName: string,
        channelId: string,
        target: string,
        date: Date,
        authorProfileImageUrl?: string,
        isMembership?: boolean,
        isVerified?: boolean,
        isModerator?: boolean,
        isOwner?: boolean,
        parts?: YTMessagePart[],
        authorColor?: string
    ) {
        this.id = id;
        this.text = text;
        this.authorName = authorName;
        this.channelId = channelId;
        this.target = target.startsWith('#') ? target : '#' + target;
        this.date = date;
        this.authorProfileImageUrl = authorProfileImageUrl;
        this.isMembership = isMembership;
        this.isVerified = isVerified;
        this.isModerator = isModerator;
        this.isOwner = isOwner;
        this.parts = parts;
        this.authorColor = authorColor;
    }

    static deserialize(json: string): YTChatMessage {
        const data = JSON.parse(json);
        console.debug('[YTChatMessage] raw payload:', data);
        return new YTChatMessage(
            data.id,
            data.text,
            data.authorName,
            data.channelId,
            data.target,
            new Date(data.date),
            data.authorProfileImageUrl,
            data.isMembership,
            data.isVerified,
            data.isModerator,
            data.isOwner,
            data.parts,
            data.authorColor
        );
    }
}

export function parseMessage(rawLine: string): HeheMessage {
    try {
        const data = JSON.parse(rawLine);
        if (data.type === 'system') {
            return SystemMessage.deserialize(rawLine);
        }
        if (data.type === 'ytchat') {
            return YTChatMessage.deserialize(rawLine);
        }
        return HeheChatMessage.deserialize(rawLine);
    } catch {
        return HeheChatMessage.deserialize(rawLine);
    }
}

export function isSystemMessage(rawLine: string): boolean {
    try {
        const data = JSON.parse(rawLine);
        return data.type === 'system';
    } catch {
        return false;
    }
}

export function isSystemMessageType(msg: HeheMessage) {
    return msg.type === 'system';
}

export function isYTChatMessageType(msg: HeheMessage) {
    return msg.type === 'ytchat';
}

export interface SmartFilterConfig {
    enabled: boolean;
    skipEmoteOnly: boolean;
    skipReplies: boolean;
    skipShort: boolean;
    minWords: number;
    skipLong: boolean;
    maxWords: number;
    skipLinks: boolean;
    skipSpam: boolean;
}

function isRepetitiveText(text: string): boolean {
    // ponytail: naive heuristic, revisit if it misfires on real chat samples
    const words = text.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length >= 3) {
        const counts = new Map<string, number>();
        for (const word of words) {
            counts.set(word, (counts.get(word) || 0) + 1);
        }
        const maxCount = Math.max(...counts.values());
        if (maxCount >= 3 && maxCount / words.length > 0.5) {
            return true;
        }
    }
    const collapsed = text.replace(/(.)\1{2,}/g, '$1');
    return text.length >= 6 && collapsed.length / text.length < 0.5;
}

export function shouldReadMessage(msg: HeheChatMessage, filter: SmartFilterConfig): boolean {
    const text = msg.text.trim();

    if (filter.skipEmoteOnly && msg.parts.every(p => p.type === 'emote' || p.type === 'cheermote' || !p.text.trim())) {
        return false;
    }
    if (filter.skipReplies && msg.replyParentMessageId) {
        return false;
    }
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (filter.skipShort && wordCount < filter.minWords) {
        return false;
    }
    if (filter.skipLong && wordCount > filter.maxWords) {
        return false;
    }
    if (filter.skipLinks && text.split(/\s+/).some(word => word.startsWith('http://') || word.startsWith('https://'))) {
        return false;
    }
    if (filter.skipSpam && isRepetitiveText(text)) {
        return false;
    }
    return true;
}

const SPAM_WINDOW_MS = 30_000;
const COPYPASTA_BUFFER_SIZE = 20;

class SpamTracker {
    private lastByUser = new Map<string, { text: string; date: number }>();
    private recent: { text: string; user: string; date: number }[] = [];

    private normalize(text: string): string {
        return text.trim().toLowerCase();
    }

    isRepeatFromUser(user: string, text: string, now: number): boolean {
        const normalized = this.normalize(text);
        const last = this.lastByUser.get(user);
        this.lastByUser.set(user, { text: normalized, date: now });
        return !!last && last.text === normalized && now - last.date < SPAM_WINDOW_MS;
    }

    isCopypasta(user: string, text: string, now: number): boolean {
        const normalized = this.normalize(text);
        this.recent = this.recent.filter(entry => now - entry.date < SPAM_WINDOW_MS);
        const isDuplicate = this.recent.some(entry => entry.user !== user && entry.text === normalized);
        this.recent.push({ text: normalized, user, date: now });
        if (this.recent.length > COPYPASTA_BUFFER_SIZE) {
            this.recent.shift();
        }
        return isDuplicate;
    }
}

export const ttsSpamTracker = new SpamTracker();
