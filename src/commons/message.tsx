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
        msgType?: string
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
            data.msgType
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

export class YTChatMessage {
    type: 'ytchat' = 'ytchat';
    id: string;
    text: string;
    authorName: string;
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
        isOwner?: boolean
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
    }

    static deserialize(json: string): YTChatMessage {
        const data = JSON.parse(json);
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
            data.isOwner
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
