import { generateGUID } from './helper';
import { EventType, EventMainType } from './events';
import { ModActionType } from '../components/chat/mod/modactions';

export type HeheMessage = HeheChatMessage | SystemMessage;
export type SevenTVMessage = "sevenTVAdded" | "sevenTVRemoved";
export type StreamEventType = "streamOnline" | "streamOffline";
export type SystemMessageType = ModActionType | EventType | StreamEventType | SevenTVMessage;
export type SystemMessageMainType = ModActionType | EventMainType | StreamEventType | SevenTVMessage;

interface UserInfo {
    displayName: string;
    userId: string;
    userName: string;
    color?: string;
    badges: Map<string, string>;
    isMod: boolean;
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
    rawLine: string;

    constructor(
        id: string,
        text: string,
        parts: ParsedMessagePart[],
        target: string,
        date: Date,
        userInfo: UserInfo,
        channelId: string,
        isFirst?: boolean,
        isHighlight?: boolean
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
        this.rawLine = this.serialize();
    }

    private serialize(): string {
        const badges = this.userInfo?.badges instanceof Map ? 
            Array.from(this.userInfo.badges.entries()) : 
        [];
        return JSON.stringify({
            type: this.type,
            id: this.id,
            text: this.text,
            target: this.target,
            date: this.date.getTime(),
            userInfo: {
                ...this.userInfo,
                badges
            },
            parts: this.parts,
            channelId: this.channelId,
            isFirst: this.isFirst,
            isHighlight: this.isHighlight
        });
    }

    static deserialize(json: string): HeheChatMessage {
        const data = JSON.parse(json);
        const userInfo = {
            ...data.userInfo,
            badges: new Map(Array.isArray(data.userInfo?.badges) ? data.userInfo.badges : [])
        };
        return new HeheChatMessage(
            data.id,
            data.text,
            data.parts,
            data.target,
            new Date(data.date),
            userInfo,
            data.channelId,
            data.isFirst,
            data.isHighlight
        );
    }

    static fromParts(
        text: string,
        parts: ParsedMessagePart[],
        target: string,
        userInfo: UserInfo,
        channelId: string,
        isFirst?: boolean,
        isHighlight?: boolean
    ): HeheChatMessage {
        return new HeheChatMessage(
            generateGUID(),
            text,
            parts,
            target,
            new Date(),
            userInfo,
            channelId,
            isFirst,
            isHighlight
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

export function parseMessage(rawLine: string): HeheMessage {
    if (isSystemMessage(rawLine)) {
        return SystemMessage.deserialize(rawLine);
    }
    return HeheChatMessage.deserialize(rawLine);
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
