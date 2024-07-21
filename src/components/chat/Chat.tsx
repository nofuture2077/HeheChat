import { ChatMessage } from '@twurple/chat';
import { ChatMessageComp } from './ChatMessage';

interface ChatProps {
    messages: ChatMessage[]
    setReplyMsg: (msg?: ChatMessage) => void;
}

export function Chat(props: ChatProps) {
    return props.messages.map(msg => <ChatMessageComp key={msg.id} msg={msg} setReplyMsg={props.setReplyMsg}/>);
}