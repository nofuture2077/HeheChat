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
    date: Date;
    rawLine: string;

    constructor(channel: string, text: string, date: Date, subType: 'delete' | 'timeout' | 'ban' | 'raid', id?: string) {
        this.type = 'system';
        this.target = '#' + channel;
        this.id = id || generateGUID();
        this.text = text;
        this.subType = subType;
        this.date = date;
        this.rawLine = [this.type, channel, this.date, this.id, this.subType, this.text].join('$$$');
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
    return new SystemMessage(parts[1], parts[5], new Date(Date.parse(parts[2])), parts[4] as 'delete' | 'timeout' | 'ban' | 'raid', parts[3]);
}

export function isSystemMessage(rawLine: string): boolean {
    return rawLine.startsWith('system$$$')
}

function isSystemMessageType(msg: HeheMessage) {
    return (msg as SystemMessage).type === 'system';
}

interface ChatProps {
    messages: HeheMessage[]
    setReplyMsg: (msg?: ChatMessage) => void;
    deletedMessages: {[id: string]: boolean };
    openModView: (msg: ChatMessage) => void;
    moderatedChannel: {[id: string]: boolean };
    deleteMessage: (channelId: string, messageId: string) => void;
    timeoutUser: (channelId: string, userId: string, duration: number, reason: string) => void;
    banUser: (channelId: string, userId: string, reason: string) => void;
}

export function Chat(props: ChatProps) {
    return props.messages.map(msg => {
        if (isSystemMessageType(msg)) {
            return <SystemMessageComp key={msg.id} msg={msg as SystemMessage}/>;
        }
        const chatMsg = (msg as ChatMessage);
        return <ChatMessageComp key={msg.id} msg={chatMsg} openModView={props.openModView} moderatedChannel={props.moderatedChannel} timeoutUser={props.timeoutUser} banUser={props.banUser} deletedMessages={props.deletedMessages} deleteMessage={props.deleteMessage} setReplyMsg={props.setReplyMsg}/>
    });
}