import { ChatMessage, parseTwitchMessage } from '@twurple/chat';
import { generateGUID } from '@/commons/helper';
import { EventType, EventMainType } from '@/commons/events';
import { ModActionType } from '@/components/chat/mod/modactions';

export type HeheMessage = ChatMessage | SystemMessage;

export type SystemMessageType = ModActionType | EventType;
export type SystemMessageMainType = ModActionType | EventMainType;

export class SystemMessage {
    type: 'system';
    subType: SystemMessageType;
    id: string;
    text: string;
    target: string;
    channelId: string;
    userId: string;
    date: Date;
    rawLine: string;

    constructor(channel: string, text: string, date: Date, subType: SystemMessageType, channelId: string, userId: string, id?: string) {
        this.type = 'system';
        this.target = '#' + channel;
        this.channelId = channelId;
        this.userId = userId;
        this.id = id || generateGUID();
        this.text = text;
        this.subType = subType;
        this.date = date;
        this.rawLine = [this.type, channel, this.date.getTime(), this.id, this.subType, this.channelId, this.userId, this.text].join('$$$');
    }
}

export function parseMessage(rawLine: string): HeheMessage {
    if (isSystemMessage(rawLine)) {
        return parseSystemMessage(rawLine);
    }
    return parseTwitchMessage(rawLine) as ChatMessage;
}

export function parseSystemMessage(rawLine: string): SystemMessage {
    const parts = rawLine.split('$$$');
    return new SystemMessage(parts[1], parts[7], new Date(Number(parts[2]) || Date.parse(parts[2])), parts[4] as 'delete' | 'timeout' | 'ban' | 'raid', parts[5], parts[6], parts[3]);
}

export function isSystemMessage(rawLine: string): boolean {
    return rawLine.startsWith('system$$$')
}

export function isSystemMessageType(msg: HeheMessage) {
    return (msg as SystemMessage).type === 'system';
}