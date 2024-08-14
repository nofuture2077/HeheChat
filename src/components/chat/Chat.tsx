import { ChatMessage } from '@twurple/chat';
import { ChatMessageComp } from './ChatMessage';
import { SystemMessageComp } from './systemmessage';
import { HeheMessage, SystemMessage, isSystemMessageType } from '@/commons/message';
import { ModActions } from './mod/modactions';

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