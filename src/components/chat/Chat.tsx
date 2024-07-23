import { ChatMessage, parseTwitchMessage } from '@twurple/chat';
import { ChatMessageComp } from './ChatMessage';
import { SystemMessageComp } from './systemmessage';
import { generateGUID } from '../commons';

export type HeheMessage = ChatMessage | SystemMessage;

export class SystemMessage {
    type: 'system';
    subType: 'delete' | 'timeout' | 'ban' | 'raid';
    id: string;
    text: string;
    target: string;
    channelId: string;
    userId: string;
    date: Date;
    rawLine: string;

    constructor(channel: string, text: string, date: Date, subType: 'delete' | 'timeout' | 'ban' | 'raid', channelId: string, userId: string, id?: string) {
        this.type = 'system';
        this.target = '#' + channel;
        this.channelId = channelId;
        this.userId = userId;
        this.id = id || generateGUID();
        this.text = text;
        this.subType = subType;
        this.date = date;
        this.rawLine = [this.type, channel, this.date, this.id, this.subType, this.channelId, this.userId, this.text].join('$$$');
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
    return new SystemMessage(parts[1], parts[7], new Date(Date.parse(parts[2])), parts[4] as 'delete' | 'timeout' | 'ban' | 'raid', parts[5], parts[6], parts[3]);
}

export function isSystemMessage(rawLine: string): boolean {
    return rawLine.startsWith('system$$$')
}

function isSystemMessageType(msg: HeheMessage) {
    return (msg as SystemMessage).type === 'system';
}

export interface ModActions {
    deleteMessage: (channelId: string, messageId: string) => void;
    timeoutUser: (channelId: string, userId: string, duration: number, reason: string) => void;
    banUser: (channelId: string, userId: string, reason: string) => void;
    shoutoutUser: (channelId: string, userId: string) => void;
}

interface ChatProps {
    messages: HeheMessage[]
    setReplyMsg: (msg?: ChatMessage) => void;
    deletedMessages: {[id: string]: boolean };
    openModView: (msg: ChatMessage) => void;
    moderatedChannel: {[id: string]: boolean };
    modActions: ModActions;
}

export function Chat(props: ChatProps) {
    return props.messages.map(msg => {
        if (isSystemMessageType(msg)) {
            return <SystemMessageComp key={msg.id} msg={msg as SystemMessage} modActions={props.modActions} moderatedChannel={props.moderatedChannel}/>;
        }
        const chatMsg = (msg as ChatMessage);
        return <ChatMessageComp key={msg.id} msg={chatMsg} openModView={props.openModView} moderatedChannel={props.moderatedChannel} modActions={props.modActions} deletedMessages={props.deletedMessages} setReplyMsg={props.setReplyMsg}/>
    });
}