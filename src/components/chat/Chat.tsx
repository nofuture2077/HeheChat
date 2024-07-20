import { ChatMessage } from '@twurple/chat';
import { ChatMessageComp } from './ChatMessage';

interface ChatProps {
    messages: ChatMessage[]
}

export function Chat(props: ChatProps) {
    return props.messages.map(msg => <ChatMessageComp key={msg.id} msg={msg}/>);
}