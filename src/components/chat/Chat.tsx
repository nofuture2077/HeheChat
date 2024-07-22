import { ChatMessage } from '@twurple/chat';
import { ChatMessageComp } from './ChatMessage';

interface ChatProps {
    messages: ChatMessage[]
    setReplyMsg: (msg?: ChatMessage) => void;
    deletedMessages: {[id: string]: boolean };
}

export function Chat(props: ChatProps) {
    return props.messages.map(msg => <ChatMessageComp key={msg.id} msg={msg} deletedMessages={props.deletedMessages} setReplyMsg={props.setReplyMsg}/>);
}