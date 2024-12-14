import { ChatMessageComp } from './ChatMessage';
import { SystemMessageComp } from './systemmessage';
import { HeheMessage, SystemMessage, isSystemMessageType, HeheChatMessage } from '../../commons/message';
import { ModActions } from './mod/modactions';

interface ChatProps {
    messages: HeheMessage[]
    setReplyMsg: (msg?: HeheChatMessage) => void;
    deletedMessages: {[id: string]: boolean };
    openModView: (msg: HeheChatMessage) => void;
    moderatedChannel: {[id: string]: boolean };
    modActions: ModActions;
}

export function Chat(props: ChatProps) {
    return props.messages.map(msg => {
        if (isSystemMessageType(msg)) {
            return <SystemMessageComp key={msg.id} msg={msg as SystemMessage} modActions={props.modActions} moderatedChannel={props.moderatedChannel}/>;
        }
        const chatMsg = (msg as HeheChatMessage);
        return <ChatMessageComp key={msg.id} msg={chatMsg} openModView={props.openModView} moderatedChannel={props.moderatedChannel} modActions={props.modActions} deletedMessages={props.deletedMessages} setReplyMsg={props.setReplyMsg}/>
    });
}
