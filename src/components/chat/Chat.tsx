import { ChatMessageComp } from './ChatMessage';
import { SystemMessageComp } from './systemmessage';
import { YTChatMessageComp } from './YTChatMessage';
import { HeheMessage, SystemMessage, isSystemMessageType, isYTChatMessageType, HeheChatMessage, YTChatMessage } from '../../commons/message';
import { ModActions } from './mod/modactions';

interface ChatProps {
    messages: HeheMessage[]
    setReplyMsg: (msg?: HeheChatMessage) => void;
    deletedMessages: {[id: string]: boolean };
    openModView: (channel: string, channelId: string, username: string) => void;
    moderatedChannel: {[id: string]: boolean };
    modActions: ModActions;
}

export function Chat(props: ChatProps) {
    return props.messages.map(msg => {
        if (isSystemMessageType(msg)) {
            return <SystemMessageComp key={"system-" + msg.id} msg={msg as SystemMessage} modActions={props.modActions} moderatedChannel={props.moderatedChannel}/>;
        }
        if (isYTChatMessageType(msg)) {
            return <YTChatMessageComp key={"ytchat-" + msg.id} msg={msg as YTChatMessage} />;
        }
        const chatMsg = (msg as HeheChatMessage);
        return <ChatMessageComp key={msg.id} msg={chatMsg} openModView={props.openModView} moderatedChannel={props.moderatedChannel} modActions={props.modActions} deletedMessages={props.deletedMessages} setReplyMsg={props.setReplyMsg}/>
    });
}
