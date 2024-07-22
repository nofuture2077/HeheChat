import { ChatMessage } from '@twurple/chat';
import { ChatMessageComp } from './ChatMessage';

interface ChatProps {
    messages: ChatMessage[]
    setReplyMsg: (msg?: ChatMessage) => void;
    deletedMessages: {[id: string]: boolean };
    openModView: (msg: ChatMessage) => void;
    moderatedChannel: {[id: string]: boolean };
    deleteMessage: (channelId: string, messageId: string) => void;
    timeoutUser: (channelId: string, userId: string, duration: number, reason: string) => void;
    banUser: (channelId: string, userId: string, reason: string) => void;
}

export function Chat(props: ChatProps) {
    return props.messages.map(msg => <ChatMessageComp key={msg.id} msg={msg} openModView={props.openModView} moderatedChannel={props.moderatedChannel} timeoutUser={props.timeoutUser} banUser={props.banUser} deletedMessages={props.deletedMessages} deleteMessage={props.deleteMessage} setReplyMsg={props.setReplyMsg}/>);
}